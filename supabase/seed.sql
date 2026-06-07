-- ─────────────────────────────────────────────
-- Games — grouped by category
-- ─────────────────────────────────────────────
insert into public.games (name, slug, category, logo_url, banner_url) values

  -- MMORPG
  ('Albion Online',        'albion-online',       'MMORPG',                '/games/albion-online/logo.webp',       '/games/albion-online/banner.webp'),
  ('Old School RuneScape', 'osrs',                'MMORPG',                '/games/osrs/logo.webp',                '/games/osrs/banner.webp'),
  ('RuneScape 3',          'runescape-3',         'MMORPG',                '/games/runescape-3/logo.webp',         null),
  ('World of Warcraft',    'wow',                 'MMORPG',                '/games/wow/logo.webp',                 '/games/wow/banner.webp'),
  ('Black Desert Online',  'black-desert-online', 'MMORPG',                '/games/black-desert-online/logo.webp', '/games/black-desert-online/banner.webp'),
  ('Path of Exile 2',      'path-of-exile-2',     'MMORPG',                '/games/path-of-exile-2/logo.webp',     '/games/path-of-exile-2/banner.webp'),
  ('Path of Exile',        'path-of-exile',       'MMORPG',                '/games/path-of-exile/logo.webp',       null),
  ('Lost Ark',             'lost-ark',            'MMORPG',                '/games/lost-ark/logo.webp',            '/games/lost-ark/banner.webp'),
  ('Ragnarok Online',      'ragnarok-online',     'MMORPG',                '/games/ragnarok-online/logo.webp',     null),
  ('Lineage 2',            'lineage-2',           'MMORPG',                '/games/lineage-2/logo.webp',           null),
  ('Mabinogi',             'mabinogi',            'MMORPG',                '/games/mabinogi/logo.webp',            null),
  ('MapleStory',           'maplestory',          'MMORPG',                '/games/maplestory/logo.webp',          null),
  ('Mir4',                 'mir4',                'MMORPG',                '/games/mir4/logo.webp',                null),
  ('EVE Online',           'eve-online',          'MMORPG',                '/games/eve-online/logo.webp',          '/games/eve-online/banner.webp'),

  -- Survival / Sandbox
  ('Rust',                 'rust',                'Survival / Sandbox',    '/games/rust/logo.webp',                '/games/rust/banner.webp'),
  ('ARK: Survival Ascended','ark-sa',             'Survival / Sandbox',    '/games/ark-sa/logo.webp',              '/games/ark-sa/banner.webp'),
  ('ARK: Survival Evolved','ark-se',              'Survival / Sandbox',    '/games/ark-se/logo.webp',              null),
  ('Minecraft',            'minecraft',           'Survival / Sandbox',    '/games/minecraft/logo.webp',           '/games/minecraft/banner.webp'),
  ('Unturned',             'unturned',            'Survival / Sandbox',    '/games/unturned/logo.webp',            null),

  -- Shooter / Skin Market
  ('Counter-Strike 2',     'cs2',                 'Shooter / Skin Market', '/games/cs2/logo.webp',                 '/games/cs2/banner.webp'),
  ('Dota 2',               'dota2',               'Shooter / Skin Market', '/games/dota2/logo.webp',               '/games/dota2/banner.webp'),
  ('Team Fortress 2',      'tf2',                 'Shooter / Skin Market', '/games/tf2/logo.webp',                 null),
  ('PUBG: Battlegrounds',  'pubg',                'Shooter / Skin Market', '/games/pubg/logo.webp',                '/games/pubg/banner.webp'),
  ('Escape from Tarkov',   'escape-from-tarkov',  'Shooter / Skin Market', '/games/escape-from-tarkov/logo.webp',  null),

  -- Blockchain
  ('Axie Infinity',        'axie-infinity',       'Blockchain',            '/games/axie-infinity/logo.webp',       '/games/axie-infinity/banner.webp'),
  ('Pixels',               'pixels',              'Blockchain',            '/games/pixels/logo.webp',              null)

on conflict (slug) do update set
  name       = excluded.name,
  category   = excluded.category,
  logo_url   = excluded.logo_url,
  banner_url = excluded.banner_url;

-- ─────────────────────────────────────────────
-- Mock seller profiles
-- ─────────────────────────────────────────────
insert into public.profiles (id, username, avatar_url, kyc_status) values
  ('00000000-0000-0000-0000-000000000001', 'thaiGamer88',    null, 'approved'),
  ('00000000-0000-0000-0000-000000000002', 'myItemSeller',   null, 'approved'),
  ('00000000-0000-0000-0000-000000000003', 'ph_trader_boss', null, 'approved'),
  ('00000000-0000-0000-0000-000000000004', 'sgPro99',        null, 'approved')
on conflict (id) do update set
  username   = excluded.username,
  kyc_status = excluded.kyc_status;

-- ─────────────────────────────────────────────
-- Mock listings
-- ─────────────────────────────────────────────
do $$
declare
  s1 uuid := '00000000-0000-0000-0000-000000000001';
  s2 uuid := '00000000-0000-0000-0000-000000000002';
  s3 uuid := '00000000-0000-0000-0000-000000000003';
  s4 uuid := '00000000-0000-0000-0000-000000000004';
  g record;
begin
  for g in select id, slug from public.games loop
    case g.slug
      when 'osrs' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s1, g.id, '100M OSRS Gold — Fast Delivery',       4.50,   'USDT', '{}', 'active'),
          (s2, g.id, 'Twisted Bow — Trade Ready',           380.00,  'USDT', '{}', 'active'),
          (s3, g.id, 'OSRS Account — Maxed Pure 99 Str',     85.00,  'USDT', '{}', 'active'),
          (s4, g.id, '1B OSRS Gold — Bulk Rate',             40.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      when 'wow' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s2, g.id, '500,000 WoW Gold — US/EU Realm',       12.00,  'USDT', '{}', 'active'),
          (s1, g.id, 'Gladiator Mount Boost — Season 4',     60.00,  'USDT', '{}', 'active'),
          (s3, g.id, 'Mythic+ Carry 15+ Key Weekly',         25.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      when 'cs2' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s3, g.id, 'AK-47 Redline FT — CS2 Skin',          8.50,  'USDT', '{}', 'active'),
          (s4, g.id, 'Karambit Fade Factory New',           420.00,  'USDT', '{}', 'active'),
          (s1, g.id, 'AWP Dragon Lore FT',                 1200.00,  'USDT', '{}', 'active'),
          (s2, g.id, 'M4A4 Howl FT — Contraband',           900.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      when 'dota2' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s2, g.id, 'Genuine Monarch Bow — Drow Ranger',    35.00,  'USDT', '{}', 'active'),
          (s3, g.id, 'Inscribed Blade of the Decimator',     18.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      when 'path-of-exile-2' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s1, g.id, '100 Exalted Orbs PoE2 SC — Fast',     15.00,  'USDT', '{}', 'active'),
          (s4, g.id, 'Rare Endgame Build Full Gear Setup',   55.00,  'USDT', '{}', 'active'),
          (s2, g.id, 'Headhunter Belt SC PoE2',             280.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      when 'rust' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s3, g.id, 'Rust Account — 3,000h+ Never Banned',  22.00,  'USDT', '{}', 'active'),
          (s1, g.id, 'Rust Skin Bundle — Full Metal Set',     9.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      when 'axie-infinity' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s4, g.id, '3 Axies Team — Pure Origin Build',     18.00,  'USDT', '{}', 'active'),
          (s2, g.id, 'AXS 50 Tokens — Staked + Unlocked',   70.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      when 'minecraft' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s1, g.id, 'Minecraft Java Account — Full Access', 14.00,  'USDT', '{}', 'active'),
          (s3, g.id, 'SkyBlock Profile — Godly Gear F7',     30.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      when 'lost-ark' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s2, g.id, '100,000 Lost Ark Gold — EU Central',    8.00,  'USDT', '{}', 'active'),
          (s4, g.id, '1490 Roster Boost — Full Carry',       45.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      when 'pubg' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s1, g.id, 'PUBG Account — Conqueror + Glacier M416', 75.00, 'USDT', '{}', 'active'),
          (s3, g.id, 'UC 3,600 Top-Up — Any Server',            25.00, 'USDT', '{}', 'active')
        on conflict do nothing;
      when 'albion-online' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s2, g.id, '10M Albion Silver — Fast Delivery',     12.00,  'USDT', '{}', 'active'),
          (s4, g.id, 'Tier 8 Artifact Gear Set — Mage',       90.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      when 'black-desert-online' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s3, g.id, 'BDO 10B Silver — PC NA/EU',             35.00,  'USDT', '{}', 'active'),
          (s1, g.id, 'TET Blackstar Mainhand Weapon',        180.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      when 'eve-online' then
        insert into public.listings (seller_id, game_id, title, price_amount, price_currency, images, status) values
          (s4, g.id, '10B ISK — Jita Delivery',               20.00,  'USDT', '{}', 'active'),
          (s2, g.id, 'Titan Pilot Character — 200M SP',      500.00,  'USDT', '{}', 'active')
        on conflict do nothing;
      else null;
    end case;
  end loop;
end $$;
