# COCIOCO SHOP — Phase B Implementation Plan

Phase B converts the Vercel-hosted React design from a local preview into a shared multi-user application.

## Recommended stack

- **Keep current React + Vite frontend deployed to Vercel** to avoid a visually disruptive rewrite.
- **Supabase Auth** for real registration, login, email verification and approved designer roles.
- **Supabase Postgres + Row Level Security** for orders, catalog, commissions, assignments, reviews, penalties, settings, and audit records.
- **Supabase Storage** with private buckets and signed URLs for task briefs, submissions, payment proofs and digital goods.
- **Vercel Functions / server-side endpoints** for validation of payment orders, FX quotes, webhooks, admin actions, and WhatsApp message generation. Never expose privileged DB credentials in browser bundles.
- **Scheduled task expiry** by a server-side scheduled worker using server timestamps, idempotent updates and retry/reconciliation.

## Ordered build milestones

### B1 — Shared identity & admin CMS
1. Create Supabase project and securely configure `.env` values for Vercel environments.
2. Implement auth, verified user profiles, roles (`customer`, `designer`, `admin`), and admin-only protected routes.
3. Build product/category CRUD, content settings, bank/PayPal transfer configuration, and marketplace-link editor in `/admin`.
4. Migrate product/task/order data out of `localStorage`. Admin changes must appear to **all visitors**.
5. Add RLS for every exposed table and ensure public users cannot edit prices, roles, or banking details.

### B2 — Reliable Commission Engine
1. Schema `tasks`, `task_assignments`, `task_assets`, `submissions`, `reviews`, `penalties`, `earnings`, `audit_events`.
2. Implement atomic exclusive claim with an authenticated database transaction and row lock. One task, one designer; verify suspension and eligibility on server.
3. Store `claimed_at`, `expires_at` and all deadlines on server. Browser countdown is visual only.
4. Implement expiration worker; reopen tasks and assign successive penalties 8h, 16h, 32h, 64h, permanent.
5. Private task brief and asset downloads for assignee/admin only; signed upload URLs for final deliverables.
6. Admin review/approval/revision with separate revision deadline; appeals and auditable overrides.
7. Shared earnings ledger, reconciliation and payout statuses.

### B3 — Real commerce & manual-payment verification
1. Products, variations, inventory and server-calculated cart snapshots.
2. Country selection and **server-validated checkout quotes** with recorded daily FX rate and 3× international factor. Set a quote expiry and lock the price on order creation. Use a trusted exchange-rate provider; free daily rates are not real-time trading rates.
3. Order records in the shared database, unique stable IDs, statuses and customer lookup.
4. Admin-configured official **Indonesian bank account / international PayPal email** read from backend, never browser-local state. Keep bank details restricted to intended display roles, edits admin only.
5. Shipping/taxes/customs costs confirmed and presented before any payable transaction; customer must agree to final total.
6. Offer payment-proof upload to protected storage with file validations and admin queue; link to WhatsApp with order ID and a request to attach a receipt there manually. Never pretend proof was automatically attached.
7. Admin reviews payment proof and manually approves/rejects. Record who verified and when; avoid claiming payment finality before checking bank/PayPal records. Consider an official payment gateway later for webhooks.
8. Digital download entitlement after verification and order reconciliation; shipping workflow for physical goods.

## Suggested database tables

`profiles`, `roles`, `products`, `product_variants`, `product_images`, `inventory`, `tasks`, `task_assignments`, `task_assets`, `submissions`, `reviews`, `penalties`, `earnings`, `payouts`, `orders`, `order_items`, `payment_methods`, `payment_proofs`, `payment_events`, `site_settings`, `external_marketplace_links`, `audit_events`.

## QA gates for release

- Different browsers see shared admin-published products and tasks.
- 20 concurrent designer claim attempts yield exactly one successful claim.
- Expiry, penalty escalation and reopen still run while nobody has the webpage open.
- Non-assignees cannot fetch client assets or approve another designer's submission.
- Admin payment config updates appear to all checkout users without app rebuild.
- Server recomputes price from product data and the locked FX snapshot; browser editing cannot create discounted orders.
- Payment status cannot be set by customers. Test invalid proof files and duplicate uploads.
- Payment methods conform to provider terms and applicable laws and policies.
- Production monitoring, backups, rate limiting, privacy/terms/refund policies and logging are configured.

## Owner inputs required before accepting orders

Official bank name, account number, account holder, PayPal email, company address/contact, shipping countries/rates and refund/fulfillment policies. **Do not use invented bank details or accept real payments before these have been verified.**
