# RepurposeAI -- Comprehensive Upgrade Plan

## Current State Summary

Your app has: landing page, email/password auth (login/signup), dashboard with repurpose page (AI generation), history, settings, usage tracking (3 free/month), and an upgrade modal. All functional but missing several key features.

## What This Plan Adds

### 1. Google Sign-In (Login + Signup)

Add "Continue with Google" buttons to both login and signup pages using Lovable Cloud's managed Google OAuth. No API keys needed -- it works out of the box.

### 3. Database Additions

- `**profiles` table** -- stores display name, avatar URL, and subscription tier. Auto-created on signup via a database trigger.
- `**subscriptions` table** -- tracks Stripe subscription ID, status, current period, and plan tier per user.
- RLS policies on both tables so users can only access their own data.

### 4. Password Reset Flow

- Add "Forgot password?" link on the login page
- Create a `/reset-password` route where users set a new password after clicking the email link

### 5. Dashboard Enhancements

- **Dashboard home**: show subscription tier, usage progress bar (e.g., "2 of 3 used"), and quick stats
- **Settings page**: display current plan with a "Manage Subscription" option; show profile avatar
- **Usage logic update**: paid users bypass the 3/month limit entirely

### 6. Landing Page Polish

- Add anchor links in navbar (Features, Pricing, Testimonials) for smooth scrolling
- Pricing cards link to signup or checkout depending on tier
- Add a "How It Works" section (3 steps: paste content, choose formats, get results)

### 7. UX and Quality Improvements

- Loading skeleton on history page instead of spinner
- Smooth page transitions with CSS
- Better empty states with illustrations
- Form validation feedback (password strength, email format)
- Mobile hamburger menu in dashboard shows user avatar/name

---

## Technical Details

### Database Migrations (2 migrations)

**Migration 1 -- Profiles table:**

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: users read/update own profile
-- Trigger: auto-create profile on auth.users insert
```

**Migration 2 -- Subscriptions table:**

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: users read own subscription
```

### Files Created / Modified


| File                                        | Change                                             |
| ------------------------------------------- | -------------------------------------------------- |
| `src/routes/login.tsx`                      | Add Google OAuth button                            |
| `src/routes/signup.tsx`                     | Add Google OAuth button                            |
| `src/routes/reset-password.tsx`             | New -- password reset form                         |
| `src/server/repurpose.functions.ts`         | Check subscription tier; skip limit for paid users |
| `src/server/subscription.functions.ts`      | New -- server functions for subscription status    |
| `src/routes/dashboard.repurpose.tsx`        | Use subscription-aware usage check                 |
| `src/routes/dashboard.index.tsx`            | Show plan tier + usage progress bar                |
| `src/routes/dashboard.settings.tsx`         | Show plan info + manage subscription               |
| `src/components/landing/PricingSection.tsx` | Wire CTA buttons to checkout/signup                |
| `src/components/Navbar.tsx`                 | Add smooth-scroll anchor links                     |
| `src/styles.css`                            | Add skeleton animation utility                     |


### Payments Setup

Before writing checkout code, I will:

1. Run the payment provider eligibility check
2. Enable Stripe via Lovable's built-in integration
3. Create Pro and Agency products
4. Implement checkout + webhook

### Execution Order

1. Configure Google OAuth (tool call)
2. Run database migrations (profiles + subscriptions)
3. Add Google sign-in buttons to login/signup
4. Add password reset flow
5. Enable Stripe payments + create products
6. Build checkout flow + webhook handler
7. Update repurpose logic to be subscription-aware
8. Enhance dashboard and settings pages
9. Polish landing page and UX details