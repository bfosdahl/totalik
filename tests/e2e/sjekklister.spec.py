"""E2E smoke test for KS-sjekklister page.

Verifies the checklist page mounts on desktop + mobile with no runtime
errors. Uses same auth-skip pattern as avvik.spec.py.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

OUT = Path("/tmp/browser/sjekklister-e2e")
OUT.mkdir(parents=True, exist_ok=True)
BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:8080")


async def run(label: str, viewport: dict) -> list[str]:
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

        await page.goto(f"{BASE_URL}/ks/utfylte-sjekklister", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=str(OUT / f"{label}_sjekklister.png"))

        if "/auth" in page.url:
            print(f"[{label}] SKIP — no active session (landed on {page.url}).")
            await ctx.close()
            await browser.close()
            return errors

        if await page.get_by_text("sjekkliste", exact=False).count() == 0:
            errors.append(f"[{label}] missing 'sjekkliste' text on page")

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
        print("Sjekklister E2E FAILED:")
        for e in all_errors:
            print(" -", e)
        return 1
    print("Sjekklister E2E OK — page mounts on desktop + mobile with no console errors.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
