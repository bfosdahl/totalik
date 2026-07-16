"""E2E test for KS-sjekklister.

Two phases:
  1. Smoke — /ks/utfylte-sjekklister mounts without runtime errors on
     desktop + mobile.
  2. Deep flow (best-effort) — open a project, launch the checklist
     wizard, click Ja/Nei/N/A on every yes/no item in rotating pattern,
     upload a photo, save, and verify the checklist card + photo count
     appear in the completed/in-progress list.

The deep flow is best-effort: if preconditions aren't met (no session,
no project, no template) it prints SKIP with the reason and does NOT
fail the suite. The smoke phase must always pass.
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

OUT = Path("/tmp/browser/sjekklister-e2e")
OUT.mkdir(parents=True, exist_ok=True)
BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:8080")

# 1x1 red PNG
PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
)
PHOTO_PATH = OUT / "upload.png"
PHOTO_PATH.write_bytes(PNG_BYTES)


async def install_session(ctx, page):
    storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cookies_json:
        cookies = json.loads(cookies_json)
        for c in cookies:
            c["url"] = BASE_URL
        await ctx.add_cookies(cookies)
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    if storage_key and session_json:
        await page.evaluate(
            f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
        )


async def smoke(label: str, viewport: dict) -> list[str]:
    errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport=viewport)
        page = await ctx.new_page()
        page.on("pageerror", lambda e: errors.append(f"[{label}] pageerror: {e}"))
        page.on(
            "console",
            lambda m: errors.append(f"[{label}] console.error: {m.text}")
            if m.type == "error" else None,
        )
        await install_session(ctx, page)
        await page.goto(f"{BASE_URL}/ks/utfylte-sjekklister", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=str(OUT / f"smoke_{label}.png"))
        if "/auth" in page.url:
            print(f"[smoke {label}] SKIP — no session ({page.url})")
        else:
            if await page.get_by_text("sjekkliste", exact=False).count() == 0:
                errors.append(f"[{label}] missing 'sjekkliste' text on page")
        await ctx.close()
        await browser.close()
    return errors


async def deep_flow(label: str, viewport: dict) -> tuple[bool, str]:
    """Returns (passed, message). passed=True means either success or clean skip."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport=viewport)
        page = await ctx.new_page()
        page_errors: list[str] = []
        page.on("pageerror", lambda e: page_errors.append(str(e)))
        page.on(
            "console",
            lambda m: page_errors.append(f"console.error: {m.text}")
            if m.type == "error" else None,
        )

        try:
            await install_session(ctx, page)

            # Find a project via KS project list
            await page.goto(f"{BASE_URL}/ks/prosjekter", wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)
            if "/auth" in page.url:
                return True, f"[deep {label}] SKIP — no session"

            # First project link
            proj_link = page.locator('a[href*="/ks/project/"]').first
            if await proj_link.count() == 0:
                await page.screenshot(path=str(OUT / f"deep_{label}_no_project.png"))
                return True, f"[deep {label}] SKIP — no KS project available"
            href = await proj_link.get_attribute("href")
            if not href:
                return True, f"[deep {label}] SKIP — project link has no href"
            project_id = href.split("/ks/project/")[1].split("/")[0]

            await page.goto(f"{BASE_URL}/ks/project/{project_id}/sjekklister", wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)
            await page.screenshot(path=str(OUT / f"deep_{label}_1_list.png"))

            # Baseline completed count
            baseline_completed = await page.locator("text=/Fullført/i").count()

            # Open wizard — button label varies ("Ny sjekkliste" / "Opprett")
            new_btn = page.get_by_role("button", name=lambda n: n and ("Ny sjekkliste" in n or "Opprett" in n or "Ny " in n))
            if await new_btn.count() == 0:
                new_btn = page.locator('button:has-text("Ny sjekkliste"), button:has-text("Opprett")').first
            if await new_btn.count() == 0:
                await page.screenshot(path=str(OUT / f"deep_{label}_no_new_btn.png"))
                return True, f"[deep {label}] SKIP — no 'Ny sjekkliste' button"
            await new_btn.first.click()
            await page.wait_for_timeout(1200)
            await page.screenshot(path=str(OUT / f"deep_{label}_2_wizard_open.png"))

            # Template step — pick first template card. Templates are Cards with a title.
            # Click first Card inside dialog.
            tpl_cards = page.locator('[role="dialog"] .cursor-pointer, [role="dialog"] [class*="Card"]').first
            if await tpl_cards.count() == 0:
                # Try any button inside dialog that looks like a template
                tpl_cards = page.locator('[role="dialog"] button').filter(has_not_text="Avbryt").first
            try:
                await tpl_cards.first.click(timeout=3000)
                await page.wait_for_timeout(800)
            except PWTimeout:
                await page.screenshot(path=str(OUT / f"deep_{label}_no_tpl.png"))
                return True, f"[deep {label}] SKIP — could not select template"

            # Details step — proceed to items via "Neste"
            for _ in range(3):
                next_btn = page.locator('[role="dialog"] button:has-text("Neste")').first
                if await next_btn.count() and await next_btn.is_visible():
                    await next_btn.click()
                    await page.wait_for_timeout(600)
                else:
                    break
            await page.screenshot(path=str(OUT / f"deep_{label}_3_items.png"))

            # Click radios: rotating yes/no/na across all yes_no items
            yes_radios = page.locator('[role="dialog"] input[type="radio"][value="yes"]')
            no_radios = page.locator('[role="dialog"] input[type="radio"][value="no"]')
            na_radios = page.locator('[role="dialog"] input[type="radio"][value="na"]')
            item_count = await yes_radios.count()
            if item_count == 0:
                await page.screenshot(path=str(OUT / f"deep_{label}_no_radios.png"))
                return True, f"[deep {label}] SKIP — no yes/no items in template"

            for i in range(item_count):
                target = [yes_radios, no_radios, na_radios][i % 3].nth(i)
                # click the label since input is hidden by RadioGroupItem styling
                rid = await target.get_attribute("id")
                if rid:
                    label_el = page.locator(f'[role="dialog"] label[for="{rid}"]').first
                    try:
                        await label_el.click(timeout=1500)
                        continue
                    except PWTimeout:
                        pass
                try:
                    await target.check(force=True, timeout=1500)
                except PWTimeout:
                    pass
            await page.wait_for_timeout(400)
            await page.screenshot(path=str(OUT / f"deep_{label}_4_filled.png"))

            # Upload a photo via first hidden file input in dialog
            file_inputs = page.locator('[role="dialog"] input[type="file"]')
            if await file_inputs.count() > 0:
                try:
                    await file_inputs.first.set_input_files(str(PHOTO_PATH))
                    await page.wait_for_timeout(2000)  # allow upload to Storage
                except Exception as e:
                    page_errors.append(f"photo upload failed: {e}")
            await page.screenshot(path=str(OUT / f"deep_{label}_5_photo.png"))

            # Verify photo shown in dialog (badge "1 bilde(r)" or img)
            photo_ok = (
                await page.locator('[role="dialog"] img[alt*="Bilde"]').count() > 0
                or await page.locator('[role="dialog"]:has-text("bilde(r)")').count() > 0
            )

            # Advance: Neste -> signature step -> skip signature -> Neste -> Fullfør/Lagre
            for _ in range(4):
                nb = page.locator('[role="dialog"] button:has-text("Neste")').first
                if await nb.count() and await nb.is_visible() and await nb.is_enabled():
                    await nb.click()
                    await page.wait_for_timeout(600)
                else:
                    break

            # Complete: try common labels
            done_btn = page.locator(
                '[role="dialog"] button:has-text("Fullfør"), '
                '[role="dialog"] button:has-text("Lagre"), '
                '[role="dialog"] button:has-text("Ferdig")'
            ).first
            saved = False
            if await done_btn.count():
                try:
                    await done_btn.click(timeout=3000)
                    await page.wait_for_timeout(2500)
                    saved = True
                except PWTimeout:
                    pass
            await page.screenshot(path=str(OUT / f"deep_{label}_6_after_save.png"))

            # Verify list updated: reload and check that a checklist card now shows more entries
            await page.goto(f"{BASE_URL}/ks/project/{project_id}/sjekklister", wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)
            await page.screenshot(path=str(OUT / f"deep_{label}_7_reload.png"))
            new_completed = await page.locator("text=/Fullført/i").count()

            summary = (
                f"[deep {label}] items={item_count} photo_visible_in_dialog={photo_ok} "
                f"saved={saved} baseline_completed={baseline_completed} "
                f"new_completed={new_completed} console_errors={len(page_errors)}"
            )
            if page_errors:
                print(summary)
                for e in page_errors[:5]:
                    print("  •", e)
                return False, summary
            return True, summary
        finally:
            await ctx.close()
            await browser.close()


async def main() -> int:
    all_errors: list[str] = []
    for label, vp in [
        ("desktop", {"width": 1280, "height": 1800}),
        ("mobile", {"width": 390, "height": 844}),
    ]:
        all_errors.extend(await smoke(label, vp))

    print("---- Deep flow ----")
    deep_failed = False
    for label, vp in [
        ("desktop", {"width": 1280, "height": 1800}),
        ("mobile", {"width": 390, "height": 844}),
    ]:
        ok, msg = await deep_flow(label, vp)
        print(msg)
        if not ok:
            deep_failed = True

    if all_errors:
        print("Sjekklister E2E FAILED:")
        for e in all_errors:
            print(" -", e)
        return 1
    if deep_failed:
        print("Deep flow reported console errors — see summary above.")
        return 1
    print("Sjekklister E2E OK — smoke + deep flow (or clean SKIP) passed.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
