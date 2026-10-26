# COCIOCO SHOP — PHASE B (Connected Commerce & Commission Backend)

**Original Y2K/kawaii website preserved.** React 19, Vite 6, TypeScript, React Router, Framer Motion, Supabase Auth/Postgres/Storage and Vercel Functions. This package upgrades the previously approved Phase A+ shop; it does not replace the design.

> **IMPORTANT — Connection not activated yet.** A dedicated COCIOCO Supabase project is required. The Supabase account currently linked to the workspace showed *only* an unrelated inactive project called “Garwa Creative Management”. We deliberately did **not** modify that project. The ZIP contains SQL, secure API source, and setup documentation; it is **not** evidence that a real COCIOCO database was created or validated. DO NOT accept real orders or commissions before completing the activation and integration tests below.

## What is built

| Area | Live-mode implementation |
| --- | --- |
| Account | Supabase Auth email/password registration and sign-in, email verification, customer/designer/admin roles, designer approval controlled by administrator. |
| Shop | Public database catalog; admin can edit product names, images, pricing, stock, publish state, and upload protected digital deliverables. |
| Checkout | Authenticated order submission, server-side validation and recomputation of product/custom prices, ISO country choices, FX fetched by server for international USD, 3× multiplier, idempotent checkout token, transactional stock reserve. |
| Payment | Saved bank/PayPal destinations, WhatsApp proof handoff, admin manual payment review, rejected *unpaid* order automatically releases reserved physical stock. No automatic payment confirmation. |
| Tracking | Private customer order history and delivery status timeline with manual admin notes, courier name and resi number. |
| Custom Studio | Four merchandise types, size/material/finish/quantity, optional designer service fee, protected customer artwork upload and product pricing configured by admin (base fee/design fee). |
| Commission Hub | Admin create task, attach private client brief/files, exclusive atomic database claim, eight-hour deadline, escalating penalties, private designer file submission, admin review/revision/approval, manual payout status. |
| Leaderboard | Approved designer projects with private-by-default earnings; collector rankings only for customers who explicitly opt in. Public leaderboard RPC excludes PII. |
| Gives Back | Owner-managed introduction and real activity news articles. **No public donation totals**; no invented posts. Admin confirms real activity before publishing. |

**Not automated:** bank/PayPal transfers, actual proof attachment in WhatsApp (user must send it), courier status, packing, payout transfers, bulk production, design approvals, shipping fees, taxes, digital licenses, donation disbursement and reporting. These require owner operations and/or additional integrations. Do not advertise automatic shipping tracking.

## STEP 1 — Set up a new dedicated Supabase project

1. Open <https://supabase.com/dashboard> and create **a NEW project named COCIOCO SHOP**, separate from unrelated businesses.
2. Select a suitable database region, securely save DB credentials yourself, and wait for project readiness. Do not paste service-role/secret keys into chat, source code, screenshots or GitHub.
3. In the dedicated project's **SQL Editor**, review and run the complete `database/COCIOCO_PHASE_B_SETUP.sql` **once**. It creates the schema, tables, indexes, RLS policies, restricted transactional SQL functions, four PRIVATE Storage buckets, and sample catalog. It intentionally does not create imaginary charity activities, fake customers or fake jobs.
4. In **Authentication → URL Configuration**, set Site URL to `https://cocioco.vercel.app` and allow the deployment origin in Redirect URLs, including preview domains only if you intend them to accept sign-in. Configure email provider/confirmation and anti-abuse limits.
5. Obtain your project's URL and **publishable key** for the frontend; use the service-role key only inside Vercel server-side environment variables (never a `VITE_` value). Recommended: use Vercel encrypted sensitive variables.

## STEP 2 — Set Vercel environment variables

In your existing Vercel project **cocioco**, Settings → Environment Variables:

| Variable | Scope | Value source |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Frontend / production | Supabase Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend / production | Supabase `sb_publishable_...` key |
| `SUPABASE_URL` | Server / production | Same project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret server-side only** | Supabase legacy service_role key (or compatible secret key) |

**NEVER** prefix a service-role or secret key with `VITE_`. Frontend values are bundled into publicly inspectable JavaScript. The server verifies the actual bearer token via Supabase Auth and checks the database profile role on every privileged request.

When all four are configured, Vite automatically switches from demo-local state to live Supabase state on the next deployment. The `/api/command` and `/api/fx` functions execute on Vercel. If only some variables are set, do not open checkout to customers; complete the full set first.

## STEP 3 — Deploy without creating a duplicate Vercel project

1. Extract this ZIP and copy the **contents** of `cocioco-shop` into the root of your existing GitHub repo (the one connected to `cocioco.vercel.app`). Commit your changes to a review or preview branch first.
2. On Vercel use **Vite**, `npm install`, build `npm run build`, output `dist`.
3. Verify build, `/api/fx`, `/auth`, `/shop`, `/cart`, `/custom`, `/commissions`, `/giving`. `vercel.json` preserves direct links to the SPA routes.
4. After verifying in preview, merge to `main` to release. **Production deployment is not performed by the supplied ZIP.**

Local development: copy `.env.example` to `.env.local` and fill frontend keys. The `/api` functions require Vercel runtime for full local testing (`vercel dev`) and server-only credentials. Plain `npm run dev` serves frontend only. Install: `npm install`. Static build: `npm run build`.

## STEP 4 — Register and authorize the first admin

1. After site is connected, sign up at `/auth` as **Customer** with the actual owner's email. Confirm your email.
2. Go to dedicated Supabase Dashboard → Authentication → Users. Copy the owner's exact UUID.
3. Follow `database/BOOTSTRAP_ADMIN_INSTRUCTIONS.sql` in the project's SQL Editor. Promote **only** that known UUID to `admin`.
4. Sign out and sign in again. `/admin` now provides Products, Designer Approvals, Orders & Tracking, Custom Pricing, Task Management, Giving Articles, and Payment Settings.
5. In **Payment Settings**, input official **bank name, account holder, account number**, international **PayPal email**, and verify WhatsApp `6282317422632`. Checkout is blocked server-side when the selected country's destination is missing.
6. For digital catalog products, **upload the actual licensed digital deliverable** before selling. The backend refuses digital products without an uploaded asset path.

**Do not promote admin roles based only on a self-submitted email address.** Admin actions are verified against server-side database roles. Designer registration sets an approval request; they cannot claim tasks until admin approves.

## STEP 5 — Activate commission expiry cron (required before live commissions)

Run `database/OPTIONAL_ENABLE_EXPIRY_CRON.sql` **in the COCIOCO project** after you enable Supabase Cron/pg_cron from Dashboard. It schedules `backend_expire_tasks()` once per minute. Without it, expirations only occur when a later claim invokes the server function, so you must **not** launch time-sensitive commissions or claim that penalties auto-run without traffic.

SQL functions lock task rows and use transactional updates to prevent two designers simultaneously claiming the same task. Penalties: 8h, 16h, 32h, 64h, then permanent suspension. A revision doesn't trigger the original missed-deadline penalty automatically. Admin must agree a new revision schedule with the designer.

## STEP 6 — Required operational tests before taking money

Run tests on a NEW project with fake/test accounts and harmless data, not with genuine customer payment data:

- Register + verify a customer; verify customer cannot access `/admin`, other customers' orders, brief files or another account's custom artwork.
- Register designer → admin approves → designer claims task → second designer cannot claim → first can access brief/files and submit once.
- Run `select public.backend_expire_tasks();` manually as SQL Editor operator on an intentionally expired *test* task. Confirm exactly one penalty and reopening, then test cron schedule.
- Create ready-stock/cart custom orders; verify calculated IDR totals and international `(IDR / FX) × 3`, and double-click retry does **not** reserve stock twice.
- Admin confirms payment; customer sees tracked status. Admin rejects an **unverified** test order; confirm stock is released. Do not use a real bank transfer for testing.
- Confirm customers cannot download paid digital files **before** payment verification or when product has no uploaded asset. After verification, authorized purchased files generate short-lived signed links.
- Confirm creator earning totals are private without explicit opt-in, and buyer leaderboard excludes orders without opt-in.
- Publish a real, verified charity-activity article only after documentation; ensure the public journal has no fake totals or fabricated events.
- Test error states, WCAG contrast, mobile navigation, privacy, anti-spam rules, Vercel observability and data backup.

## Important boundaries

- **Manual payment verification** does not guarantee a completed sale. Buyer WhatsApp receipts are not automatically checked. Shipping, duties and bank charges are quoted separately.
- Physical inventory is **reserved** at checkout and **restored** if admin rejects an unpaid order. There is no automatic unpaid-order expiry yet: admin should review and close abandoned orders. Verified refunds/returns require a separate reconciliation workflow; don't use the rejected status to reverse verified orders.
- Digital filenames, licenses and actual files must be entered/uploaded by the owner. Demo seeded items do not include commercial file deliverables.
- Custom artwork is private. Client briefs and designer submissions are private. Do not re-share customer artwork to contributors without appropriate approval.
- Product size/material/finish surcharges are currently defined in `src/custom.ts`; admin can edit base price and designer fee, not every configuration option yet. Make spec options database-driven in the next iteration if that is needed for daily operations.
- The Giving Back 2.5% commitment is **brand copy and an internal operational promise**, not a public cash counter or automated allocation. Maintain responsible internal records and legal/accounting review; no automatic charitable transfers are built.
- Vercel usage for active commerce should follow an appropriate paid commercial plan and its current terms.
- `COCIOCO_PHASE_B_SETUP.sql` is designed for a **new, empty COCIOCO Supabase project only**. Don't run it against Garwa or any preexisting business schema.

## Project files

- `src/live-store.tsx`, `src/lib/backend.ts`, `src/pages/LiveAuth.tsx` — real account state, read services, upload/download with RLS.
- `api/command.ts`, `api/fx.ts`, `server/` — verified Vercel server handlers and rate source.
- `database/COCIOCO_PHASE_B_SETUP.sql` — dedicated database, transactional RPCs, RLS, storage, sample catalog.
- `database/BOOTSTRAP_ADMIN_INSTRUCTIONS.sql` — secure first admin bootstrap.
- `database/OPTIONAL_ENABLE_EXPIRY_CRON.sql` — deadline enforcement job.
- `src/components/AdminProducts.tsx`, `AdminDesigners.tsx`, `AdminTaskAsset.tsx` — admin tools.
- `src/phase-b.css` — connected account/admin styles.
- `docs/PHASE_B_RELEASE_CHECKLIST.md` — sign-off checklist.

### Test status of this ZIP

All TS/TSX files were parsed using TypeScript; an additional dependency-stubbed typecheck checked internal project types and imports. The full `npm run build`, actual Supabase SQL execution, real login, end-to-end checkout and Vercel deployment could **not** be executed in the current isolated environment because npm packages are unavailable and no dedicated COCIOCO Supabase project exists. Validate against the actual dependencies and database before launch.
