# COCIOCO SHOP — Phase A Revamp

**Make cute things happen.** A mobile-friendly kawaii / Y2K creative shop and freelance commission board, made with React, TypeScript, Vite, React Router, and Framer Motion.

> **IMPORTANT: PHASE A IS AN INTERACTIVE PREVIEW, NOT A LIVE MULTI-USER BUSINESS SYSTEM.** The website can be publicly hosted on Vercel, but tasks, admin edits, carts and orders currently live inside each visitor's own browser (`localStorage`). They are not shared across devices, and there is no secure login, protected assets, or real bank/PayPal payment verification. Don't use this revision for real commission or money collection until Phase B connects a trusted backend.

## What's new in Phase A

| Request | Implementation |
| --- | --- |
| Clearer typography | Display font reserved for big headlines and wordmark; neutral sans-serif medium/semibold for prices, commission detail and dashboards; improved letter spacing |
| Softer neutral black | `--black: #282828` in `src/phase-a.css` (visual interpretation of dark near-K90 charcoal) |
| Remove 8-point purple symbol | Removed the repeating asterisk decoration in navigation, headings, header/footer, and homepage elements |
| Green ribbon spacing | Enlarged margin between pink/lilac homepage hero and green marquee |
| Replace ribbon hearts | Circles replace the heart separators in the lime-green running text |
| Required country | Customer chooses country before checkout. Indonesia remains IDR; others quoted in USD |
| International price ×3 | Formula: `(IDR subtotal after discount ÷ USD-to-IDR rate) × 3`, rounded to USD cents |
| Updated USD/IDR | Fetches daily reference FX from [ExchangeRate-API open access](https://www.exchangerate-api.com/docs/free), cached in browser for up to 24 hours. Their open rate updates **once daily**, not intraday. If unreachable, UI labels a **DEMO ESTIMATE** fallback of 18,000 IDR / USD |
| Payment instructions | `/payment/:orderId` route; Indonesian bank transfer / international manual PayPal instructions; order summary and copy buttons |
| Payment proof to WhatsApp | Prewritten WhatsApp message to **+62 823-1742-2632**; customer must attach image/receipt manually in WhatsApp |
| Admin payment settings | Under `/admin` → **Payment settings**: bank name, account number, account holder, PayPal email, WhatsApp; **local browser storage only** |
| Demo order statuses | Admin can locally mark awaiting payment, pending verification, or verified for illustration; no actual verification |

### Critical payment disclaimer

**Bank account and PayPal email have deliberately been left empty.** They were not provided by the owner, and fake bank details are unsafe. Fill them in through the preview admin panel to test the flow on **your own device**. Those edits are NOT published to other visitors in Phase A. Until Phase B, keep real payment/transfer instructions handled manually off-site.

The free indicative FX rate is **not** the actual settlement rate and cannot be considered a binding, accurate live transaction quote. Server-side price locking, shipping, fees, PayPal terms, and order verification belong to Phase B.

## Run locally

Requires Node.js 20+ (Node 22 recommended) and npm:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Build with:

```bash
npm run build
```

## Update the EXISTING Vercel website (important)

If you've already deployed the GitHub project `reinaldika/cocioco` and connected it to `cocioco.vercel.app`, **do not create a new Vercel project**.

1. Extract `COCIOCO_SHOP_PHASE_A_REVAMP.zip`.
2. Open the extracted `cocioco-shop` folder.
3. Replace/add **the files inside this folder** in the root of your existing GitHub repo. Do not put the ZIP itself or an extra nested `cocioco-shop` folder at the repo root if your existing project expects the source files at root.
4. Commit the changes to `main`. Vercel will automatically build and deploy the new version once Git integration is active.
5. In Vercel check Deployments → latest → **Ready**. Open `/cart`, select Indonesia or another country, fill demo checkout, and test `/payment/:id` on the same browser.

For a new project, import a Git repo into Vercel with preset **Vite**, install `npm install`, build `npm run build`, output `dist`. The provided `vercel.json` handles deep SPA routes.

**No environment keys are required for this Phase A demo.**

## Key pages

- `/` — homepage, illustrated products, animated marquee
- `/shop` — product catalog
- `/cart` — destination-aware product pricing, discount, and checkout
- `/payment/:id` — order payment instruction and WhatsApp proof handoff
- `/commissions` — commission listing
- `/commissions/CO-002` — project details, claim, demo countdown
- `/dashboard` — local designer workspace
- `/admin` — local admin task review, orders, **Payment settings**
- `/auth` — local-only admin/designer demo role switching

Sample promo code: `COCIO10`. Sample products and tasks are illustrative.

## Technical files

- `src/phase-a.css` — Phase A typography, spacing, new checkout/payment styles
- `src/styles.css` — original design system preserved underneath Phase A overrides
- `src/pages/Cart.tsx` — country selector, pricing, buyer form
- `src/pages/Payment.tsx` — new payment details and WhatsApp handoff
- `src/pricing.ts` — international multiplier + daily indicative FX fetch / demo fallback
- `src/countries.ts` — destination options
- `src/components/PaymentSettingsPanel.tsx` — demo admin editable payment information
- `src/store.tsx`, `src/types.ts` — demo order schema and state
- `src/data.ts` — illustrative products, tasks, marketplace links

## Demo constraints

- Every visitor gets separate local task/cart/order state. **A real admin cannot see customer orders across different browsers.**
- Admin/role switching is not secure. Browser localStorage is user-editable.
- Task claim/deadline and penalties are demonstrative only and do not enforce exclusivity across users.
- Payment details configured in admin are only local to that device. Do not use as publicly authoritative bank/PayPal information.
- WhatsApp link prepares a message but **cannot automatically attach a payment screenshot**.
- Digital assets / client briefs and submitted files are NOT securely stored; submission demo saves filename only.
- Product inventory, shipping totals, taxes, exchange-rate locking, price changes and order verification require the server-side Phase B migration.

See `docs/PHASE_B_IMPLEMENTATION.md` and `docs/PRODUCTION_ROADMAP.md` for the backend rollout plan.
