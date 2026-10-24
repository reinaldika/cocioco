# ✳ COCIOCO SHOP
### Make cute things happen.

A playful Y2K / kawaii-inspired **interactive website prototype** for COCIOCO SHOP, including a creative merchandise storefront and a freelance designer commission hub. This repository is ready to **deploy as a live interactive preview to Vercel**.

> **Important — preview vs. production:** This release runs in **browser-local demo mode**. Accounts, tasks, assignments, penalties, cart, and orders are stored only in the current browser's `localStorage`. They are not shared across visitors. Demo submissions save file metadata only, not actual files. There is **no real authentication, production-safe concurrent claiming, live database, payment processing, or shipping**. Do not accept real client briefs, private assets, payments, or freelance work until a secure backend and payment integrations are completed.

## Features already interactive

| Area | Included in interactive preview |
| --- | --- |
| Homepage | Responsive editorial hero, original stickers & merchandise artwork, hover effects, floating animations, scrolling marquee, CTAs |
| Shop | Physical / digital filters, search, sort, favorites, product details, quantity selector, cart |
| Checkout | Demo checkout form, `COCIO10` sample promo code, demo order confirmation; **no payment collected** |
| Commission Board | Task search/filter, task detail pages, public statuses, exclusive local demo claiming, countdowns |
| Task Workspace | Unlocked brief, downloadable sample text brief / SVG reference, sample file selection & metadata submission |
| Penalties | Demo missed-deadline policy 8 / 16 / 32 / 64 hours / permanent; lockout visible on designer profile |
| Designer Dashboard | Active tasks, countdowns, commission history, example earnings, penalty history |
| Admin Dashboard | Publish sample tasks, approve/revision/reopen/cancel, review sample submissions, simulate an expired claim, clear demo penalties |
| Accounts | Demo designer/admin role switching and local sample profile registration |
| Others | About page, external-marketplace placeholders, mobile menu, notifications, responsive UI |

All product names, pricing, task details, usernames, earnings, external marketplace links, and artwork are **sample content**, provided to make the website feel complete and testable.

## Tech stack

- React + TypeScript
- Vite
- React Router
- Framer Motion
- Lucide icon set
- Original lightweight SVG illustrations and custom CSS
- Browser `localStorage` for interactive demo state

## Run locally

Requires **Node.js 20 or 22** and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

To create the production build locally:

```bash
npm run build
npm run preview
```

The output is generated in `dist/`.

## Deploy to Vercel

### Option A: GitHub → Vercel (recommended)

1. Extract this ZIP.
2. Put the **contents** of the `cocioco-shop` directory in a Git repository and push it to GitHub.
3. In Vercel, choose **Add New → Project** and import the repository.
4. Vercel should detect **Vite**. If needed, set:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (if files are at repository root)
   - **Install Command:** `npm install`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click Deploy. There are **no required environment variables** for the interactive demo.

### Option B: Vercel CLI

After extracting and changing to the project directory:

```bash
npm install
npx vercel
# later, for production:
npx vercel --prod
```

`vercel.json` already configures SPA deep-link rewrites, so `/shop`, `/commissions/CO-001`, `/dashboard`, etc. resolve correctly after deployment.

**No Vercel account, domain, database, or payment credentials are embedded in the source.**

## Try the demo

1. Visit `/auth` and click **Explore as designer**.
2. Open `/commissions`, find an AVAILABLE task and click **Claim this task**.
3. Open the task details again to see the private brief, reference download, timer, and submission area.
4. Pick a test file and submit. The filename/status are recorded in this browser; the file content is **not uploaded**.
5. Sign out and choose **Explore admin panel** at `/auth`.
6. Go to **Overview** to approve the submission or request a revision.
7. To try penalty behavior, claim a different task as designer, switch to admin, open **Manage tasks**, and click **Test expiry** on the in-progress task. Switch back to designer to see the claim lockout and penalty history.
8. Shop the sample products, use discount code `COCIO10`, and complete a demo checkout to see the order in admin.

To start fresh, use **Reset entire demo** from **Admin → Shop orders**, or clear browser storage for the website.

## Where to customize

| Thing | File |
| --- | --- |
| Brand palette, layout, transitions, responsive styles | `src/styles.css` |
| Product inventory, prices, collections, task seeds | `src/data.ts` |
| Social links (currently **platform homepage placeholders**) | `src/data.ts` (`socials`) |
| Homepage sections | `src/pages/Home.tsx` |
| Commission board / detail / deadline demo | `src/pages/Commissions.tsx`, `src/pages/TaskDetail.tsx`, `src/store.tsx` |
| Dashboard / Admin interface | `src/pages/Dashboard.tsx`, `src/pages/Admin.tsx` |
| Original vector graphics | `public/assets/` |
| Browser tab logo | `public/favicon.svg` |
| Typography | `index.html` (Google Fonts) |

To add official Shopee, Etsy, Fiverr, and Dribbble pages, replace the placeholder URLs in `src/data.ts` before publicly promoting them.

## Before a real commercial launch

See **`docs/PRODUCTION_ROADMAP.md`** for an implementation checklist. At a minimum, you need:

- Real authenticated designer and admin accounts, approval workflows, roles and permissions.
- Persistent shared database and atomic task claiming enforced on the backend.
- Server-authoritative deadlines, reliable automatic expiry and penalty processing.
- Protected storage for client assets and real submitted deliverables.
- Secure admin review, revision deadlines, fraud/rate limiting and event logs.
- Payment gateway, order fulfillment, stock synchronization, digital license and download delivery.
- Payout tracking, dispute resolution, terms of use, and privacy policy.

### Design system

Main colors:

- Cream `#FFF6F4`
- Candy pink `#FC89CC`
- Pop purple `#8658C9`
- Lime `#E0F18D`
- Near-black `#282128`

Custom merchandise artwork is supplied as original vector illustrations so it remains crisp on retina displays.

---

**COCIOCO SHOP — A little creative universe to shop, design, collect and earn. ♡**
