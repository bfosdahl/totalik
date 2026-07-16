"""Shared debug utilities for E2E specs.

Provides:
  * new_debug_context(browser, out_dir, label, **kw) -> (ctx, page, sink)
    - Enables tracing (screenshots + snapshots + sources).
    - Records video for the entire context under {out_dir}/{label}/video/.
    - Wires pageerror + console-error + failed-request listeners into `sink`.
  * DebugSink — collects errors/warnings/network failures and writes a
    structured log on finalize().
  * finalize_context(ctx, sink, out_dir, label, passed) — always saves the
    console/network log; saves the trace and keeps the video only when the
    run failed (to keep artifact size sane on green runs).
  * assert_step(sink, name, ok, detail="") — records a pass/fail step to
    the sink; call this liberally so failure artifacts pinpoint the step.

Usage:
    from _debug import new_debug_context, finalize_context, assert_step

    ctx, page, sink = await new_debug_context(browser, OUT, label,
                                              viewport=vp, has_touch=True)
    try:
        # ... test body ...
        assert_step(sink, "created_report", card_visible,
                    detail=f"card text: {UNIQUE_MARK}")
        passed = card_visible and photo_ok
    finally:
        await finalize_context(ctx, sink, OUT, label, passed)
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


async def launch_browser(playwright, headless: bool = True):
    """Launch the engine named by the E2E_BROWSER env var.

    Supported values: 'chromium' (default), 'webkit', 'firefox'.
    Centralised so every spec runs on whichever engine the CI matrix picks,
    giving us Chromium + WebKit coverage against mobile/touch regressions.
    """
    name = (os.environ.get("E2E_BROWSER") or "chromium").strip().lower()
    if name == "webkit":
        engine = playwright.webkit
    elif name == "firefox":
        engine = playwright.firefox
    else:
        engine = playwright.chromium
    print(f"[debug] launching browser: {name}", flush=True)
    return await engine.launch(headless=headless)


# --- Device profiles ---------------------------------------------------------
# Lightweight device presets we test against. Kept in-repo (instead of
# importing playwright.devices) so behaviour is stable across Playwright
# versions and clearly scoped to what our SJA/checklist flows actually need.
DEVICE_PROFILES: dict[str, dict] = {
    "iphone": {
        "label": "iPhone 13",
        "viewport": {"width": 390, "height": 844},
        "device_scale_factor": 3,
        "is_mobile": True,
        "has_touch": True,
        "user_agent": (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 "
            "Mobile/15E148 Safari/604.1"
        ),
    },
    "android": {
        "label": "Pixel 7 (Android)",
        "viewport": {"width": 412, "height": 915},
        "device_scale_factor": 2.625,
        "is_mobile": True,
        "has_touch": True,
        "user_agent": (
            "Mozilla/5.0 (Linux; Android 14; Pixel 7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/126.0.0.0 Mobile Safari/537.36"
        ),
    },
    "desktop": {
        "label": "Desktop 1280",
        "viewport": {"width": 1280, "height": 1800},
        "device_scale_factor": 1,
        "is_mobile": False,
        "has_touch": False,
        "user_agent": None,
    },
}


def selected_device_profiles() -> list[tuple[str, dict]]:
    """Return the list of (name, profile) to run.

    Honours env E2E_DEVICE: unset/'all' → iphone + android;
    'iphone'|'android'|'desktop' → just that one;
    comma-list → each named profile.
    Firefox/webkit combos that don't support is_mobile are auto-relaxed.
    """
    raw = (os.environ.get("E2E_DEVICE") or "all").strip().lower()
    if raw in ("", "all"):
        names = ["iphone", "android"]
    else:
        names = [n.strip() for n in raw.split(",") if n.strip() in DEVICE_PROFILES]
    engine = (os.environ.get("E2E_BROWSER") or "chromium").strip().lower()
    out: list[tuple[str, dict]] = []
    for n in names:
        prof = dict(DEVICE_PROFILES[n])
        # Firefox in Playwright doesn't support is_mobile / device_scale_factor
        if engine == "firefox":
            prof.pop("is_mobile", None)
            prof.pop("device_scale_factor", None)
        out.append((n, prof))
    return out


def context_kwargs_from_profile(profile: dict) -> dict:
    """Build kwargs safe to pass to browser.new_context() from a profile."""
    kw: dict = {"viewport": profile["viewport"], "has_touch": profile.get("has_touch", False)}
    if profile.get("user_agent"):
        kw["user_agent"] = profile["user_agent"]
    if profile.get("device_scale_factor") is not None:
        kw["device_scale_factor"] = profile["device_scale_factor"]
    if profile.get("is_mobile") is not None:
        kw["is_mobile"] = profile["is_mobile"]
    return kw


@dataclass
class DebugSink:
    label: str
    started_at: float = field(default_factory=time.time)
    page_errors: list[str] = field(default_factory=list)
    console_errors: list[str] = field(default_factory=list)
    console_warnings: list[str] = field(default_factory=list)
    failed_requests: list[dict[str, Any]] = field(default_factory=list)
    steps: list[dict[str, Any]] = field(default_factory=list)

    @property
    def has_console_or_page_errors(self) -> bool:
        return bool(self.page_errors or self.console_errors)

    @property
    def failed_steps(self) -> list[dict[str, Any]]:
        return [s for s in self.steps if not s["ok"]]


def _wire_listeners(page, sink: DebugSink) -> None:
    def _on_console(msg):
        if msg.type == "error":
            sink.console_errors.append(msg.text)
        elif msg.type == "warning":
            sink.console_warnings.append(msg.text)

    def _on_request_failed(req):
        try:
            sink.failed_requests.append({
                "url": req.url,
                "method": req.method,
                "failure": (req.failure or ""),
                "resource_type": req.resource_type,
            })
        except Exception:
            pass

    page.on("pageerror", lambda e: sink.page_errors.append(str(e)))
    page.on("console", _on_console)
    page.on("requestfailed", _on_request_failed)


def _env_bool(name: str) -> bool | None:
    """Parse a boolean env var. Returns None when unset so callers can
    distinguish 'no override' from an explicit true/false."""
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return None
    return raw.strip().lower() in ("1", "true", "yes", "on", "touch")


def resolve_has_touch(default: bool) -> bool:
    """Env-driven override for `has_touch` so CI can flip touch/mouse
    without editing each spec. Set E2E_HAS_TOUCH=1|0 to force."""
    override = _env_bool("E2E_HAS_TOUCH")
    return default if override is None else override


async def new_debug_context(browser, out_dir: Path, label: str, **ctx_kwargs):
    """Create a fully instrumented context + page. Returns (ctx, page, sink).

    Honours the E2E_HAS_TOUCH env var: when set it overrides any `has_touch`
    passed by the caller, so the same spec runs under both touch and mouse
    contexts across CI matrix rows.
    """
    default_touch = bool(ctx_kwargs.get("has_touch", False))
    ctx_kwargs["has_touch"] = resolve_has_touch(default_touch)

    run_dir = Path(out_dir) / label
    (run_dir / "video").mkdir(parents=True, exist_ok=True)

    ctx_kwargs.setdefault("record_video_dir", str(run_dir / "video"))
    ctx = await browser.new_context(**ctx_kwargs)
    await ctx.tracing.start(screenshots=True, snapshots=True, sources=True)

    page = await ctx.new_page()
    sink = DebugSink(label=label)
    sink.steps.append({
        "name": "context_input_mode",
        "ok": True,
        "detail": f"has_touch={ctx_kwargs['has_touch']} browser={os.environ.get('E2E_BROWSER', 'chromium')}",
    })
    _wire_listeners(page, sink)
    return ctx, page, sink


def assert_step(sink: DebugSink, name: str, ok: bool, detail: str = "") -> bool:
    """Record a step outcome. Returns `ok` so it chains inside conditions."""
    sink.steps.append({"name": name, "ok": bool(ok), "detail": detail})
    marker = "✅" if ok else "❌"
    line = f"  {marker} {name}"
    if detail:
        line += f" — {detail}"
    print(line, flush=True)
    return ok


async def finalize_context(ctx, sink: DebugSink, out_dir: Path, label: str, passed: bool) -> None:
    """Stop tracing + save log. Keeps trace/video only on failure."""
    run_dir = Path(out_dir) / label
    run_dir.mkdir(parents=True, exist_ok=True)

    # Always write structured log (small, cheap, invaluable on failure)
    log_payload = {
        "label": sink.label,
        "passed": passed,
        "duration_s": round(time.time() - sink.started_at, 2),
        "page_errors": sink.page_errors,
        "console_errors": sink.console_errors,
        "console_warnings": sink.console_warnings[:50],
        "failed_requests": sink.failed_requests[:100],
        "steps": sink.steps,
    }
    (run_dir / "log.json").write_text(json.dumps(log_payload, indent=2, ensure_ascii=False))

    # Human-readable summary for quick eyeballing in the Actions UI artifact tree
    lines = [f"label={sink.label}", f"passed={passed}",
             f"duration_s={log_payload['duration_s']}",
             f"page_errors={len(sink.page_errors)}",
             f"console_errors={len(sink.console_errors)}",
             f"failed_requests={len(sink.failed_requests)}",
             "", "STEPS:"]
    for s in sink.steps:
        m = "PASS" if s["ok"] else "FAIL"
        lines.append(f"  [{m}] {s['name']}" + (f" — {s['detail']}" if s['detail'] else ""))
    if sink.page_errors:
        lines += ["", "PAGE ERRORS:"] + [f"  • {e}" for e in sink.page_errors[:20]]
    if sink.console_errors:
        lines += ["", "CONSOLE ERRORS:"] + [f"  • {e}" for e in sink.console_errors[:20]]
    if sink.failed_requests:
        lines += ["", "FAILED REQUESTS:"] + [
            f"  • {r['method']} {r['url']} — {r['failure']}"
            for r in sink.failed_requests[:20]
        ]
    (run_dir / "summary.txt").write_text("\n".join(lines))

    trace_path = run_dir / "trace.zip"
    try:
        if not passed:
            await ctx.tracing.stop(path=str(trace_path))
        else:
            await ctx.tracing.stop()
    except Exception as e:
        print(f"[debug] tracing.stop failed: {e}")

    try:
        await ctx.close()
    except Exception:
        pass

    # On green runs, drop the video dir to keep artifacts light.
    if passed:
        video_dir = run_dir / "video"
        try:
            for f in video_dir.glob("*"):
                f.unlink()
            video_dir.rmdir()
        except Exception:
            pass
