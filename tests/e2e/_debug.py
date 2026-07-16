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


async def new_debug_context(browser, out_dir: Path, label: str, **ctx_kwargs):
    """Create a fully instrumented context + page. Returns (ctx, page, sink)."""
    run_dir = Path(out_dir) / label
    (run_dir / "video").mkdir(parents=True, exist_ok=True)

    ctx_kwargs.setdefault("record_video_dir", str(run_dir / "video"))
    ctx = await browser.new_context(**ctx_kwargs)
    await ctx.tracing.start(screenshots=True, snapshots=True, sources=True)

    page = await ctx.new_page()
    sink = DebugSink(label=label)
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
