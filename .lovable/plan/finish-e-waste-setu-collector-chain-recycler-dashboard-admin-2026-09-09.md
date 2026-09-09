# Finish E-Waste Setu: collector chain, recycler dashboard, admin dashboard

## Current state (verified)

- Built: landing, login (all three roles), collector shell + home, scan, prices, my lots, lot detail.
- The lot detail, home and login screens already link to pages that do not exist yet: `/collector/recyclers`, `/collector/handover/$lotId`, `/collector/payment/$lotId`, `/collector/receipt/$lotId`, `/collector/earnings`, `/collector/safety`, `/collector/notifications`, `/recycler`, `/admin`. Until they are built those links (and the typecheck) are broken.
- All business actions already exist in `src/lib/actions.ts` (createLot, requestPickup, recyclerRespond, createHandover, confirmHandover, markPayment) and the store already has `recommendRecyclers`, `priceFor`, `collectorStats`. `qrcode` and `recharts` are installed. No new data logic is needed for the collector chain; recycler/admin need a few small additions.

## Part 1 — Finish the collector chain (7 screens)

1. **Find Recycler** `/collector/recyclers?lot=` — ranked list from `recommendRecyclers` (rate, distance, pickup available, rating, verified badge), "Best match" highlight, compare view, select → pickup form.
2. **Pickup request** (same screen, step 2) — date, time slot, location, quoted price (rate × lot weight) → `requestPickup` → lot moves to "pickup requested"; success toast + notification to recycler.
3. **Handover with QR** `/collector/handover/$lotId` — confirm final weight and price (prefilled from quote, warns if far below quote), optional photo, `createHandover` → shows a QR code (lot id + handover id + weight + price + timestamp) the recycler scans, plus "waiting for recycler confirmation" state.
4. **Payment** `/collector/payment/$lotId` — choose Cash / UPI (UPI shows a demo UPI QR), amount, `markPayment`; then redirect to receipt.
5. **Receipt** `/collector/receipt/$lotId` — printable receipt card with lot, recycler, weight, price, payment mode, traceability id; share/print button.
6. **My Earnings** `/collector/earnings` — completed vs pending totals, monthly bar chart, per-material breakdown, ledger list (every transaction with status chips and link to receipt/lot).
7. **Safety** and **Notifications** — safety guide (do/don't cards with speak buttons); notifications list with mark-as-read.

## Part 2 — Recycler dashboard `/recycler/*`

Layout with sidebar/bottom nav, scoped to the logged-in recycler's id everywhere.

- **Overview** — today's stats (incoming lots, pending pickups, kg received this month, amount paid), recent activity.
- **Incoming lots** — available lots in service area matching accepted materials; filter by material/location; lot detail with photos and estimate; "Make offer" (pre-quotes).
- **Pickup requests** — lots where this recycler was selected: accept (optionally counter-quote) / reject → `recyclerRespond`; scheduled list with date/time/location and a "Mark collected" shortcut.
- **Handover verification** — enter/scan handover id (camera QR scan via `html5-qrcode`, plus manual entry), shows collector's declared weight/price and photo, confirm → `confirmHandover`; then "Record payment" (cash/UPI) → `markPayment`.
- **Transactions** — table of this recycler's transactions with payment status, flags, export CSV.
- **Analytics** — kg by material (pie/bar), monthly volume and spend, top collectors, average price vs market range.
- **Profile / rates** — edit offered rates per material, pickup availability, service areas (new `updateRecycler` action).

## Part 3 — Admin dashboard `/admin/*`

- **Overview** — platform KPIs: collectors, verified/pending recyclers, lots by status, total kg diverted, GMV, commission (from settings).
- **Recycler verification** — list with status filter; detail shows authorization number, materials, location; approve / reject / suspend with note (new `setRecyclerStatus` action; only verified recyclers appear to collectors).
- **Price management** — table of current prices per material × location; add/edit price entry (buying price, market min/max) → feeds collector price board immediately; price history chart.
- **Materials** — CRUD on material catalogue (category, subcategory, icon, typical weight, condition, base value).
- **Transactions** — all transactions, filters by status/recycler/location, flagged ones highlighted, resolve flag.
- **Lots** — all lots with status, sync state, collector, recycler; open traceability timeline.
- **Analytics** — kg by category, volume by city, recycler leaderboard, weekly trend, payment mode split.
- **Settings** — commission %, pickup cost, ops cost; reset demo data button.

## Part 4 — End-to-end walkthrough

After building, run the full journey in the preview browser and fix anything that breaks:
scan PCB → create lot → find recycler → request pickup → (recycler) accept → (collector) handover + QR → (recycler) scan/confirm handover → (recycler) record UPI payment → (collector) receipt appears and My Earnings total increases; admin sees the lot, transaction and analytics update. Also verify offline mode queues the lot and syncs when back online.

## Technical notes

- New routes: `collector.recyclers.tsx`, `collector.handover.$lotId.tsx`, `collector.payment.$lotId.tsx`, `collector.receipt.$lotId.tsx`, `collector.earnings.tsx`, `collector.safety.tsx`, `collector.notifications.tsx`, `recycler.tsx` (layout) + 7 children, `admin.tsx` (layout) + 8 children. Each gets its own `head()` metadata.
- Role guards live in the `recycler.tsx` / `admin.tsx` layouts (same pattern as `collector.tsx`) with a "continue as demo recycler/admin" button.
- New actions in `actions.ts`: `updateRecycler`, `setRecyclerStatus`, `upsertPrice`, `upsertMaterial`, `deleteMaterial`, `resolveFlag`, `updateSettings`, `markNotificationsRead`. Everything stays in the existing localStorage store (no backend); Lovable Cloud can be added later without changing screens.
- QR generation via `qrcode` (already installed); QR scanning via `html5-qrcode` (new dependency) with manual entry fallback. Charts via `recharts` (already installed) plus existing `Sparkline`/`Bars`.
- Add i18n keys for the new collector screens (mr/hi/en); recycler and admin dashboards are English-only.
- Work will be split into three parallel batches (collector, recycler, admin), then the walkthrough.
