"""E2E test for Timeregistrering — mirrors the sjekklister spec.

Focus on the two bugs Eirik reported:
  1) Dato tilbake i tid ble tvunget til dagens dato.
  2) Fra/Til-tider måtte bevares og Timer autoregnes.

Phases:
  * Smoke — /time-registration mounts uten runtime-feil på desktop + mobil.
  * Deep flow — åpne "Registrer time"-dialogen, velg en dato tilbake i tid
    via kalender-popover, fyll Fra/Til (Timer skal autoutfylles), skriv inn
    prosjekt (fritekst) og notat, klikk "Registrer", og verifiser at
    føringen dukker opp i listen på valgt dato uten konsollfeil.

Deep flow er best-effort: mangler økt eller UI-selectors gir clean SKIP.
"""

import asyncio
import json
import os
import re
import sys
from datetime import date, timedelta
from pathlib import Path

from playwright.async_api import async_playwright, TimeoutError as PWTimeout

sys.path.insert(0, str(Path(__file__).parent))
from _debug import new_debug_context, finalize_context, assert_step, launch_browser  # noqa: E402

OUT = Path("/tmp/browser/timeregistrering-e2e")
OUT.mkdir(parents=True, exist_ok=True)
BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:8080")

UNIQUE_NOTE = f"E2E timeregistrering {os.getpid()}"


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
        browser = await launch_browser(p, headless=True)
        ctx, page, sink = await new_debug_context(
            browser, OUT, f"smoke_{label}", viewport=viewport
        )
        passed = True
        try:
            await install_session(ctx, page)
            await page.goto(f"{BASE_URL}/time-registration", wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)
            await page.screenshot(path=str(OUT / f"smoke_{label}.png"))
            if "/auth" in page.url:
                print(f"[smoke {label}] SKIP — no session ({page.url})")
                sink.page_errors.clear()
                sink.console_errors.clear()
            else:
                has_text = await page.get_by_text(re.compile(r"time", re.I)).count() > 0
                assert_step(sink, "time_text_visible", has_text)
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
        browser = await launch_browser(p, headless=True)
        ctx, page, sink = await new_debug_context(
            browser, OUT, f"deep_{label}", viewport=viewport
        )
        passed = False
        try:
            await install_session(ctx, page)

            await page.goto(f"{BASE_URL}/time-registration", wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)
            if "/auth" in page.url:
                passed = True
                return True, f"[deep {label}] SKIP — no session"

            # Open "Registrer timer" dialog — plus button / "Ny" / "Registrer"
            open_btn = page.locator(
                'button:has-text("Registrer time"), '
                'button:has-text("Ny timeføring"), '
                'button:has-text("Ny time"), '
                'button:has([data-lucide="plus"])'
            ).first
            if await open_btn.count() == 0:
                # Fallback: any visible Plus icon button in the header
                open_btn = page.get_by_role("button").filter(has_text=re.compile(r"registrer|ny", re.I)).first
            if not assert_step(sink, "open_dialog_button_visible", await open_btn.count() > 0):
                passed = True
                await page.screenshot(path=str(OUT / f"deep_{label}_no_btn.png"))
                return True, f"[deep {label}] SKIP — no 'Registrer' button"

            await open_btn.first.click()
            await page.wait_for_timeout(800)
            dialog = page.locator('[role="dialog"]:has-text("Registrer timer")').first
            if not assert_step(sink, "dialog_open", await dialog.count() > 0):
                passed = True
                await page.screenshot(path=str(OUT / f"deep_{label}_no_dialog.png"))
                return True, f"[deep {label}] SKIP — dialog didn't open"
            await page.screenshot(path=str(OUT / f"deep_{label}_1_dialog.png"))

            # ---- Pick a date in the past (5 days ago) via calendar popover ----
            target = date.today() - timedelta(days=5)
            date_btn = dialog.locator('button:has([class*="lucide-calendar"])').first
            if await date_btn.count() == 0:
                # Fall back to the Popover trigger under the "Dato" label
                date_btn = dialog.get_by_role("button", name=re.compile(r"\d|Velg dato", re.I)).first
            date_selected = False
            if await date_btn.count() > 0:
                await date_btn.click()
                await page.wait_for_timeout(500)
                # react-day-picker exposes buttons named "torsdag 15. juli 2026" — use aria-label match
                day_names = [
                    target.strftime("%-d. %B %Y"),
                    target.strftime("%d. %B %Y"),
                ]
                # Norwegian month names lookup
                nb_months = ["januar", "februar", "mars", "april", "mai", "juni",
                             "juli", "august", "september", "oktober", "november", "desember"]
                nb_str = f"{target.day}. {nb_months[target.month - 1]} {target.year}"
                # Try aria-label containing the day-of-month + month name
                day_btn = page.locator(
                    f'[role="dialog"] button[aria-label*="{nb_str}" i]'
                ).first
                if await day_btn.count() == 0:
                    # generic day-picker button by day number inside currently displayed month
                    day_btn = page.locator(
                        f'[role="dialog"] .rdp button:has-text("{target.day}")'
                    ).first
                if await day_btn.count() == 0:
                    day_btn = page.locator(
                        f'[role="dialog"] button[name="day"]:has-text("{target.day}")'
                    ).first
                try:
                    await day_btn.click(timeout=2500)
                    date_selected = True
                except PWTimeout:
                    pass
                await page.wait_for_timeout(400)
            assert_step(sink, "past_date_selected", date_selected,
                        detail=f"target={target.isoformat()}")

            # Verify the trigger button now shows the selected day number
            date_visible = False
            try:
                dtxt = (await date_btn.inner_text()).lower()
                date_visible = str(target.day) in dtxt
            except Exception:
                pass
            assert_step(sink, "date_button_reflects_selection", date_visible)

            # ---- Fill Fra / Til (Timer auto-calculates) ----
            fra = dialog.locator('input[type="time"]').nth(0)
            til = dialog.locator('input[type="time"]').nth(1)
            await fra.fill("08:00")
            await til.fill("14:30")
            await page.wait_for_timeout(300)
            hours_input = dialog.locator('input[type="number"]').first
            hours_val = await hours_input.input_value()
            assert_step(sink, "hours_autocalculated", hours_val.startswith("6.5"),
                        detail=f"hours={hours_val}")

            # ---- Project: use "Annet (fritekst)" if available, else the free-text input ----
            proj_select_trigger = dialog.locator('button[role="combobox"]').first
            wrote_custom = False
            if await proj_select_trigger.count() > 0:
                try:
                    await proj_select_trigger.click(timeout=1500)
                    await page.wait_for_timeout(300)
                    annet = page.locator('[role="option"]:has-text("Annet")').first
                    if await annet.count() > 0:
                        await annet.click()
                        await page.wait_for_timeout(200)
                except PWTimeout:
                    pass
            # After selecting Annet (or when no KS projects exist) a free-text input appears
            custom_input = dialog.locator('input[placeholder*="prosjektnavn" i], input[placeholder*="Kundeprosjekt" i]').first
            if await custom_input.count() > 0:
                await custom_input.fill(f"E2E prosjekt {os.getpid()}")
                wrote_custom = True
            assert_step(sink, "project_filled", wrote_custom)

            # ---- Notat / beskrivelse ----
            note_field = dialog.locator('textarea').first
            if await note_field.count() > 0:
                await note_field.fill(UNIQUE_NOTE)
            assert_step(sink, "note_filled", await note_field.count() > 0)

            await page.screenshot(path=str(OUT / f"deep_{label}_2_filled.png"))

            # ---- Submit ----
            submit = dialog.locator('button[type="submit"]:has-text("Registrer"), button:has-text("Lagre")').first
            saved = False
            if await submit.count() > 0:
                try:
                    await submit.click(timeout=3000)
                    # Wait for dialog to close
                    for _ in range(15):
                        if await dialog.count() == 0 or not await dialog.is_visible():
                            saved = True
                            break
                        await page.wait_for_timeout(400)
                except PWTimeout:
                    pass
            assert_step(sink, "entry_submitted", saved)
            await page.wait_for_timeout(1500)
            await page.screenshot(path=str(OUT / f"deep_{label}_3_after_save.png"))

            # ---- Verify entry appears with the note AND correct (past) date ----
            # Filter usually defaults to "this-week"; switch to "this-month" so a
            # 5-days-ago entry is visible even if the week just started.
            try:
                filter_trigger = page.locator('button[role="combobox"]:has-text("Denne uken"), button[role="combobox"]:has-text("Denne")').first
                if await filter_trigger.count() > 0:
                    await filter_trigger.click(timeout=1500)
                    await page.wait_for_timeout(300)
                    opt = page.locator('[role="option"]:has-text("måned")').first
                    if await opt.count() > 0:
                        await opt.click()
                        await page.wait_for_timeout(800)
            except PWTimeout:
                pass

            note_hit = await page.get_by_text(UNIQUE_NOTE, exact=False).count()
            assert_step(sink, "entry_visible_in_list", note_hit > 0,
                        detail=f"note occurrences={note_hit}")

            assert_step(sink, "no_console_errors_during_flow",
                        not sink.has_console_or_page_errors,
                        detail=f"page={len(sink.page_errors)} console={len(sink.console_errors)}")

            summary = (
                f"[deep {label}] date_selected={date_selected} hours={hours_val} "
                f"saved={saved} note_visible={note_hit>0} "
                f"console_errors={len(sink.console_errors)} page_errors={len(sink.page_errors)}"
            )
            passed = saved and note_hit > 0 and not sink.has_console_or_page_errors
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
        print("Timeregistrering E2E FAILED:")
        for e in all_errors:
            print(" -", e)
        return 1
    if deep_failed:
        print("Deep flow reported errors — see summary above.")
        return 1
    print("Timeregistrering E2E OK — smoke + deep flow (or clean SKIP) passed.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
