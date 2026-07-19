## Fixes: Real brand icons, Spark polish, Billing rebuild, Image Studio icons

### 1) Real platform/brand icons everywhere
Replace emoji + generic Lucide icons with real brand SVGs from `react-icons/si` (Simple Icons — official brand marks) with brand colors:

- Twitter/X → `SiX` (#000/white)
- LinkedIn → `SiLinkedin` (#0A66C2)
- Instagram → `SiInstagram` (gradient pink/orange)
- Facebook → `SiFacebook` (#1877F2)
- TikTok → `SiTiktok` (black + cyan/pink accent)
- Threads → `SiThreads`
- YouTube → `SiYoutube` (#FF0000)
- Email Newsletter → `Mail` (lucide, refined) or `SiGmail` where email service
- Google SEO / SEO Summary → `SiGoogle` colored
- Video Script → `Clapperboard` (lucide) with gradient wash
- Podcast → `SiPodcastindex` or `Mic` premium
- Carousel → `Images` (lucide) premium

Create `src/components/BrandIcon.tsx` — single source that maps platform key → correct branded SVG with the right color + subtle rounded tile background. Replace usage in:
- `src/routes/dashboard.repurpose.tsx` (format picker)
- `src/components/PublishMenu.tsx`, `PostToLinkedInButton`, `PostToTikTokButton`
- `src/components/ConnectedAccountsCard.tsx`
- Any social pickers in Hook Lab, Shorts Studio, Reply generator, Landing v3 logo strip

Install `react-icons` (small, tree-shaken).

### 2) Spark Copilot: fix invisible text + premium redesign
Problem: chip labels in the quick-action grid are unreadable (dark violet on dark bg), and header contrast is off.

- File: `src/components/SparkCopilot.tsx`
- Fix quick-action chip: `text-white/90`, subtle violet glass bg (`bg-violet-500/10 border-violet-400/20 hover:bg-violet-500/20`), branded lucide icon left, one-line label right, no truncation.
- Redesign shell:
  - Glass panel: `bg-[#0F0B1F]/95 backdrop-blur-xl border border-violet-500/20`
  - Gradient header with AssistantOrb + "Spark" + subtitle + Claude 5 pill (already correct)
  - Message bubbles: assistant → soft violet glass; user → violet→magenta gradient with white text
  - Input: taller, rounded-2xl, violet ring on focus, send button = gradient circle with paper-plane
  - Add a subtle top-border glow, animated gradient underline on header
  - Footer meta text `text-white/50`
- Keep all existing logic (conversations, currentTool, contextContent) untouched.

### 3) Billing page: kill nested-app look, rebuild premium
Problem (screenshot 4): `dashboard.billing` route renders another sidebar+navbar inside the dashboard layout — looks like an iframe of the whole app.

Investigate `src/routes/dashboard.billing.tsx` — likely it imports `DashboardLayout` again or renders its own `<Navbar/><Sidebar/>`. Fix:
- Ensure it renders raw content only (parent `_authenticated/dashboard.tsx` already provides the shell).
- Remove any duplicate `<DashboardLayout>`, `<Navbar>`, `<Sidebar>` inside the page.

Redesign the billing page:
- `PageHeader` with title "Billing & Subscription" + subtle description
- Grid of premium cards (`bg-[#14142B]/80 border border-white/8 rounded-2xl shadow-[0_0_40px_-20px_rgba(124,58,237,0.5)]`):
  1. **Current Plan** — big plan name, status badge (Active/Canceled with correct colors), renew date, "Manage in portal" ghost button, "Upgrade" gradient primary button
  2. **Billing interval** — toggle Monthly / Annual (save 21%) with proper pill switch
  3. **Usage this month** — progress bar (repurposes used / limit), reset date
  4. **Plans** — 3 tier cards side-by-side (Free / Pro $24 / Agency $49), Founding Lifetime $97 highlighted, single source `src/lib/pricing.ts`, "Most popular" ribbon on Pro
  5. **Invoices / Payment method** — link to Paddle customer portal (new tab)
- Icons: `CreditCard`, `Sparkles`, `Crown`, `Receipt`, `Zap` (lucide) with gradient tiles
- Fix all text contrast to `text-white` / `text-white/70`
- Remove any $19/mo standalone label; use `PRICE_PRO_ANNUAL_LABEL` in annual context only

### 4) Image Studio style icons
File: `src/routes/dashboard.image-studio.tsx` (or component rendering style grid in screenshot 5).

Replace emoji tile icons with premium branded lucide icons + gradient tile per style:
- Photorealistic → `Camera` (amber gradient)
- 3D Render → `Box` (cyan gradient)
- Illustration → `Palette` (pink gradient)
- Minimal → `Minus` inside square, or `Square` (slate)
- Cinematic → `Clapperboard` (violet→magenta)
- Cyberpunk → `Zap` (magenta→cyan neon)
- Oil Painting → `Brush` (amber→rose)
- Anime → `Sparkles` (pink)
- Architectural → `Building2` (steel blue)

Each option: `rounded-xl` card, 40×40 gradient tile with icon, label below, selected state = violet ring + violet glow.

### Technical notes
- Add dep: `bun add react-icons`
- No backend changes.
- Keep all existing state, form logic, and server calls unchanged.
- Only presentation edits + one new `BrandIcon.tsx` helper.
- Verify billing route file for duplicated layout wrapper as the root cause of the "app-inside-app" bug before writing new UI.

### Files touched (est.)
- new: `src/components/BrandIcon.tsx`
- edit: `src/routes/dashboard.repurpose.tsx`, `src/routes/dashboard.billing.tsx`, `src/routes/dashboard.image-studio.tsx`, `src/components/SparkCopilot.tsx`, `src/components/PublishMenu.tsx`, `src/components/ConnectedAccountsCard.tsx`, `src/components/PostToLinkedInButton.tsx`, `src/components/PostToTikTokButton.tsx`
