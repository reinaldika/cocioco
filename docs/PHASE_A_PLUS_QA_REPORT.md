# Phase A+ quality assurance and known limits

Run date: 2026-10-24.

## Automated checks completed in the authoring environment
- TypeScript/TSX **syntax transpilation** using a local TypeScript compiler: 36 TS/TSX modules, no syntax errors.
- Local import path resolution: no missing relative source imports.
- React Router SPA paths reviewed for `/custom`, `/cart`, `/payment/:id`, `/track`, `/track/:id`, `/leaderboard`, `/giving`, `/giving/:slug`, admin and commissions.
- CSS parsed (original, Phase A overrides and Phase A+ overrides): no top-level parse errors.
- Nine SVG assets parsed successfully.
- Business math independently executed and asserted for 4 custom product types, quantity savings, one-time designer fee, cart totals, and international price formula (Rp180,000 / 18,000 USD rate ×3 = USD 30).
- Demo article defaults checked: program introduction is not a claim of prior completed activity; fictional activity report is draft-only.

## Not verified here
- The full `npm run build` was **not run successfully** because npm registry DNS resolution failed with `EAI_AGAIN` in the execution environment. Node dependencies could not be installed here. The code is packaged for Vercel's normal `npm install` and `npm run build`, but a successful deployment is not yet verified. Inspect Vercel's build logs and fix any reported issues before production use.
- No authenticated multi-user or real bank/payment/shipping integration tests. Current prototype saves state in localStorage.
- Custom design files are not uploaded: only the filename is noted in the demo.

## Manual acceptance checklist after a Vercel preview is Ready
1. Homepage renders 4 category cards; all navigation and responsive mobile menu links work.
2. `/custom`: each merchandise configuration updates the price and has a functioning four-step flow. Customer can add the custom item to cart; design fee is charged once.
3. `/cart`: country selection is required, IDR is local, USD estimates are multiplied by 3; checkout leads to `/payment/:id` with custom item summary.
4. `/track`: submitting order ID + email shows initial status, not a different email's order.
5. `/admin` via demo login: mark payment Verified, then use Orders & tracking to update packing / courier details; look up order again to verify a new timeline event.
6. Admin → Custom pricing: edit a base price / service fee; check configurator estimate updates in **same browser**.
7. Verified custom orders requesting designer service: Admin → Prepare designer task → enter reward → publish; task appears in Commission Hub.
8. `/leaderboard`: Creator/Collector tabs work, example data is labeled fictional, Local activity respects opt-ins and verified-order logic.
9. Admin → Giving articles: draft, edit and publish a real program introduction. Attempt to publish an activity report without verification acknowledgment: it should remain unpublished. Published articles render at `/giving/:slug`.
10. Repeat on mobile width. Verify no keyboard traps and no obstructed controls.

Release status: **deployable interactive preview**, not production-ready commerce.
