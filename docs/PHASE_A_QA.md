# COCIOCO SHOP — Phase A Quality Check

## Source checks performed

- TypeScript/TSX files parsed/transpiled through the installed TypeScript compiler's `transpileModule` API, with no syntax diagnostics.
- CSS files parsed through PostCSS without syntax errors.
- React import paths and public asset references checked for file presence.
- Pricing math verified using the specification's example: 180,000 IDR / 18,000 IDR per USD * 3 = **30.00 USD**.
- Verified that country-specific manual payment routes, local order capture, WhatsApp number, and admin settings exist in source.
- Reviewed representative desktop and mobile static mockups of Phase A styling (not a live compiled browser run).

## Not verified in this execution environment

An end-to-end Vite/TypeScript bundle build and actual interactive browser checkout have **not** been verified, because this environment cannot resolve the npm registry to install dependencies. Source syntax passing is not a substitute for `npm run build` or end-to-end testing. Vercel's first deployment of the prior app was successful according to the owner.

## Required smoke tests after Vercel reports Ready

1. Open `/` and inspect typography, pink/lilac cards, green ticker gaps, and circular separators on desktop and mobile.
2. Open `/shop` and add any item to cart.
3. Visit `/cart`; check Continue is disabled before country selection.
4. Choose **Indonesia**; verify IDR pricing, buyer form, `/payment/:id`, and bank instructions/WhatsApp guidance.
5. Choose **United States**; verify USD pricing formula, FX source/date or DEMO indicator, then international PayPal instructions/WhatsApp guidance.
6. Use the `/auth` demo admin role and `/admin` → Payment settings to preview how payment details are rendered in the **same browser**. Do not use this as production configuration.
7. Test `/commissions/CO-002` and `/dashboard` to ensure previous commission demo remains navigable.
8. Check mobile at narrow widths and read full build logs for any TypeScript/compiler issues.

## Production gate

**Phase A must not be used for real orders or commissioned work.** Account identity, order records, admin edits, private assets, deadline enforcement, and receipts are browser-only. Implement Phase B's shared database, role access, server payment verification, and server-authoritative commission logic first.
