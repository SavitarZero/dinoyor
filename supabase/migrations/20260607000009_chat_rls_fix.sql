-- Fix: msg_participant policy references conversations (also RLS-enabled),
-- which causes Supabase Realtime to silently drop events for the receiver.
-- Solution: wrap the cross-table check in a SECURITY DEFINER function so
-- Realtime can evaluate it without hitting the RLS wall on conversations.

create or replace function public.is_conversation_participant(conv_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversations
    where id = conv_id
    and (buyer_id = auth.uid() or seller_id = auth.uid())
  );
$$;

-- Rebuild the policy to use the function
drop policy if exists "msg_participant" on public.messages;
create policy "msg_participant" on public.messages for all
  using (public.is_conversation_participant(conversation_id));
