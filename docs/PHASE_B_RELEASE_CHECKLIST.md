# COCIOCO Phase B — Production Activation & Owner Sign-Off

**State: source prepared; not production-activated.**

## Security gates

- [ ] Dedicated COCIOCO Supabase project is provisioned (do not use the inactive Garwa project).
- [ ] Supabase schema created, RLS policies reviewed, database security advisers run and storage buckets confirmed private.
- [ ] Frontend holds only publishable key and public URL; server holds protected service role key, never in the repo or VITE variables.
- [ ] Signup requires verified email, admin role granted to only verified owner UUID, designer approval tested, user impersonation negative tests passed.
- [ ] Storage URLs and paths inaccessible to non-owners; private brief only assigned designer/admin; digital file only purchaser/admin after paid.

## Checkout gates

- [ ] Official bank/PayPal destinations entered by COCIOCO owner; proof sent manually via WhatsApp `6282317422632`.
- [ ] Domestic IDR and international USD ×3 formula checked on server with provider rate, currency quote stored in order.
- [ ] Idempotent checkout retries validated; physical stock reservation confirmed and unpaid rejected orders return stock.
- [ ] Admin payment/fulfillment updates appear to logged-in customer from another browser.
- [ ] Buyer cannot see another customer's order or private address.
- [ ] Country-specific shipping/customs/fees wording and fulfillment expectations checked.
- [ ] Real refund/returns and payment-dispute process defined by owner before accepting paid orders.

## Commission gates

- [ ] Task + brief/asset creation by admin; candidate designer approval; atomic claim under concurrent load.
- [ ] Server deadline + Supabase Cron activated and monitored, missed deadline triggers single escalating penalty.
- [ ] Revision flow and its separate turnaround policy communicated.
- [ ] Submission file stored privately; admin approval/paid status; designer sees own earnings.

## Community and social impact gates

- [ ] Leaderboard excludes financial earnings without voluntary visibility opt-in; collectors opt in and no spending amounts are shown.
- [ ] Gives Back journal contains verified activity articles, with no invented donation sums or events.
- [ ] Internal accounting for 2.5% ready-stock commitment maintained separately and legally reviewed.

## Release gates

- [ ] `npm install` and `npm run build` pass with actual packages.
- [ ] Test Vercel Functions `/api/command`, `/api/fx`, admin auth and SPA deep-links.
- [ ] Desktop/mobile QA, inclusive accessibility, throttled network/offline/retry QA.
- [ ] Owner runs a full E2E smoke test on Vercel preview first, then promotes after approval.
- [ ] Monitoring, backups, billing limits, rate limiting/WAF reviewed.
