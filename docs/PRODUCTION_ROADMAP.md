# COCIOCO SHOP — Production Readiness Roadmap

## Current status

The Vite website ships as a **deployable interactive UI prototype**, not a secure multi-user application. The primary task transitions and penalties are simulated inside one browser; any user can modify local data. Therefore, do not use this prototype to operate paid commissions or take client files.

## Recommended application architecture

**Frontend:** retain the React/Vite app and CSS design system.

**Auth & database:** Supabase Auth + Postgres with Row Level Security (RLS), or an equivalent authenticated backend.

**File storage:** protected object storage with signed URLs and explicit per-assignee access rules for task briefs and deliverables. Verify MIME type, size and extension server-side; scan uploads.

**Scheduled enforcement:** database job or server-side scheduler to expire overdue task claims, reopen tasks, apply penalties, and notify users. The browser countdown should only visualize the server's deadline timestamp.

**Commerce:** supported payment gateway (such as a reputable Indonesian payment provider), signed webhook verification, inventory management, real order states, shipping integration and protected digital product fulfillment.

**Designer payouts:** approved-work ledger separate from payment status, manual reconciliation at first, then provider integration. Record adjustments and disputes.

## Suggested database entities

1. `profiles` — auth-linked user id, display name, designer approval state, roles (roles server-controlled).
2. `tasks` — published task, category, budget, status, deadline policy, owner.
3. `task_assignments` — task, designer, claim timestamp, expiry timestamp, status, immutable history.
4. `task_assets` — protected storage object path, task, uploader, access tier.
5. `submissions` — assignment, file path, size, timestamp, review state.
6. `reviews` — submission, reviewer, decision, feedback, revision deadline.
7. `penalties` — designer, assignment, strike, duration, expiry, appeal status.
8. `earnings` — assignment, approved reward, ledger event, payout state.
9. `products`, `product_variants`, `inventories`, `digital_assets` — storefront catalog.
10. `orders`, `order_items`, `payment_events`, `download_entitlements` — commerce.
11. `audit_events` — critical operations.

## Task claim transaction (critical)

Never implement claiming with a browser-only `UPDATE` or a simple UI `if` statement. Create a backend transaction / Postgres function that:

1. Authenticates the caller and ensures the account is an **approved designer**.
2. Checks active penalties or permanent suspension from **server data**.
3. Checks any concurrency policy (e.g. only one active task per designer).
4. Locks the task row `FOR UPDATE` and confirms it is currently available.
5. Inserts the assignment with `claimed_at = now()` and `expires_at = now() + interval '8 hours'` and updates task status.
6. Commits atomically, preventing two people from claiming one task.
7. Returns the authoritative deadline and assignment id.

On submission: check `auth.uid()` equals the currently assigned designer, ensure `now() < expires_at`, validate/upload files in protected storage, and commit a submission record. If a deadline expires, a server process atomically reopens the task and calculates the penalty (8, 16, 32, 64 hours, permanent after strike 5). Never derive escalation from user-editable claims.

For revisions, maintain an independent admin-configured deadline. Avoid accidentally treating revisions as ordinary missed 8-hour submissions.

## Security essentials

- RLS on all exposed database tables; `SELECT` policies must restrict private briefs and files to assignee/admin.
- Roles from authoritative server-side records / app metadata, **not user-editable metadata**.
- Keep server secrets, payment API keys, and privileged DB keys **off the browser**.
- Use signed temporary download URLs; don't expose private client asset paths publicly.
- Confirm checkout success via verified payment webhook before granting digital files.
- Apply API rate limits, input validation, file validation, CSP, logs and error monitoring.
- Securely administer role promotions: never let a public sign-up create an admin.
- Create privacy policy, copyright licensing, refund/cancellation policy, designer contract, payout and dispute terms.
- Use original or properly licensed asset designs and ensure font usage rights for commercial resale.

## Suggested launch stages

### Stage A — Public creative storefront
Keep the responsive UI, replace placeholder product catalog and social links, connect checkout/payment, fulfillment and digital delivery.

### Stage B — Private designer beta
Roll out verified registration, real database, server-side claim and timer, protected briefs, submit/review/revision workflow and appealable penalties. Start with a small group to test race conditions and reliability.

### Stage C — Scale
Designer tiering, notifications, automated payouts, analytics, advanced moderation and capacity safeguards.

## Before enabling paid commissions

Run concurrent claim tests, deadline boundary tests, multiple-browser tests, network interruption tests, penalty escalation tests, admin action audit tests, storage permission tests and a third-party security review.
