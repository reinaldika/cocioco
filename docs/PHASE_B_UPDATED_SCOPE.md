# Phase B production requirements — COCIOCO SHOP

Do not deploy Phase A localStorage data as if it were secure or persistent multi-user commerce. Phase B should upgrade the data and permissions in place, preserving the React UI wherever practical.

## System architecture
- Vercel: static Vite frontend + authenticated API/Functions as needed.
- Supabase: Postgres, Auth, private Storage, Row-Level Security; use admin actions only from trusted server checks.
- Required project configuration must be supplied by the owner; never commit service role, banking credentials, or API tokens to the public repo.

## Database entities
- `profiles` (role and editable public nickname; never authorize using user-editable metadata).
- `products`, `product_variants`, `inventory`, `custom_types`, `custom_options`, `custom_pricing`.
- `orders`, `order_items` (immutable snapshots), `order_status_events`, `payment_proofs`, `payment_verifications`, `shipments`.
- `tasks`, `task_claims`, `private_briefs`, `submissions`, `reviews`, `penalties`, `earnings`, `payouts`, `commission_order_links`.
- `collector_points_ledger`, `leaderboard_opt_ins`, `giving_articles`, `giving_media` (and a private giving allocation ledger if the owner needs accounting, **not public totals**).
- `admin_audit_logs` for order/payment/status/content changes.

## Must-have invariants
1. Checkout quote and international multiplier computed/frozen on the server, not just in browser. Verify stock availability and shipping before payment. Keep actual exchange-rate source, timestamp and displayed quote.
2. Order tracking readable only to authorized customer/admin, or by secure time-limited tracking token; protect against enumeration and rate-limit lookup. Preserve append-only audit history with date, actor, message.
3. Payment proof goes into private storage. Admin verifies genuine transfer before marking paid. A WhatsApp link alone does not verify payment.
4. Custom artwork uploads must be private and validated; keep the file data and access grants, not only the filename. Prevent designers seeing unrelated clients' assets.
5. Custom order → designer task only after verified payment, admin-accepted brief and reward; transactionally link order/task so duplicate tasks cannot be created. Revision deadlines may differ from standard eight-hour tasks.
6. Exclusive task claiming implemented using a single atomic Postgres operation. Expiration and penalty enforcement must be server-driven even with no browser open. Add appeal and admin override/audit.
7. Leaderboard statistics computed from approved tasks/verified purchases, not client-provided numbers. Earnings require explicit opt-in to publish and distinguish approved from paid. Buyers display optional alias/points only, never their expenditure.
8. Public Gives Back journal articles require staff authorization. Restrict claims of completed activities to verified facts; allow draft and scheduled publication. Photos need publication consent. Donation values do not appear publicly unless policy changes.
9. Verify applicable Indonesian charity/PUB requirements, sales taxes and consumer obligations before public commerce launch.
10. Add email/WhatsApp notifications only with appropriate consent and API providers. Event reminders should not become false courier or payment confirmations.

## Recommended implementation order
- B1: Supabase setup, RLS/auth, data migrations, admin permissions.
- B2: Orders + verified payment + private proof + manual shipment tracking.
- B3: Custom pricing catalog, private files, production status, order-to-task bridge.
- B4: Server-authoritative Commission Hub, earnings, penalties and payouts.
- B5: Leaderboards, collector opt-in/points and editorial community journal.
- B6: Cross-device E2E tests, security audit, accessibility review, policies and live launch.
