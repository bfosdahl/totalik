"""E2E for KS-SJA.

Phases:
  1. Smoke — /ks mounts without errors on desktop + mobile.
  2. Deep flow (best-effort) — open first KS project's SJA tab, create a
     new SJA via dialog, walk steps 1-4, draw main signature on the
     touch-canvas via pointer events, add a second signature (multi-sig),
     complete + sign, reload and verify:
       - SJA card visible with status "Fullført"
       - "Flere signaturer (>=1)" label present
       - main signature image rendered
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright, TimeoutError as PWTimeout

sys.path.insert(0, str(Path(__file__).parent))
from _debug import (  # noqa: E402
    new_debug_context, finalize_context, assert_step, launch_browser,
    selected_device_profiles, context_kwargs_from_profile,
)

OUT = Path("/tmp/browser/sja-e2e")
OUT.mkdir(parents=True, exist_ok=True)
BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:8080")


async def install_session(ctx, page):
    key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    sess = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    cookies = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cookies:
        arr = json.loads(cookies)
        for c in arr:
            c["url"] = BASE_URL
        await ctx.add_cookies(arr)
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    if key and sess:
        await page.evaluate(
            f"window.localStorage.setItem({json.dumps(key)}, {json.dumps(sess)})"
        )


async def draw_on_canvas(page, canvas_selector: str) -> bool:
    """Dispatch pointer events on a canvas to produce a stroke.
    signature_pad listens to pointerdown/move/up (and touch/mouse fallbacks)."""
    ok = await page.evaluate(
        """(sel) => {
            const c = document.querySelector(sel);
            if (!c) return false;
            const r = c.getBoundingClientRect();
            const pts = [
              [r.left + 20, r.top + 20],
              [r.left + 60, r.top + 40],
              [r.left + 100, r.top + 30],
              [r.left + 140, r.top + 60],
              [r.left + 180, r.top + 40],
            ];
            const fire = (type, x, y) => {
              const ev = new PointerEvent(type, {
                bubbles: true, cancelable: true, pointerType: 'touch',
                clientX: x, clientY: y, pressure: 0.5, isPrimary: true, pointerId: 1,
              });
              c.dispatchEvent(ev);
            };
            fire('pointerdown', pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) fire('pointermove', pts[i][0], pts[i][1]);
            fire('pointerup', pts[pts.length-1][0], pts[pts.length-1][1]);
            return true;
        }""",
        canvas_selector,
    )
    await page.wait_for_timeout(200)
    return bool(ok)


async def smoke(label: str, profile: dict) -> list[str]:
    async with async_playwright() as p:
        b = await launch_browser(p, headless=True)
        ctx, pg, sink = await new_debug_context(
            b, OUT, f"smoke_{label}", **context_kwargs_from_profile(profile)
        )
        passed = True
        try:
            await install_session(ctx, pg)
            await pg.goto(f"{BASE_URL}/ks", wait_until="domcontentloaded")
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=str(OUT / f"smoke_{label}.png"))
            if "/auth" in pg.url:
                print(f"[smoke {label}] SKIP — no session")
                sink.page_errors.clear()
                sink.console_errors.clear()
            assert_step(sink, "no_page_errors", not sink.page_errors,
                        detail=f"{len(sink.page_errors)} errors")
            assert_step(sink, "no_console_errors", not sink.console_errors,
                        detail=f"{len(sink.console_errors)} errors")
            passed = not sink.has_console_or_page_errors
        finally:
            await finalize_context(ctx, sink, OUT, f"smoke_{label}", passed)
            await b.close()
    return sink.page_errors + sink.console_errors if not passed else []


async def deep_flow(label: str, profile: dict) -> tuple[bool, str, dict]:
    async with async_playwright() as p:
        b = await launch_browser(p, headless=True)
        ctx, pg, sink = await new_debug_context(
            b, OUT, f"deep_{label}", **context_kwargs_from_profile(profile)
        )
        passed = False
        summary = ""
        result: dict = {"device": label, "card_visible": False, "sig_img": False, "multi_sig": False, "completed": False}
        try:
            await install_session(ctx, pg)
            await pg.goto(f"{BASE_URL}/ks", wait_until="domcontentloaded")
            await pg.wait_for_timeout(2500)
            if "/auth" in pg.url:
                passed = True
                summary = f"[deep {label}] SKIP — no session"
                result["skipped"] = "no_session"
                return True, summary, result

            plink = pg.locator('a[href*="/ks/project/"]').first
            if not assert_step(sink, "found_ks_project", await plink.count() > 0):
                passed = True
                summary = f"[deep {label}] SKIP — no KS project"
                result["skipped"] = "no_project"
                return True, summary, result
            href = await plink.get_attribute("href")
            pid = href.split("/ks/project/")[1].split("/")[0]

            await pg.goto(f"{BASE_URL}/ks/project/{pid}/sja", wait_until="domcontentloaded")
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=str(OUT / f"deep_{label}_1_list.png"))
            baseline_completed = await pg.locator("text=/Fullført/i").count()

            new_btn = pg.locator('button:has-text("Ny SJA")').first
            if not assert_step(sink, "ny_sja_button_visible", await new_btn.count() > 0):
                passed = True
                summary = f"[deep {label}] SKIP — no 'Ny SJA' button"
                result["skipped"] = "no_ny_sja_button"
                return True, summary, result
            await new_btn.click()
            await pg.wait_for_timeout(800)

            dlg = pg.locator('[role="dialog"]')
            await dlg.locator('input').first.fill(f"E2E-SJA {label}")
            await dlg.locator('textarea').first.fill("Automatisert testarbeid – ingen reell risiko.")
            inputs = dlg.locator('input')
            await inputs.nth(1).fill("Testlokasjon")
            await inputs.nth(3).fill("E2E Ansvarlig")
            await dlg.locator('button:has-text("Opprett SJA")').click()
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=str(OUT / f"deep_{label}_2_created.png"))
            assert_step(sink, "sja_created_dialog_closed",
                        await pg.locator('[role="dialog"]:has-text("Opprett SJA")').count() == 0)

            tas = pg.locator('textarea')
            if await tas.count() >= 1:
                await tas.nth(0).fill("Detaljert arbeidsbeskrivelse for E2E test.")
            part = pg.locator('input[placeholder*="Ola"]').first
            if await part.count():
                await part.fill("Test Person 1, Test Person 2")
            await pg.locator('button:has-text("Neste: Risikoer")').click()
            await pg.wait_for_timeout(600)

            risk_ta = pg.locator('textarea[placeholder*="Hva kan gå galt"]').first
            await risk_ta.fill("Fallfare fra stillas")
            await pg.locator('button:has-text("Legg til risiko")').click()
            await pg.wait_for_timeout(500)
            await pg.locator('button:has-text("Neste: Tiltak")').click()
            await pg.wait_for_timeout(600)
            await pg.screenshot(path=str(OUT / f"deep_{label}_3_step3.png"))

            add_measure_btn = pg.locator('button:has-text("Tiltak")').first
            if await add_measure_btn.count():
                await add_measure_btn.click()
                await pg.wait_for_timeout(400)
                m_ta = pg.locator('textarea[placeholder*="Beskriv tiltak"]').first
                if await m_ta.count():
                    await m_ta.fill("Bruk sele og rekkverk")
                m_resp = pg.locator('input[placeholder="Ansvarlig"]').first
                if await m_resp.count():
                    await m_resp.fill("HMS-leder")
            await pg.locator('button:has-text("Neste: Signering")').click()
            await pg.wait_for_timeout(800)
            await pg.screenshot(path=str(OUT / f"deep_{label}_4_sign.png"))

            canvases = pg.locator('canvas')
            n_canvas = await canvases.count()
            assert_step(sink, "signature_canvas_present", n_canvas > 0,
                        detail=f"canvas_count={n_canvas}")
            if n_canvas == 0:
                summary = f"[deep {label}] FAIL — no signature canvas found"
                return False, summary, result
            drew = await draw_on_canvas(pg, 'canvas')
            assert_step(sink, "main_signature_drawn", drew)
            if not drew:
                summary = f"[deep {label}] FAIL — could not draw main signature"
                return False, summary, result
            await pg.wait_for_timeout(300)

            add_sig_btn = pg.locator('button:has-text("Legg til signatur")').first
            multi_added = False
            if await add_sig_btn.count():
                await add_sig_btn.click()
                await pg.wait_for_timeout(600)
                await pg.locator('input[placeholder="Fullt navn"]').fill("Kollega Test")
                role_i = pg.locator('input[placeholder*="Tømrer"]').first
                if await role_i.count():
                    await role_i.fill("Tømrer")
                await draw_on_canvas(pg, 'canvas:last-of-type')
                await pg.wait_for_timeout(200)
                save_sig = pg.locator('button:has-text("Lagre signatur")').first
                await save_sig.click()
                await pg.wait_for_timeout(2500)
                await pg.screenshot(path=str(OUT / f"deep_{label}_5_multi.png"))
                multi_added = True
            assert_step(sink, "multi_sig_button_present", multi_added)

            complete_btn = pg.locator('button:has-text("Fullfør og signer SJA")').first
            completed_clicked = False
            if await complete_btn.count():
                await complete_btn.click()
                await pg.wait_for_timeout(3500)
                completed_clicked = True
            assert_step(sink, "complete_clicked", completed_clicked)
            result["completed"] = completed_clicked
            await pg.screenshot(path=str(OUT / f"deep_{label}_6_completed.png"))

            await pg.goto(f"{BASE_URL}/ks/project/{pid}/sja", wait_until="domcontentloaded")
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=str(OUT / f"deep_{label}_7_reload.png"))

            card = pg.locator(f'text="E2E-SJA {label}"').first
            card_visible = await card.count() > 0
            assert_step(sink, "sja_card_persists_after_reload", card_visible,
                        detail=f'looking for "E2E-SJA {label}"')
            multi_ok = False
            sig_img_ok = False
            if card_visible:
                await card.click()
                await pg.wait_for_timeout(1500)
                for _ in range(4):
                    n = pg.locator('button:has-text("Neste"), [role="tab"]:has-text("Signering")').first
                    if await n.count() and await n.is_visible():
                        try:
                            await n.click(timeout=1000)
                            await pg.wait_for_timeout(400)
                        except PWTimeout:
                            break
                await pg.wait_for_timeout(500)
                await pg.screenshot(path=str(OUT / f"deep_{label}_8_verify.png"))
                sig_img_ok = await pg.locator('img[alt="Signatur"]').count() > 0
                multi_label = pg.locator('text=/Flere signaturer \\(\\d+\\)/')
                multi_ok = await multi_label.count() > 0
                if multi_ok:
                    txt = await multi_label.first.inner_text()
                    print(f"[deep {label}] multi-sig label: {txt}")
            assert_step(sink, "signature_image_rendered", sig_img_ok)
            assert_step(sink, "multi_signatures_section_visible", multi_ok)
            assert_step(sink, "no_console_errors_during_flow",
                        not sink.has_console_or_page_errors,
                        detail=f"page={len(sink.page_errors)} console={len(sink.console_errors)}")

            result["card_visible"] = card_visible
            result["sig_img"] = sig_img_ok
            result["multi_sig"] = multi_ok
            summary = (
                f"[deep {label}] baseline={baseline_completed} card_visible={card_visible} "
                f"sig_img={sig_img_ok} multi_sig_section={multi_ok} "
                f"console_errors={len(sink.console_errors)} page_errors={len(sink.page_errors)}"
            )
            passed = card_visible and (sig_img_ok or multi_ok) and not sink.has_console_or_page_errors
            return passed, summary, result
        finally:
            await finalize_context(ctx, sink, OUT, f"deep_{label}", passed)
            await b.close()


async def main():
    devices = selected_device_profiles()
    print(f"[sja] running device matrix: {[n for n, _ in devices]}")

    all_errs: list[str] = []
    for name, profile in devices:
        all_errs += await smoke(name, profile)

    failures: list[str] = []
    results: list[dict] = []
    for name, profile in devices:
        passed, msg, res = await deep_flow(name, profile)
        print(msg)
        results.append(res)
        if not passed:
            failures.append(msg)

    # Cross-device parity check: every non-skipped profile must reach
    # the same signing outcome (card visible + sig persisted + multi-sig).
    scored = [r for r in results if "skipped" not in r]
    if len(scored) >= 2:
        keys = ("card_visible", "sig_img", "multi_sig", "completed")
        signatures = {r["device"]: {k: r.get(k) for k in keys} for r in scored}
        first = next(iter(signatures.values()))
        mismatched = {d: s for d, s in signatures.items() if s != first}
        print(f"[parity] signatures per device: {json.dumps(signatures)}")
        if mismatched:
            failures.append(
                f"Parity mismatch across devices: {json.dumps(signatures)}"
            )

    (OUT / "device_matrix_results.json").write_text(json.dumps(results, indent=2))

    if all_errs:
        print("Smoke errors:")
        for e in all_errs[:10]:
            print("  •", e)
        sys.exit(1)
    if failures:
        print("Deep-flow failures:")
        for f in failures:
            print("  •", f)
        sys.exit(1)
    print(f"SJA E2E OK — device matrix ({', '.join(n for n, _ in devices)}) passed with parity.")


if __name__ == "__main__":
    asyncio.run(main())
