# PostSpark hardening plan

I checked the main claims in your audit against the live code. The important ones are real:

- The monthly usage check can be skipped: the "is this the first item in the pack?" flag is sent by the browser, so it can be set to false forever.
- Brand Voice "learn from my website" fetches any address the user types, with redirects followed, with none of the safety checks the rest of the app already uses.
- Every social login signature falls back to a fixed, guessable secret when the real one is missing, and the one-time value is generated with a weak random source.
- Usage limits are counted, then work starts — two requests at the same time can both pass.
- Abuse limits live in each server's memory, so they reset constantly and don't apply across servers.
- Both `bun.lock` and `package-lock.json` exist; two competing dependency files.
- There is no `typecheck` script.

Rather than one giant refactor, this ships in waves. Each wave stands alone and is safe to stop after.

## Wave 1 — close the money and account holes (do first)

1. **Pack reservation owned by the database.** Drop the browser-sent "first in pack" flag. The existing `claim_repurpose_pack` reservation becomes the only gate, and each format generation checks the reserved pack instead of trusting the request.
2. **Safe fetching for Brand Voice.** Route website scraping through the shared safe-fetch used elsewhere (blocks private/loopback/metadata addresses, re-checks every redirect), plus a byte cap and a time cap.
3. **Social login secrets fail closed.** Remove the fallback secret; if configuration is missing, the connect button reports "not configured" instead of signing with a known value. Use a proper random one-time value and a constant-time signature comparison.
4. **Toolchain.** Keep Bun as the single dependency file, delete `package-lock.json`, add a `typecheck` script.

## Wave 2 — usage limits that can't be raced

Add one shared usage ledger in the database with atomic reserve → settle:

```text
reserve(user, kind, idempotency_key)  ->  allowed | limit_reached
   run the AI job
settle(reservation, success | failure)  // failure releases the credit
```

Every billable action goes through it: repurpose packs, single images, batches, streaming tiles, edits, inpaint, narration. This also replaces "count rows then decide", so parallel requests can no longer both slip through, and a failed job stops burning a credit.

Then replace the in-memory abuse limiters with a small database-backed limiter keyed by user + action, so limits survive restarts and apply across servers.

## Wave 3 — one-time login codes and private images

5. **One-time nonces.** Store each social-login code and consume it exactly once, so a captured link can't be replayed.
6. **Private generated images.** Move the `generated-images` bucket to private and serve short-lived signed links; keep a deliberate public copy only for images the user explicitly shares to the public gallery. Includes a migration for links already stored in the database.
7. **Real account deletion.** One audited routine that clears stored files, connected-account tokens, queued posts and feature records, retries the parts that fail, and records what was removed.

## Wave 4 — reliability and honest errors

8. Stop deleting "stale" draft records during a read; retire them on a schedule after a durable status change.
9. When the atomic save fails, retry it and surface a real failure instead of falling back to a save that can lose a parallel result.
10. A shared result/error shape for dashboard server calls, so silent failures become visible messages with a retry, and server-side logs carry context.
11. Cap remote imports by declared size before downloading, and cap accepted image payloads.

## Wave 5 — structure, state and accessibility

12. Adopt React Query (already installed) for subscription, workspace, history, media and tool reads — shared cache, cancellation, consistent loading and error states.
13. Split the four biggest screens (Image Studio, Repurpose, Timeline Editor, Carousel) into state / service / view files, lazy-loading the heavy export and editor code.
14. Keyboard-operable timeline controls, real dialog primitives for the custom modals, alt text on meaningful images.

## Wave 6 — tokens, landing cleanup, tests

15. Replace raw colours and inline styles in active dashboard screens with the semantic tokens.
16. Retire the unused landing versions only after visual snapshot parity is approved.
17. Tests, in this order: pure helpers → server functions (auth, entitlement, ownership, validation) → access-rule tests → signed-in Playwright flows for generation, publishing, upload, deletion and failed social-login callbacks.

## Technical notes

- Quota ledger: `usage_reservations(id, user_id, kind, idempotency_key unique, state, created_at, settled_at)` plus `reserve_usage`/`settle_usage` security-definer functions holding an advisory lock per user; grants for `authenticated` and `service_role`, RLS owner-read only.
- OAuth: new `OAUTH_STATE_SECRET`; `oauth_nonces(nonce pk, user_id, provider, expires_at, used_at)` consumed with a conditional update.
- Storage: bucket flipped via the storage tool, not SQL; signed-URL helper in `imageQuota.server.ts`; backfill converts stored public URLs to object paths.
- Safe fetch: `src/lib/safeFetch.ts` already exists — Brand Voice, Canva and Google outbound calls all move onto it.

## Suggested first step

Wave 1 alone (items 1–4). It's the smallest change that stops free-tier bypass, server-side request forgery and guessable login signatures.
