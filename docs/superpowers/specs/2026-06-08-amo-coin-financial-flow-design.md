# AMO Coin Financial Flow Redesign

**Date:** 2026-06-08  
**Status:** Approved

---

## Overview

ปรับ financial flow ทั้งหมดให้ใช้ **AMO Coin (Ammonite Coin)** เป็น currency ของ platform (1 AMO = 1 USDT, UI rebrand เท่านั้น — DB ยังเป็น USDT). เพิ่ม gate สำหรับ deposit/withdraw, ปรับ fee structure, และ enforce ค่า minimum จาก `platform_settings`.

---

## 1. Schema Changes (Migration ใหม่)

ไฟล์: `supabase/migrations/20260608000009_amo_settings.sql`

```sql
insert into public.platform_settings (key, value) values
  ('min_deposit_amo',    '10'),
  ('min_withdraw_amo',   '200'),
  ('platform_flat_fee',  '1')
on conflict (key) do nothing;
```

Migrations ที่มีอยู่แล้ว (006–008) ใช้ได้ทันที ไม่ต้องแก้:
- `20260608000006_user_balances.sql` — `user_balances` + `deposit_requests` tables
- `20260608000007_deposit_sender_address.sql` — `deposit_requests.sender_address`
- `20260608000008_deposit_wallet.sql` — `profiles.deposit_wallet` + `profiles.deposit_wallet_network`

---

## 2. Wallet Settings (Profile Page)

### Location
หน้า `/profile` — เพิ่ม "Wallet Settings" card ใต้ KYC card

### UI — 2 ช่องแยกกัน

**Deposit Sender Address** (`profiles.deposit_wallet` + `profiles.deposit_wallet_network`)
- Label: "Deposit sender address"
- Description: "Wallet address ที่คุณจะส่ง AMO จาก — ต้องตั้งก่อนถึงจะ deposit ได้"
- Fields: network selector (TRC20 / ERC20) + address input + Save button
- Component ใหม่: `components/wallet/DepositWalletForm.tsx`
- Server action: `saveDepositWallet` (มีอยู่แล้วใน `lib/actions/deposits.ts`)

**Withdraw Wallet** (`profiles.wallet_address` + `profiles.wallet_network`)
- Label: "Withdraw wallet (Seller payout)"
- Description: "AMO จาก sales จะโอนออกมาที่ address นี้"
- Fields: network selector (TRC20 / ERC20) + address input + Save button
- Component เดิม: `components/wallet/WalletAddressForm.tsx`

### Files ที่ต้องแก้
- `app/[locale]/(main)/profile/page.tsx` — fetch `deposit_wallet`, `deposit_wallet_network` เพิ่ม, render card ใหม่

---

## 3. Deposit Gate

### Rule
ถ้า `profiles.deposit_wallet` เป็น null → แสดง banner แทน deposit form

### Banner UI (ใน `/wallet`)
```
┌─────────────────────────────────────────────────────────┐
│ ⚠  ต้องตั้ง deposit sender address ก่อน              │
│    ไปที่ Profile → Wallet Settings เพื่อกรอก address   │
│    [ ไปตั้งค่า → ]  (link to /profile#deposit-wallet)  │
└─────────────────────────────────────────────────────────┘
```

### Implementation
- `app/[locale]/(main)/wallet/page.tsx` — fetch `deposit_wallet` จาก profile, pass เป็น prop
- `components/wallet/DepositForm.tsx` — รับ prop `hasDepositWallet: boolean`; ถ้า false แสดง banner แทน form
- Server action `submitDeposit` ยังมี guard นี้อยู่แล้ว (defense in depth)

---

## 4. Seller Withdraw Requirements

### 3 เงื่อนไข (ต้องผ่านทั้งหมดถึงจะ Request Payout ได้)

| # | เงื่อนไข | DB check |
|---|---------|---------|
| 1 | KYC approved | `profiles.kyc_status = 'approved'` |
| 2 | Withdraw wallet set | `profiles.wallet_address IS NOT NULL` |
| 3 | ยอดขาย ≥ 1 ชิ้น | `COUNT(orders WHERE seller_id = uid AND status = 'completed') >= 1` |

### UI — Checklist บน `/wallet` (Seller Earnings section)

```
Withdraw Requirements
  ✅ / ❌  KYC Verified              [Verify →]
  ✅ / ❌  Withdraw wallet set       [Set wallet →]
  ✅ / ❌  ยอดขาย ≥ 1 ชิ้น
```

- ปุ่ม "Request Payout" disabled จนกว่าทุกข้อจะ ✅
- แต่ละข้อที่ ❌ แสดง action link ไปหน้าที่เกี่ยวข้อง

### Server Action `requestPayout` (lib/actions/payouts.ts หรือ wallet.ts)

```ts
// 1. KYC check
if (profile.kyc_status !== 'approved') return { error: 'KYC verification required' }

// 2. Wallet check
if (!profile.wallet_address) return { error: 'Withdraw wallet not set' }

// 3. Completed sales check
const { count } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true })
  .eq('seller_id', userId)
  .eq('status', 'completed')
if ((count ?? 0) < 1) return { error: 'At least 1 completed sale required' }

// 4. Min withdraw check (from platform_settings)
if (balance < minWithdraw) return { error: `Minimum withdrawal is ${minWithdraw} AMO` }
```

### Buyer Withdraw
Buyer ไม่มี `seller_balances` → Seller Earnings section ซ่อนอยู่แล้ว (เงื่อนไข `!!sellerBalances?.length`)  
ไม่ต้องแก้เพิ่ม

---

## 5. Fee Structure

### Formula (ใช้ทั้ง complete order + resolve dispute → release_to_seller)

```
seller_receives = order.amount
               - (order.amount × platform_fee_pct / 100)
               - platform_flat_fee
```

ตัวอย่าง: 100 AMO → 100 − 5 − 1 = **94 AMO**

### Settings ที่ใช้
- `platform_fee_pct` — อ่านจาก order row (stored per-order)
- `platform_flat_fee` — อ่านจาก `platform_settings` ตอน complete

### Files ที่ต้องแก้

**`lib/actions/admin.ts` — `resolveDispute`**
```ts
// เดิม
const sellerAmount = order.amount - fee  // fee = amount * pct / 100

// ใหม่
const flatFee = Number(settings?.platform_flat_fee ?? 1)
const sellerAmount = order.amount - fee - flatFee
```

**`lib/actions/orders.ts` — `confirmPaymentReceived`**
```ts
// เดิม: ไม่มี flat fee
// ใหม่: หัก flat fee เพิ่ม
const flatFee = Number(settings?.platform_flat_fee ?? 1)
const sellerAmount = order.amount - percentFee - flatFee
```

### Listing Form — Fee Preview

`components/listings/ListingForm.tsx` — แสดง realtime fee breakdown เมื่อ user ใส่ราคา:

```
Price: 100 AMO
  Platform fee (5%):  −5.00 AMO
  Flat fee:           −1.00 AMO
  ─────────────────────────────
  You receive:        94.00 AMO
```

อ่าน `platform_fee_pct` (default 5) และ `platform_flat_fee` (default 1) จาก props ที่ page fetch มา

---

## 6. AMO Coin Branding

### Rule
`USDT` → `AMO` ใน UI ทุกที่ที่ user เห็น. DB column `currency` ยังคงเป็น `'USDT'` — ไม่แก้ backend.

### Files ที่ต้องอัป label

| File | จุดที่ต้องแก้ |
|------|-------------|
| `components/wallet/DepositForm.tsx` | "Send USDT" → "Send AMO", amount label, warning text |
| `app/[locale]/(main)/wallet/page.tsx` | "Spendable Balance … USDT" → "AMO", deposit history amounts |
| `components/orders/PaymentSection.tsx` | ราคา order ใน payment step |
| `app/[locale]/(main)/market/[id]/page.tsx` | ราคา listing |
| `components/listings/ListingForm.tsx` | price currency display |
| `components/listings/ListingCard.tsx` | ราคา card |
| `app/[locale]/(main)/orders/[id]/page.tsx` | order amount |

### ไม่แก้ (admin-facing, internal)
- `app/[locale]/admin/**` — admin เห็น USDT ได้ปกติ

---

## 7. Min Deposit / Min Withdraw Enforcement

### Deposit (lib/actions/deposits.ts — `submitDeposit`)

```ts
const { data: settings } = await supabase
  .from('platform_settings')
  .select('key, value')
  .in('key', ['min_deposit_amo'])
const minDeposit = Number(settings?.find(s => s.key === 'min_deposit_amo')?.value ?? 10)

if (claimedAmount < minDeposit) {
  return { error: `Minimum deposit is ${minDeposit} AMO` }
}
```

แสดง hint ใต้ amount input ใน `DepositForm.tsx`:  
`Minimum deposit: {minDeposit} AMO`

### Withdraw (requestPayout action)

```ts
const minWithdraw = Number(settings?.find(s => s.key === 'min_withdraw_amo')?.value ?? 200)
if (balance < minWithdraw) {
  return { error: `Minimum withdrawal is ${minWithdraw} AMO` }
}
```

แสดงใต้ปุ่ม: `Min. {minWithdraw} AMO`

---

## 8. Files Summary

### New files
- `supabase/migrations/20260608000009_amo_settings.sql`
- `components/wallet/DepositWalletForm.tsx` (แยกจาก WalletAddressForm)

### Modified files
| File | Change |
|------|--------|
| `lib/actions/admin.ts` | flat fee ใน `resolveDispute` |
| `lib/actions/orders.ts` | flat fee ใน `confirmPaymentReceived` |
| `lib/actions/deposits.ts` | min deposit enforcement |
| `lib/actions/payouts.ts` (หรือที่เก็บ requestPayout) | 3-condition gate + min withdraw |
| `components/wallet/DepositForm.tsx` | deposit gate banner, AMO label, min hint |
| `components/listings/ListingForm.tsx` | fee breakdown preview |
| `app/[locale]/(main)/wallet/page.tsx` | fetch deposit_wallet, pass to DepositForm, AMO labels, checklist |
| `app/[locale]/(main)/profile/page.tsx` | DepositWalletForm card |
| `components/listings/ListingCard.tsx` | AMO label |
| `app/[locale]/(main)/market/[id]/page.tsx` | AMO label |
| `app/[locale]/(main)/orders/[id]/page.tsx` | AMO label |

---

## 9. Platform Settings Keys Reference (after migration)

| key | default | description |
|-----|---------|-------------|
| `platform_fee_pct` | `5.00` | % fee on completed orders |
| `platform_flat_fee` | `1` | Flat AMO fee per completed order |
| `min_deposit_amo` | `10` | Minimum deposit amount |
| `min_withdraw_amo` | `200` | Minimum withdrawal amount |
| `escrow_wallet_erc20` | — | Platform ERC20 deposit address |
| `escrow_wallet_trc20` | — | Platform TRC20 deposit address |
| `escrow_wallet_erc20_testnet` | — | Testnet ERC20 |
| `escrow_wallet_trc20_testnet` | — | Testnet TRC20 |
