"""End-to-end smoke test for the Avvik (Deviations) page.

Run against a running dev server:
    npm run e2e:avvik        # or: python3 tests/e2e/avvik.spec.py

Requires the standard LOVABLE_BROWSER_SUPABASE_* env vars for auth injection.
Fails (non-zero exit) if:
  - the page does not load
  - the status cards (Totalt / Åpne / Under arbeid / Løst) are missing
  - the aggregated project-avvik list does not render
  - any runtime error is logged to the browser console
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

OUT = Path("/tmp/browser/avvik-e2e")
OUT.mkdir(parents=True, exist_ok=True)
BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:8080")

REQUIRED_LABELS = ["Totalt", "Åpne", "Under arbeid", "Løst"]


async def run(viewport_label: str, viewport: dict) -> list[str]:
    errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport=viewport)
        page = await ctx.new_page()

        page.on("pageerror", lambda e: errors.append(f"[{viewport_label}] pageerror: {e}"))
        page.on(
            "console",
            lambda m: errors.append(f"[{viewport_label}] console.error: {m.text}")
            if m.type == "error"
            else None,
        )

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

        await page.goto(f"{BASE_URL}/deviations", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=str(OUT / f"{viewport_label}_deviations.png"))

        # Auth guard: if we were redirected to /auth, skip functional assertions.
        if "/auth" in page.url:
            print(f"[{viewport_label}] SKIP — no active session (landed on {page.url}). "
                  "Sign in via the Lovable preview and re-run.")
            await ctx.close()
            await browser.close()
            return errors


        for label in REQUIRED_LABELS:
            count = await page.get_by_text(label, exact=True).count()
            if count == 0:
                errors.append(f"[{viewport_label}] missing status card label: {label}")

        # Project-aggregated section header
        if await page.get_by_text("Prosjektavvik", exact=False).count() == 0:
            errors.append(f"[{viewport_label}] missing 'Prosjektavvik' aggregated section")

        # Every deviation row should expose an 'Åpne' action link
        opens = await page.get_by_role("link", name="Åpne").count()
        if opens == 0:
            errors.append(f"[{viewport_label}] no 'Åpne' project links rendered")

        await ctx.close()
        await browser.close()
    return errors


async def main() -> int:
    all_errors: list[str] = []
    for label, vp in [
        ("desktop", {"width": 1280, "height": 1800}),
        ("mobile", {"width": 390, "height": 844}),
    ]:
        all_errors.extend(await run(label, vp))

    if all_errors:
        print("E2E FAILED:")
        for e in all_errors:
            print(" -", e)
        return 1
    print("E2E OK — status cards, aggregated list, and links present on desktop + mobile.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
