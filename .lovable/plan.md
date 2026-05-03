
# Agency Tier — Justify the $49/mo

Right now Agency = Pro with a higher price. We'll add features that only make sense for people managing **multiple brands or clients with a team**. Each feature is gated server-side to `plan = 'agency'`.

## The 6 Agency-only features

### 1. Team seats (up to 5 members)
Owner invites teammates by email. Teammates sign up / log in and join the workspace. All members share the workspace's brand kits, history, scheduled posts, image library, and usage quota.

- New tables: `workspaces`, `workspace_members` (role: owner / admin / member), `workspace_invites` (email + token + expiry).
- Refactor: existing per-user data (brand_kits, generated_images, repurpose_jobs, scheduled_posts, brand_voices, templates) gets an optional `workspace_id`. Server functions resolve "active workspace" for the current user and scope queries to it (falls back to personal data for Free/Pro).
- UI: `/dashboard/team` page — member list, invite form, pending invites, remove member, role badge. Accept-invite flow at `/invite/$token`.

### 2. Multi-brand / client workspaces
Agency users can create **multiple brand kits** (one per client) and switch the "active" one from a top-bar workspace switcher. Pro users stay limited to one brand kit.

- Extend `brand_kits`: already keyed by user — add `workspace_id` and remove the implicit single-row assumption for Agency. Add a `is_active` flag per workspace.
- Top-bar `BrandSwitcher` dropdown (next to user avatar in `DashboardLayout`). Persists active brand in localStorage + writes through to a `active_brand_kit_id` column on `workspace_members`.
- Repurpose, Image Studio, and Scheduling all read the active brand kit instead of "the user's only brand kit".

### 3. Client approval workflow
Send generated content to a client for approval via a public review link — no client login needed.

- New table `approval_requests` (job_id, workspace_id, public_token, status: pending/approved/changes_requested, client_email, client_comment, decided_at).
- New public route `/review/$token` — client sees the generated outputs, can Approve or Request Changes with a comment. Email-less flow (link is the auth).
- Inside Repurpose history, a "Send for approval" button on each job → generates link → copy / email. Status badge shown back in the dashboard.

### 4. White-label / remove "Made with PostSpark"
- Workspace-level toggle: hide PostSpark branding on shared review links and exported assets (image watermark, PDF footer, share pages under `/gallery/$slug`).
- Optional custom logo + accent color injected into the review page (uses the active brand kit).

### 5. Agency analytics rollup
A dashboard view that aggregates **across all client brand kits** in the workspace: posts generated per brand, scheduled posts published, approval turnaround, top-performing platforms. Pro sees only their own; Agency sees a per-client breakdown with a brand filter.

- New route `/dashboard/agency-analytics`. Server function aggregates `repurpose_jobs`, `scheduled_posts`, `post_metrics` grouped by `brand_kit_id`.

### 6. Bulk CSV import → schedule
Upload a CSV (`date, platform, content`) and queue dozens of posts in one shot to the active brand's calendar. Agency-only.

- New route action on `/dashboard/calendar`: "Bulk import CSV" button, parses client-side with PapaParse (already used elsewhere), inserts batch into `scheduled_posts`.

## Technical plan

**Migrations**
- `workspaces (id, owner_id, name, white_label boolean default false, created_at)`
- `workspace_members (workspace_id, user_id, role, active_brand_kit_id, joined_at)` PK (workspace_id, user_id)
- `workspace_invites (id, workspace_id, email, token, role, expires_at, accepted_at)`
- `approval_requests (id, job_id, workspace_id, token, status, client_email, client_comment, decided_at, created_at)`
- Add `workspace_id uuid` (nullable) to: `brand_kits`, `generated_images`, `repurpose_jobs`, `scheduled_posts`, `brand_voices`, `templates`. Backfill = NULL (personal).
- Drop the implicit "one brand_kit per user" UI guard for Agency.

**RLS**
- Helper SQL function `is_workspace_member(_workspace_id uuid, _user_id uuid) returns boolean security definer` to avoid recursive RLS.
- Update SELECT/INSERT/UPDATE/DELETE policies on the six scoped tables: allow when `auth.uid() = user_id` OR `workspace_id is not null and is_workspace_member(workspace_id, auth.uid())`.
- `approval_requests`: public SELECT by token only (no auth) for the review page; workspace members for management.

**Plan gating (server-side)**
- Centralize a `requireAgency(supabase, userId)` helper. Used at the top of every Agency-only server function: invites, multi-brand creation (>1 kit), approval requests, white-label toggle, agency analytics, bulk import.
- UI shows soft upsell cards for Pro/Free.

**Active workspace resolution**
- New helper `getActiveWorkspaceContext(supabase, userId)` → returns `{ workspaceId | null, brandKitId | null, role }`. Read from `workspace_members.active_brand_kit_id`. Patches into Repurpose / Image Studio / Brand Voice flows.

**New / edited files**
- `supabase/migrations/[ts]_agency_tier.sql`
- `src/server/workspace.functions.ts`, `src/server/workspace.server.ts`
- `src/server/approvals.functions.ts`, `src/server/agencyAnalytics.functions.ts`
- `src/lib/workspaceContext.ts` (client active-workspace store)
- `src/components/BrandSwitcher.tsx` (top-bar)
- `src/routes/dashboard.team.tsx`
- `src/routes/dashboard.agency-analytics.tsx`
- `src/routes/invite.$token.tsx`
- `src/routes/review.$token.tsx`
- Edits: `src/routes/dashboard.brand-kit.tsx` (multi-kit list), `src/routes/dashboard.repurpose.tsx` + `dashboard.image-studio.tsx` + `dashboard.calendar.tsx` (active brand awareness, approval button, CSV import), `src/components/DashboardLayout.tsx` (mount BrandSwitcher + Team nav), `src/components/landing/PricingSection.tsx` (refresh Agency feature list), `src/server/repurpose.functions.ts` + `brandKit.functions.ts` (workspace scoping)

**Out of scope for this sprint**
- Real Stripe price for upgrade flow (already absent).
- Email delivery for invites/approvals — we'll show the link to copy; SMTP wiring later.
- Granular per-member permissions beyond owner/admin/member.

## Pricing page update
Agency tier bullets become: **Up to 5 team seats · Multi-brand workspaces · Client approval links · White-label review pages · Agency analytics rollup · Bulk CSV scheduling**.

Approve and I'll build it end-to-end.
