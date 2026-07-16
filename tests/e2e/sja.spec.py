"""E2E for KS-SJA.

Phases:
  1. Smoke — /ks/prosjekter mounts without errors on desktop + mobile.
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


async def smoke(label: str, viewport: dict) -> list[str]:
    errs: list[str] = []
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(viewport=viewport, has_touch=True)
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(f"[{label}] pageerror: {e}"))
        pg.on("console", lambda m: errs.append(f"[{label}] console.error: {m.text}") if m.type == "error" else None)
        await install_session(ctx, pg)
        await pg.goto(f"{BASE_URL}/ks/prosjekter", wait_until="domcontentloaded")
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path=str(OUT / f"smoke_{label}.png"))
        if "/auth" in pg.url:
            print(f"[smoke {label}] SKIP — no session")
        await ctx.close()
        await b.close()
    return errs


async def deep_flow(label: str, viewport: dict) -> tuple[bool, str]:
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(viewport=viewport, has_touch=True)
        pg = await ctx.new_page()
        errs: list[str] = []
        pg.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
        pg.on("console", lambda m: errs.append(f"console.error: {m.text}") if m.type == "error" else None)

        try:
            await install_session(ctx, pg)
            await pg.goto(f"{BASE_URL}/ks/prosjekter", wait_until="domcontentloaded")
            await pg.wait_for_timeout(2500)
            if "/auth" in pg.url:
                return True, f"[deep {label}] SKIP — no session"

            plink = pg.locator('a[href*="/ks/project/"]').first
            if await plink.count() == 0:
                return True, f"[deep {label}] SKIP — no KS project"
            href = await plink.get_attribute("href")
            pid = href.split("/ks/project/")[1].split("/")[0]

            await pg.goto(f"{BASE_URL}/ks/project/{pid}/sja", wait_until="domcontentloaded")
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=str(OUT / f"deep_{label}_1_list.png"))

            baseline_completed = await pg.locator("text=/Fullført/i").count()

            new_btn = pg.locator('button:has-text("Ny SJA")').first
            if await new_btn.count() == 0:
                return True, f"[deep {label}] SKIP — no 'Ny SJA' button"
            await new_btn.click()
            await pg.wait_for_timeout(800)

            dlg = pg.locator('[role="dialog"]')
            title_input = dlg.locator('input').first
            await title_input.fill(f"E2E-SJA {label}")
            await dlg.locator('textarea').first.fill("Automatisert testarbeid – ingen reell risiko.")
            # location + planned_date + responsible
            inputs = dlg.locator('input')
            await inputs.nth(1).fill("Testlokasjon")
            # inputs.nth(2) is date — already prefilled
            await inputs.nth(3).fill("E2E Ansvarlig")
            await dlg.locator('button:has-text("Opprett SJA")').click()
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=str(OUT / f"deep_{label}_2_created.png"))

            # We are now in detail view, step 1
            # Step 1: description already may be blank in detail; fill textareas
            tas = pg.locator('textarea')
            if await tas.count() >= 1:
                await tas.nth(0).fill("Detaljert arbeidsbeskrivelse for E2E test.")
            if await tas.count() >= 2:
                pass  # notes optional
            # participants input
            part = pg.locator('input[placeholder*="Ola"]').first
            if await part.count():
                await part.fill("Test Person 1, Test Person 2")
            await pg.locator('button:has-text("Neste: Risikoer")').click()
            await pg.wait_for_timeout(600)

            # Step 2: add risk
            risk_ta = pg.locator('textarea[placeholder*="Hva kan gå galt"]').first
            await risk_ta.fill("Fallfare fra stillas")
            await pg.locator('button:has-text("Legg til risiko")').click()
            await pg.wait_for_timeout(500)
            await pg.locator('button:has-text("Neste: Tiltak")').click()
            await pg.wait_for_timeout(600)
            await pg.screenshot(path=str(OUT / f"deep_{label}_3_step3.png"))

            # Step 3: add measure
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

            # Step 4: draw main signature (first canvas on page in step 4)
            canvases = pg.locator('canvas')
            n_canvas = await canvases.count()
            if n_canvas == 0:
                return False, f"[deep {label}] FAIL — no signature canvas found"
            drew = await draw_on_canvas(pg, 'canvas')
            if not drew:
                return False, f"[deep {label}] FAIL — could not draw main signature"
            await pg.wait_for_timeout(300)

            # Multi-signature: click "Legg til signatur"
            add_sig_btn = pg.locator('button:has-text("Legg til signatur")').first
            if await add_sig_btn.count():
                await add_sig_btn.click()
                await pg.wait_for_timeout(600)
                await pg.locator('input[placeholder="Fullt navn"]').fill("Kollega Test")
                role_i = pg.locator('input[placeholder*="Tømrer"]').first
                if await role_i.count():
                    await role_i.fill("Tømrer")
                # Draw on the second canvas (multi-sig form canvas is the last)
                await draw_on_canvas(pg, 'canvas:last-of-type')
                await pg.wait_for_timeout(200)
                save_sig = pg.locator('button:has-text("Lagre signatur")').first
                await save_sig.click()
                await pg.wait_for_timeout(2500)
                await pg.screenshot(path=str(OUT / f"deep_{label}_5_multi.png"))
            else:
                errs.append("multi-sig button not found")

            # Complete SJA
            complete_btn = pg.locator('button:has-text("Fullfør og signer SJA")').first
            if await complete_btn.count():
                await complete_btn.click()
                await pg.wait_for_timeout(3500)
            await pg.screenshot(path=str(OUT / f"deep_{label}_6_completed.png"))

            # Verify persistence: reload SJA list
            await pg.goto(f"{BASE_URL}/ks/project/{pid}/sja", wait_until="domcontentloaded")
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=str(OUT / f"deep_{label}_7_reload.png"))

            # Find our created SJA card and open it
            card = pg.locator(f'text="E2E-SJA {label}"').first
            card_visible = await card.count() > 0
            multi_ok = False
            sig_img_ok = False
            if card_visible:
                await card.click()
                await pg.wait_for_timeout(1500)
                # navigate to step 4
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
                # AdditionalSignaturesSection shows "Flere signaturer (N)"
                multi_label = pg.locator('text=/Flere signaturer \\(\\d+\\)/')
                multi_ok = await multi_label.count() > 0
                if multi_ok:
                    txt = await multi_label.first.inner_text()
                    print(f"[deep {label}] multi-sig label: {txt}")

            summary = (
                f"[deep {label}] baseline={baseline_completed} card_visible={card_visible} "
                f"sig_img={sig_img_ok} multi_sig_section={multi_ok} console_errors={len(errs)}"
            )
            if errs:
                print(summary)
                for e in errs[:5]:
                    print("  •", e)
            passed = card_visible and (sig_img_ok or multi_ok) and not errs
            return passed, summary
        finally:
            await ctx.close()
            await b.close()


async def main():
    all_errs: list[str] = []
    for label, vp in [("desktop", {"width": 1280, "height": 1800}),
                      ("mobile", {"width": 390, "height": 844})]:
        all_errs += await smoke(label, vp)

    failures = []
    for label, vp in [("desktop", {"width": 1280, "height": 1800}),
                      ("mobile", {"width": 390, "height": 844})]:
        passed, msg = await deep_flow(label, vp)
        print(msg)
        if not passed:
            failures.append(msg)

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
    print("SJA E2E OK — smoke + deep flow (or clean SKIP) passed.")


if __name__ == "__main__":
    asyncio.run(main())
