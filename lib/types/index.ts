export type OrderStatus =
  | 'awaiting_payment'
  | 'paid_escrow'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'cancelled'

export type KYCStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type Currency = 'USDT' | 'ETH' | 'BTC'
export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  role: UserRole
  kyc_status: KYCStatus
  preferred_language: 'en' | 'th'
  created_at: string
}

export interface Game {
  id: string
  name: string
  slug: string
  category: string | null
  logo_url: string | null
  banner_url: string | null
}

export interface GameWithStats extends Game {
  listing_count: number
}

export interface Listing {
  id: string
  seller_id: string
  game_id: string
  title: string
  description: string | null
  delivery_time: string | null
  price_amount: number
  price_currency: Currency
  images: string[]
  extra_fields: Record<string, unknown>
  status: 'active' | 'sold' | 'cancelled'
  sold_count: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string | null
  body: string
  created_at: string
  profiles?: { username: string | null; avatar_url: string | null } | null
}

export interface Conversation {
  id: string
  order_id: string
  buyer_id: string
  seller_id: string
  created_at: string
}

export interface ListingWithGame extends Listing {
  games: Game | null
  profiles?: { username: string | null } | null
}

export interface Order {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  amount: number
  currency: Currency
  platform_fee_pct: number
  status: OrderStatus
  auto_release_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderWithDetails extends Order {
  listings: { title: string; images: string[] } | null
  buyer: { username: string | null } | null
  seller: { username: string | null } | null
}

export interface KYCSubmission {
  id: string
  user_id: string
  id_card_url: string
  phone: string
  status: KYCStatus
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Dispute {
  id: string
  order_id: string
  opened_by: string
  reason: string
  status: 'open' | 'resolved'
  resolution: 'release_to_seller' | 'refund_to_buyer' | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface SellerBalance {
  id: string
  seller_id: string
  pending_amount: number
  currency: Currency
}

export interface Payout {
  id: string
  seller_id: string
  amount: number
  currency: Currency
  tx_hash: string | null
  wallet_address: string
  processed_by: string | null
  processed_at: string
}
