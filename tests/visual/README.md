# Visual regression — landing page

Catches clipping, layout shifts, and color regressions on the creamy-luxury landing page.

## First-time setup
```bash
bun run test:visual:install   # downloads Chromium (~140MB)
bun run test:visual:update    # creates baseline screenshots
```

## On every change
```bash
bun run test:visual           # fails if any section diff > 1% pixels
```

## What it covers
- 11 landing sections × 4 viewports (375 / 768 / 1280 / 1536) = 44 snapshots
- Hard assertion: no `<section>` overflows the viewport at any breakpoint
- Compare slider: keyboard (`ArrowRight`, `Home`, `End`) and touch-drag still update the same `data-position` state

Snapshots live in `tests/visual/__snapshots__/`. Commit them after intentional design changes via `bun run test:visual:update`.
