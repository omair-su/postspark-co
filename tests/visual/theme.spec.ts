import { test, expect, type Page } from "@playwright/test";

/**
 * Theme regression: verifies that both the dark (default) and light themes
 * render correctly on key public + dashboard-shell routes, and that the
 * inline init script prevents any theme flash on first paint.
 *
 * Dashboard routes redirect to /auth when unauthenticated — the login shell
 * still lives inside the dashboard-shell layer for /auth, which is what we
 * screenshot here. That keeps the test hermetic (no fixture user needed)
 * while still exercising the dashboard themed surfaces.
 */

const ROUTES: Array<{ name: string; path: string }> = [
  { name: "landing", path: "/" },
  { name: "auth", path: "/auth" },
  { name: "pricing", path: "/pricing" },
];

async function primeTheme(page: Page, theme: "dark" | "light") {
  // Seed localStorage on the same origin before the app boots so the inline
  // init script picks it up on the very first navigation.
  await page.addInitScript((t) => {
    try { localStorage.setItem("theme", t); } catch {}
  }, theme);
}

async function freeze(page: Page) {
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`,
  });
  await page.evaluate(() => (document as any).fonts?.ready);
}

for (const theme of ["dark", "light"] as const) {
  test.describe(`theme: ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await primeTheme(page, theme);
    });

    test(`no theme flash on first paint (${theme})`, async ({ page }) => {
      // Capture the html attributes as early as possible after navigation.
      await page.goto("/", { waitUntil: "commit" });
      const state = await page.evaluate(() => ({
        cls: document.documentElement.className,
        dataTheme: document.documentElement.getAttribute("data-theme"),
        colorScheme: document.documentElement.style.colorScheme,
      }));
      if (theme === "dark") {
        expect(state.cls).toContain("dark");
        expect(state.dataTheme).toBe("dark");
        expect(state.colorScheme).toBe("dark");
      } else {
        expect(state.cls).not.toMatch(/\bdark\b/);
        expect(state.dataTheme).toBe("light");
        expect(state.colorScheme).toBe("light");
      }
    });

    for (const { name, path } of ROUTES) {
      test(`${name} renders in ${theme}`, async ({ page }, testInfo) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await freeze(page);
        // Sanity: body background must match theme family (dark = navy, light = warm-white).
        const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        const rgb = bg.match(/\d+/g)?.map(Number) ?? [];
        const luma = rgb.length >= 3 ? 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] : 0;
        if (theme === "dark") expect(luma).toBeLessThan(80);
        else expect(luma).toBeGreaterThan(200);
        await expect(page).toHaveScreenshot(`${name}-${theme}-${testInfo.project.name}.png`, {
          fullPage: false,
          maxDiffPixelRatio: 0.02,
        });
      });
    }
  });
}
