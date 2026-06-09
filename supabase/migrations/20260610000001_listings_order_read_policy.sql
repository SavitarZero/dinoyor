-- Allow order participants to read listings linked to their orders
-- This fixes the issue where completed orders with non-active listings
-- are invisible due to RLS on listings (status = 'active' only)

create policy "listings_order_participant_read" on public.listings for select using (
  exists (
    select 1 from public.orders
    where orders.listing_id = listings.id
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid())
  )
);
