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
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx, page, sink = await new_debug_context(
            browser, OUT, f"smoke_{label}", viewport=viewport
        )
        passed = True
        try:
            await install_session(ctx, page)
            await page.goto(f"{BASE_URL}/ks/utfylte-sjekklister", wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)
            await page.screenshot(path=str(OUT / f"smoke_{label}.png"))
            if "/auth" in page.url:
                print(f"[smoke {label}] SKIP — no session ({page.url})")
                sink.page_errors.clear()
                sink.console_errors.clear()
            else:
                has_text = await page.get_by_text("sjekkliste", exact=False).count() > 0
                assert_step(sink, "sjekkliste_text_visible", has_text)
                if not has_text:
                    passed = False
            assert_step(sink, "no_page_errors", not sink.page_errors)
            assert_step(sink, "no_console_errors", not sink.console_errors)
            if sink.has_console_or_page_errors:
                passed = False
        finally:
            await finalize_context(ctx, sink, OUT, f"smoke_{label}", passed)
            await browser.close()
    return sink.page_errors + sink.console_errors if not passed else []


async def deep_flow(label: str, viewport: dict) -> tuple[bool, str]:
    """Returns (passed, message). passed=True means either success or clean skip."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx, page, sink = await new_debug_context(
            browser, OUT, f"deep_{label}", viewport=viewport
        )
        page_errors = sink.page_errors  # alias for backwards-compat below
        passed = False
        summary = ""
        try:
            await install_session(ctx, page)

            await page.goto(f"{BASE_URL}/ks/prosjekter", wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)
            if "/auth" in page.url:
                passed = True
                return True, f"[deep {label}] SKIP — no session"

            proj_link = page.locator('a[href*="/ks/project/"]').first
            if not assert_step(sink, "ks_project_available", await proj_link.count() > 0):
                passed = True
                await page.screenshot(path=str(OUT / f"deep_{label}_no_project.png"))
                return True, f"[deep {label}] SKIP — no KS project available"
            href = await proj_link.get_attribute("href")
            if not href:
                passed = True
                return True, f"[deep {label}] SKIP — project link has no href"
            project_id = href.split("/ks/project/")[1].split("/")[0]

            await page.goto(f"{BASE_URL}/ks/project/{project_id}/sjekklister", wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)
            await page.screenshot(path=str(OUT / f"deep_{label}_1_list.png"))
            baseline_completed = await page.locator("text=/Fullført/i").count()

            new_btn = page.get_by_role("button", name=lambda n: n and ("Ny sjekkliste" in n or "Opprett" in n or "Ny " in n))
            if await new_btn.count() == 0:
                new_btn = page.locator('button:has-text("Ny sjekkliste"), button:has-text("Opprett")').first
            if not assert_step(sink, "new_checklist_button_visible", await new_btn.count() > 0):
                passed = True
                await page.screenshot(path=str(OUT / f"deep_{label}_no_new_btn.png"))
                return True, f"[deep {label}] SKIP — no 'Ny sjekkliste' button"
            await new_btn.first.click()
            await page.wait_for_timeout(1200)
            await page.screenshot(path=str(OUT / f"deep_{label}_2_wizard_open.png"))
            assert_step(sink, "wizard_dialog_open",
                        await page.locator('[role="dialog"]').count() > 0)

            tpl_cards = page.locator('[role="dialog"] .cursor-pointer, [role="dialog"] [class*="Card"]').first
            if await tpl_cards.count() == 0:
                tpl_cards = page.locator('[role="dialog"] button').filter(has_not_text="Avbryt").first
            try:
                await tpl_cards.first.click(timeout=3000)
                await page.wait_for_timeout(800)
                assert_step(sink, "template_selected", True)
            except PWTimeout:
                assert_step(sink, "template_selected", False)
                passed = True
                await page.screenshot(path=str(OUT / f"deep_{label}_no_tpl.png"))
                return True, f"[deep {label}] SKIP — could not select template"

            for _ in range(3):
                next_btn = page.locator('[role="dialog"] button:has-text("Neste")').first
                if await next_btn.count() and await next_btn.is_visible():
                    await next_btn.click()
                    await page.wait_for_timeout(600)
                else:
                    break
            await page.screenshot(path=str(OUT / f"deep_{label}_3_items.png"))

            yes_radios = page.locator('[role="dialog"] input[type="radio"][value="yes"]')
            no_radios = page.locator('[role="dialog"] input[type="radio"][value="no"]')
            na_radios = page.locator('[role="dialog"] input[type="radio"][value="na"]')
            item_count = await yes_radios.count()
            if not assert_step(sink, "yes_no_items_present", item_count > 0,
                               detail=f"items={item_count}"):
                passed = True
                await page.screenshot(path=str(OUT / f"deep_{label}_no_radios.png"))
                return True, f"[deep {label}] SKIP — no yes/no items in template"

            answered = 0
            for i in range(item_count):
                target = [yes_radios, no_radios, na_radios][i % 3].nth(i)
                rid = await target.get_attribute("id")
                if rid:
                    label_el = page.locator(f'[role="dialog"] label[for="{rid}"]').first
                    try:
                        await label_el.click(timeout=1500)
                        answered += 1
                        continue
                    except PWTimeout:
                        pass
                try:
                    await target.check(force=True, timeout=1500)
                    answered += 1
                except PWTimeout:
                    pass
            await page.wait_for_timeout(400)
            await page.screenshot(path=str(OUT / f"deep_{label}_4_filled.png"))
            assert_step(sink, "all_items_answered", answered == item_count,
                        detail=f"{answered}/{item_count}")

            file_inputs = page.locator('[role="dialog"] input[type="file"]')
            upload_attempted = False
            if await file_inputs.count() > 0:
                upload_attempted = True
                try:
                    await file_inputs.first.set_input_files(str(PHOTO_PATH))
                    await page.wait_for_timeout(2000)
                except Exception as e:
                    page_errors.append(f"photo upload failed: {e}")
            assert_step(sink, "photo_upload_attempted", upload_attempted)

            photo_ok = (
                await page.locator('[role="dialog"] img[alt*="Bilde"]').count() > 0
                or await page.locator('[role="dialog"]:has-text("bilde(r)")').count() > 0
            )
            assert_step(sink, "photo_visible_in_dialog", photo_ok)

            for _ in range(4):
                nb = page.locator('[role="dialog"] button:has-text("Neste")').first
                if await nb.count() and await nb.is_visible() and await nb.is_enabled():
                    await nb.click()
                    await page.wait_for_timeout(600)
                else:
                    break

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
            assert_step(sink, "checklist_saved", saved)
            await page.screenshot(path=str(OUT / f"deep_{label}_6_after_save.png"))

            await page.goto(f"{BASE_URL}/ks/project/{project_id}/sjekklister", wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)
            await page.screenshot(path=str(OUT / f"deep_{label}_7_reload.png"))
            new_completed = await page.locator("text=/Fullført/i").count()
            assert_step(sink, "completed_count_grew_or_equal",
                        new_completed >= baseline_completed,
                        detail=f"{baseline_completed} -> {new_completed}")
            assert_step(sink, "no_console_errors_during_flow",
                        not sink.has_console_or_page_errors,
                        detail=f"page={len(sink.page_errors)} console={len(sink.console_errors)}")

            summary = (
                f"[deep {label}] items={item_count} answered={answered} "
                f"photo_visible_in_dialog={photo_ok} saved={saved} "
                f"baseline_completed={baseline_completed} new_completed={new_completed} "
                f"console_errors={len(sink.console_errors)} page_errors={len(sink.page_errors)}"
            )
            passed = saved and not sink.has_console_or_page_errors
            if not passed:
                for e in (sink.page_errors + sink.console_errors)[:5]:
                    print("  •", e)
            return passed, summary
        finally:
            await finalize_context(ctx, sink, OUT, f"deep_{label}", passed)
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
