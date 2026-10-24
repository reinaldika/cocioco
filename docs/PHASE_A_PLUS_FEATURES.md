# COCIOCO SHOP · Phase A+ Interactive Features

This ZIP updates **the existing Phase A React + Vite demo**; do not confuse a publicly viewable preview with a secure, persistent live commerce operation.

## 1. Manual shipment tracking

- Routes: `/track` and `/track/:id`.
- Customer must enter a matching **order ID and checkout email**. In this prototype, these records only exist in the browser that created them.
- Admin demo: `/auth` → **Admin preview** → `/admin` → **Orders & tracking**.
- Mark payment **Verified** before advancing shipment status. Then save preparation, packing, courier handoff, in transit, delivery or cancellation, optionally with timestamped notes, carrier name and tracking reference.
- Customer sees a progress timeline with timestamps. The UI explicitly says the status is entered manually by COCIOCO, not live courier tracking.
- Do NOT mistake this browser-based lookup for secure customer authorization; Phase B requires server authentication / private database queries / anti-enumeration controls.

## 2. Custom merchandise studio

- Route: `/custom`.
- Merchandise: Collection Book, Card Holder, Keychain and Photocard Set.
- Choose size, material, finish, quantity, and whether to provide artwork or request design support.
- Automatic IDR estimate with bulk savings and a **one-time** designer fee. Base and designer fees are adjustable in admin → **Custom pricing**.
- Add the configured merchandise to the same cart and checkout as standard stock. International checkout still uses published USD–IDR rate ×3; shipping/customs excluded.
- An uploaded artwork/reference file is **NOT transmitted**. Only the filename is shown in the local order data. The UI prominently warns the customer.
- After a design-service order has payment verified, admin → Orders can **prepare a commission task**. The admin chooses the designer reward and reviews the prefilled brief. Publication is manual, not automatic. Customer contact details are not copied into the task brief.
- Do not accept genuine custom files until a private upload backend is installed.

## 3. Leaderboard

- Route: `/leaderboard`.
- Separate rankings: **Top Designers** and **Top Collectors**.
- Demo examples are explicitly labeled fictional, with a switch to **Local activity**.
- Local designers ranked by number of completed/approved tasks. Values in IDR represent **approved commission value, not confirmed payouts**. The earnings display requires designer opt-in; otherwise it says Private.
- Local buyers/collectors must opt in during checkout with a public nickname. Only **verified** local demo orders count. Points = 100 per verified order + 20 per item; no expenditure amounts are public.
- A Last 30 Days view is available on local activity. Example profiles are not real users.
- Production needs secure contributor profiles, payout history, and ranking materializations that never expose private customer order totals.

## 4. Gives Back / social activity journal

- Routes: `/giving` and `/giving/:slug`.
- No public amount-donated counter, no real-time financial totals. Instead a journal of editorial articles.
- Intro describes the **intended** 2.5% contribution from eligible ready-stock revenue after discounts (not shipping/tax).
- Staff demo → **Giving articles** supports draft/publish/edit/delete in local browser. For an activity article, publishing requires explicit admin acknowledgment that the event happened and the content is accurate.
- Default intro is an explanation of intentions, NOT a claimed completed donation. Default fictional activity template is **draft-only**.
- Before promoting an actual giving campaign, confirm its operating rules, applicable Indonesian regulations and any required permissions. Publish only verified event details and images used with appropriate consent.

## Existing Phase A preserved

- Homepage with pink-purple-lime Y2K identity, existing product shop, cart, country selection, IDR→USD ×3 pricing, manual bank/PayPal payment instruction pages, WhatsApp proof link (082317422632), commission board, 8-hour claim countdown demo, penalty levels and original admin tools.
- No real payment, shipping integration, automatic designer payout or real file upload occurs.

## Test flow (single-browser demo)

1. Visit `/custom`, select any merchandise, pick options, input design notes, check the demo acknowledgement, then add to cart.
2. On `/cart`, choose Indonesia or another country, optionally opt into Collectors Club, fill customer details, submit to `/payment/ORDER_ID`.
3. Note the order ID and email, visit `/track`, use the same pair to see its initial status.
4. In the **same browser**, go to `/auth` → sign in with **Admin preview**; go to `/admin` → **Orders & tracking**. Set payment to Verified, select Packed With Love, optionally enter courier/resi, then Save tracking update.
5. Return to `/track`, use the same order ID and email; confirm new status and timeline appear. If the order requests designer help, click **Prepare designer task** on the verified order and publish after setting a fair reward.
6. Visit `/leaderboard`: compare illustrative examples to Local activity. Once the opted-in order is verified, the local buyer is eligible.
7. In admin → **Giving articles**, edit the introductory story or create a real, verified activity article; view at `/giving`.

**All steps above simulate state in one browser only.** Different devices/admin users will not share state until Phase B.
