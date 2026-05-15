import { test, expect, type Page } from "@playwright/test";

/**
 * Visual regression for the creamy-luxury landing page.
 *
 * Each cream section is screenshotted at every configured viewport
 * (mobile/tablet/desktop/wide). A second pass asserts no horizontal
 * overflow exists at any breakpoint — this catches clipping bugs even
 * when pixel diffs would pass.
 */

const SECTIONS: Array<{ name: string; selector: string }> = [
  { name: "hero", selector: "section:has(h1)" },
  { name: "compare-slider", selector: "[data-testid='hero-compare-slider']" },
  { name: "trusted-by", selector: "section:has(.luxury-chip:has-text('Creators'))" },
  { name: "before-after", selector: "section:has(h2:has-text('Infinite Content'))" },
  { name: "features", selector: "#features" },
  { name: "premium-suite", selector: "#premium-features" },
  { name: "how-it-works", selector: "#how-it-works" },
  { name: "pricing", selector: "#pricing" },
  { name: "testimonials", selector: "section:has(h2:has-text('Loved by'))" },
  { name: "faq", selector: "section:has(h2:has-text('Frequently Asked'))" },
  { name: "cta", selector: "section:has(h2:has-text('10× your content'))" },
];

async function freezePage(page: Page) {
  // Disable any remaining animations / blinking carets so screenshots are stable.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  });
  // Wait a tick so the disable has applied + fonts have settled.
  await page.evaluate(() => (document as any).fonts?.ready);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // Trigger lazy-loaded sections by scrolling through the page once.
  await page.evaluate(async () => {
    const total = document.documentElement.scrollHeight;
    const step = window.innerHeight;
    for (let y = 0; y < total; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await freezePage(page);
});

for (const { name, selector } of SECTIONS) {
  test(`section snapshot — ${name}`, async ({ page }, testInfo) => {
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    await expect(el).toHaveScreenshot(`${name}-${testInfo.project.name}.png`);
  });
}

test("no horizontal overflow on landing", async ({ page }) => {
  const overflow = await page.evaluate(() => {
    const vw = window.innerWidth;
    const docW = document.documentElement.scrollWidth;
    const offenders: Array<{ tag: string; w: number; left: number }> = [];
    document.querySelectorAll("section").forEach((s) => {
      const r = (s as HTMLElement).getBoundingClientRect();
      if (r.width > vw + 1 || r.left < -1 || r.right > vw + 1) {
        offenders.push({ tag: s.tagName + (s.id ? "#" + s.id : ""), w: r.width, left: r.left });
      }
    });
    return { vw, docW, offenders };
  });
  expect(overflow.offenders, JSON.stringify(overflow.offenders)).toEqual([]);
  expect(overflow.docW).toBeLessThanOrEqual(overflow.vw + 1);
});

test("compare slider responds to keyboard", async ({ page }) => {
  const track = page.locator("[data-testid='compare-track']");
  await track.scrollIntoViewIfNeeded();
  await track.focus();
  const start = Number(await track.getAttribute("data-position"));
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const after = Number(await track.getAttribute("data-position"));
  expect(after).toBeGreaterThan(start);
  await page.keyboard.press("Home");
  expect(Number(await track.getAttribute("data-position"))).toBe(6);
  await page.keyboard.press("End");
  expect(Number(await track.getAttribute("data-position"))).toBe(94);
});

test("compare slider responds to touch drag", async ({ page }) => {
  const track = page.locator("[data-testid='compare-track']");
  await track.scrollIntoViewIfNeeded();
  const box = await track.boundingBox();
  if (!box) throw new Error("compare track not visible");
  // Simulate a touch drag from center to ~25% across.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  const pos = Number(await track.getAttribute("data-position"));
  expect(pos).toBeLessThan(40);
  expect(pos).toBeGreaterThan(15);
});
