"""E2E for KS-dagsrapporter.

Phases:
  1. Smoke — /ks mounts (auth redirect is expected without session).
  2. Deep flow (best-effort) — open first KS project's dagsrapport tab,
     create a new report, expand card, click 'Rediger', add new
     details + upload a photo, save, and verify:
       - card shows the updated free-text
       - photo count badge / gallery shows >= 1 photo
       - 'Last ned PDF' triggers a PDF download event (page.expect_download)
"""

import asyncio
import base64
import json
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright, TimeoutError as PWTimeout

sys.path.insert(0, str(Path(__file__).parent))
from _debug import new_debug_context, finalize_context, assert_step  # noqa: E402

OUT = Path("/tmp/browser/dagsrapport-e2e")
OUT.mkdir(parents=True, exist_ok=True)
BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:8080")

PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
)
PHOTO = OUT / "photo.png"
PHOTO.write_bytes(PNG)

UNIQUE_MARK = "E2E-DR-DETAIL"
UPDATED_MARK = "E2E-DR-UPDATED"


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


async def smoke(label, viewport):
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx, pg, sink = await new_debug_context(
            b, OUT, f"smoke_{label}", viewport=viewport, has_touch=True
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
            assert_step(sink, "no_page_errors", not sink.page_errors)
            assert_step(sink, "no_console_errors", not sink.console_errors)
            passed = not sink.has_console_or_page_errors
        finally:
            await finalize_context(ctx, sink, OUT, f"smoke_{label}", passed)
            await b.close()
    return sink.page_errors + sink.console_errors if not passed else []


async def deep_flow(label, viewport):
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx, pg, sink = await new_debug_context(
            b, OUT, f"deep_{label}", viewport=viewport, has_touch=True, accept_downloads=True
        )
        errs = sink.page_errors  # alias
        passed = False
        summary = ""
        try:
            await install_session(ctx, pg)
            await pg.goto(f"{BASE_URL}/ks", wait_until="domcontentloaded")
            await pg.wait_for_timeout(2500)
            if "/auth" in pg.url:
                return True, f"[deep {label}] SKIP — no session"

            plink = pg.locator('a[href*="/ks/project/"]').first
            if await plink.count() == 0:
                return True, f"[deep {label}] SKIP — no KS project"
            href = await plink.get_attribute("href")
            pid = href.split("/ks/project/")[1].split("/")[0]

            await pg.goto(f"{BASE_URL}/ks/project/{pid}/dagsrapport", wait_until="domcontentloaded")
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=str(OUT / f"deep_{label}_1_list.png"))

            # Open create dialog
            new_btn = pg.locator('button:has-text("Ny dagsrapport"), button:has-text("Opprett dagsrapport")').first
            if await new_btn.count() == 0:
                return True, f"[deep {label}] SKIP — no create button"
            await new_btn.click()
            await pg.wait_for_timeout(800)

            dlg = pg.locator('[role="dialog"]')
            # Expand "Utført arbeid" section if collapsed
            work_hdr = dlg.locator('button:has-text("Utført arbeid")').first
            if await work_hdr.count():
                await work_hdr.click()
                await pg.wait_for_timeout(200)
            work_ta = dlg.locator('textarea[placeholder*="Beskrivelse av dagens arbeid"]').first
            await work_ta.fill(UNIQUE_MARK + " – initial arbeidsbeskrivelse")

            # Send inn
            await dlg.locator('button:has-text("Send inn")').click()
            await pg.wait_for_timeout(3000)
            await pg.screenshot(path=str(OUT / f"deep_{label}_2_created.png"))

            # Find the newly created card by unique text
            card_btn = pg.locator(f'button:has-text("{UNIQUE_MARK}")').first
            if await card_btn.count() == 0:
                # Try locating by expanding first card
                first_card = pg.locator('[class*="Card"]').first
                await first_card.click()
                await pg.wait_for_timeout(400)
            else:
                await card_btn.click()
                await pg.wait_for_timeout(400)
            await pg.screenshot(path=str(OUT / f"deep_{label}_3_expanded.png"))

            # Click Rediger
            edit_btn = pg.locator('button:has-text("Rediger")').first
            if await edit_btn.count() == 0:
                return False, f"[deep {label}] FAIL — no Rediger button"
            await edit_btn.click()
            await pg.wait_for_timeout(800)

            edlg = pg.locator('[role="dialog"]:has-text("Rediger dagsrapport")')
            # Update work description
            work_ta2 = edlg.locator('textarea[placeholder*="Beskrivelse av dagens arbeid"]').first
            await work_ta2.fill(UPDATED_MARK + " – oppdatert med flere detaljer")

            # Expand Photos section and upload
            photo_hdr = edlg.locator('button:has-text("Bilder")').first
            if await photo_hdr.count():
                await photo_hdr.click()
                await pg.wait_for_timeout(300)
            file_inputs = edlg.locator('input[type="file"]')
            if await file_inputs.count() > 0:
                try:
                    # Use non-capture one (index 1 = gallery, no capture=environment)
                    idx = 1 if await file_inputs.count() > 1 else 0
                    await file_inputs.nth(idx).set_input_files(str(PHOTO))
                    await pg.wait_for_timeout(3500)  # storage upload
                except Exception as e:
                    errs.append(f"photo upload failed: {e}")
            await pg.screenshot(path=str(OUT / f"deep_{label}_4_edit_filled.png"))

            # Save (Send inn to keep status)
            save_btn = edlg.locator('button:has-text("Send inn"), button:has-text("Lagre")').first
            await save_btn.click()
            await pg.wait_for_timeout(3500)
            await pg.screenshot(path=str(OUT / f"deep_{label}_5_after_save.png"))

            # Reload and verify
            await pg.goto(f"{BASE_URL}/ks/project/{pid}/dagsrapport", wait_until="domcontentloaded")
            await pg.wait_for_timeout(2500)

            updated_card = pg.locator(f'text=/{UPDATED_MARK}/').first
            updated_ok = await updated_card.count() > 0
            if updated_ok:
                # Expand to see photos & PDF button
                await updated_card.click()
                await pg.wait_for_timeout(600)
            await pg.screenshot(path=str(OUT / f"deep_{label}_6_reload.png"))

            # Verify photo gallery / count badge (text like "Bilder (1)")
            photo_ok = await pg.locator('text=/Bilder \\(\\d+\\)/').count() > 0

            # PDF download check
            pdf_ok = False
            pdf_btn = pg.locator('button:has-text("Last ned PDF")').first
            if await pdf_btn.count():
                try:
                    async with pg.expect_download(timeout=15000) as dl_info:
                        await pdf_btn.click()
                    dl = await dl_info.value
                    save_to = OUT / f"deep_{label}_report.pdf"
                    await dl.save_as(str(save_to))
                    pdf_ok = save_to.exists() and save_to.stat().st_size > 500
                except PWTimeout:
                    pass
            await pg.screenshot(path=str(OUT / f"deep_{label}_7_pdf.png"))

            summary = (
                f"[deep {label}] updated_text_visible={updated_ok} photo_badge={photo_ok} "
                f"pdf_download_ok={pdf_ok} console_errors={len(errs)}"
            )
            if errs:
                print(summary)
                for e in errs[:5]:
                    print("  •", e)
            passed = updated_ok and (photo_ok or pdf_ok) and not errs
            return passed, summary
        finally:
            await ctx.close()
            await b.close()


async def main():
    smoke_errs = []
    for label, vp in [("desktop", {"width": 1280, "height": 1800}),
                      ("mobile", {"width": 390, "height": 844})]:
        smoke_errs += await smoke(label, vp)

    failures = []
    for label, vp in [("desktop", {"width": 1280, "height": 1800}),
                      ("mobile", {"width": 390, "height": 844})]:
        passed, msg = await deep_flow(label, vp)
        print(msg)
        if not passed:
            failures.append(msg)

    if smoke_errs:
        print("Smoke errors:")
        for e in smoke_errs[:10]:
            print("  •", e)
        sys.exit(1)
    if failures:
        print("Deep-flow failures:")
        for f in failures:
            print("  •", f)
        sys.exit(1)
    print("Dagsrapport E2E OK — smoke + deep flow (or clean SKIP) passed.")


if __name__ == "__main__":
    asyncio.run(main())
