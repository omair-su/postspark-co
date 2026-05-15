
# PostSpark Next-Level Roadmap

Picking up the plan from yesterday. Two headline goals: (1) ship a luxury 3D animated landing page in the style of aicm.ai / fineo.ai, and (2) sweep remaining bugs so new visitors don't bounce.

---

## Phase 1 — Bug & polish sweep (1 turn)

Re-test on the live site and fix anything still broken:

1. Image Studio — generate, download, save-to-library, history reload
2. Import Studio — YouTube, blog URL, PDF, raw article, Twitter thread
3. Repurpose flow — all platforms, Brand Voice + Brand Kit auto-applied
4. Auth — email/password, Google OAuth, password reset email branding
5. Paddle billing — Pro & Agency checkout, plan sync, cancel flow
6. Onboarding wizard — completes and lands user on /dashboard
7. Mobile responsiveness — sidebar drawer, dashboard cards, modals
8. Console errors / failed network requests on every dashboard route
9. Empty + loading + error states across all pages
10. SEO findings (Google Search Console is the only remaining item — needs your Google login)

---

## Phase 2 — Luxury 3D landing page (2–3 turns)

**Yes — we can absolutely build aicm.ai / fineo.ai-tier landing.** Realistic target: Awwwards-grade, not 1:1 of a custom studio site.

What it will include:
- **Hero 3D scene** using React Three Fiber + drei + postprocessing — iridescent chrome blob / particle field / holographic orb that reacts to cursor and scroll
- **Scroll-linked storytelling** with GSAP ScrollTrigger — camera dolly, section reveals, pinned moments
- **Lenis smooth scroll** for that buttery aicm-style feel
- **Editorial typography** — pair a display serif (Instrument Serif) with a precise sans (PP Neue Montreal alternative — Geist or Satoshi)
- **Glassmorphism panels**, magnetic cursor, marquee logo strip, before/after slider, animated metrics
- **Reduced-motion fallback** — keep the current `HeroSection` for users who prefer it, and as SSR fallback
- **All R3F components dynamic-imported** with `<Suspense>` so SSR / Cloudflare Worker doesn't break

Tech adds: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `gsap`, `lenis`, `maath`. Bundle ~250KB gz, lazy-loaded so it doesn't hurt FCP.

What I cannot do on first pass: hand-authored studio-quality GLSL shaders or custom-modeled GLB assets. We'll use procedural geometry + drei primitives + MeshTransmissionMaterial, which gets very close to fineo's look.

---

## Phase 3 — Dashboard polish + command palette (1 turn)

- Cmd+K command palette (jump to repurpose / image studio / history / settings)
- Keyboard shortcuts: `g+r`, `g+i`, `g+h`, `?`
- Reduce toast spam, unify loading skeletons
- Activation checklist + "Daily Spark" AI suggestion widget on `/dashboard`

---

## Phase 4 — Growth features (later turns, optional)

Scheduled publishing (X/LinkedIn/Threads), Chrome extension, Notion/Webflow publish, A/B hook variants, voice cloning, agency client portal polish, public showcase pages.

---

## Recommended order

**Phase 1 → Phase 2 → Phase 3.** Phase 1 protects the conversions you're getting today; Phase 2 is the visual upgrade you're most excited about; Phase 3 makes the product feel premium once they're inside.

Approve this and I'll start with Phase 1 immediately, then move into the 3D landing in the next turn.
