# Dinoyor — Gaming Item Marketplace Design Spec

**Date:** 2026-06-05
**Status:** Approved

---

## 1. Product Overview

**Dinoyor** is a peer-to-peer marketplace for gamers in Southeast Asia to buy and sell tradeable in-game items (skins, weapons, cosmetics) using cryptocurrency payments, protected by a centralized escrow wallet.

- **Primary language:** EN + TH (bilingual)
- **Target region:** Southeast Asia
- **Phase 1 scope:** Buy/Sell only (no Trade/Auction)
- **Item scope:** Tradeable in-game items only (no accounts)

---

## 2. User Roles

| Role | Capabilities |
|---|---|
| **Guest** | Browse listings, view item details |
| **Buyer** | Purchase items, confirm receipt, raise dispute |
| **Seller** | List items, deliver item + upload screenshot proof, receive monthly payouts |
| **Admin** | Approve KYC, resolve disputes, manage monthly payouts, set platform fee % |

---

## 3. Escrow Flow

```
1. Buyer pays crypto → Platform Escrow Wallet
2. Seller delivers item + uploads screenshot proof
3. Buyer confirms receipt → Order marked Complete
4. Seller balance updated (pending payout)
5. Payout released on monthly cycle
```

**Auto-release:** If buyer does not confirm within 7 days of seller marking delivered, funds auto-release to seller. Buyer can raise a dispute before the timer expires to pause auto-release.

---

## 4. Authentication & KYC

### Authentication
- Email + Password (Supabase Auth)
- OAuth: Google, Discord

### KYC (required to sell, optional to buy)
- Upload national ID photo
- Verify phone number (OTP)
- Admin manually approves KYC submission
- KYC status: `pending` | `approved` | `rejected`

---

## 5. Core Features (MVP)

### 5.1 Listings
- **Required fields:** Item name, game, price (in USDT/ETH/BTC), at least 1 image
- **Optional fields:** Description, item stats/rarity, condition, server/region
- Seller must be KYC-approved to create a listing
- Listing status: `active` | `sold` | `cancelled`

### 5.2 Search & Discovery
- Filter by: game, price range, item type
- Sort by: newest, lowest price, highest price
- Full-text search by item name

### 5.3 Order Management
- Buyer sees: order status, seller proof screenshot, auto-release countdown
- Seller sees: order status, confirm button after delivering, payout history
- Order status: `awaiting_payment` | `paid_escrow` | `delivered` | `completed` | `disputed` | `cancelled`

### 5.4 Proof of Delivery
- Seller must upload at least 1 screenshot when marking an order as delivered
- Screenshots stored in Supabase Storage
- Visible to buyer and admin

### 5.5 Wallet & Payouts
- Platform holds a centralized escrow wallet
- Seller dashboard shows: pending balance, available balance, payout history
- Payouts processed once per month by admin
- Supported crypto: USDT, ETH, BTC

### 5.6 Auto-release Timer
- 7-day countdown starts when seller marks order as delivered
- Countdown visible on order page for buyer
- On expiry: funds release to seller automatically, order marked completed

### 5.7 Dispute System
- Buyer can open a dispute before auto-release timer expires
- Dispute pauses auto-release
- Admin reviews screenshots + chat history and manually resolves
- Resolution: release to seller OR refund to buyer

---

## 6. Admin Panel

| Feature | Description |
|---|---|
| KYC Queue | View pending KYC submissions, approve/reject with reason |
| Dispute Queue | View open disputes, see evidence, mark resolution |
| Payout Management | View pending seller balances, process monthly payouts |
| Fee Settings | Set global platform fee % taken from seller per completed order |

---

## 7. Fee Structure

- Platform fee = configurable % of order value
- Deducted from seller's payout automatically
- Displayed transparently to seller at listing creation

---

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Auth | Supabase Auth (Email + OAuth) |
| Database | Supabase PostgreSQL |
| File Storage | Supabase Storage (item images, KYC docs, proof screenshots) |
| Realtime | Supabase Realtime (order status updates) |
| Payments | Centralized crypto wallet (manual integration, USDT/ETH/BTC) |
| Styling | Tailwind CSS — dark gaming theme |
| Hosting | Vercel |

---

## 9. Database Schema (high-level)

```
users              — id, email, role, kyc_status, created_at
kyc_submissions    — id, user_id, id_card_url, phone, status, reviewed_by
listings           — id, seller_id, game, name, description, price, currency, images[], status
orders             — id, listing_id, buyer_id, seller_id, amount, currency, status, auto_release_at
order_proofs       — id, order_id, screenshot_urls[], uploaded_at
disputes           — id, order_id, opened_by, reason, status, resolved_by, resolution
seller_balances    — id, seller_id, pending_amount, currency
payouts            — id, seller_id, amount, currency, processed_at, tx_hash
```

---

## 10. UI / Design

- **Theme:** Dark — black/near-black background, subtle gray cards
- **Accent color:** Single accent (e.g. cyan or green neon)
- **Reference:** Steam Community Market aesthetic
- **Responsive:** Mobile-first, works on desktop and mobile

---

## 11. Out of Scope (Phase 1)

- Item trading (swap item-for-item)
- Auction / bidding
- Account sales
- Smart contract / on-chain escrow
- In-app messaging between buyer/seller
- Multiple languages beyond EN + TH
