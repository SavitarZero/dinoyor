-- ═══════════════════════════════════════════════════════════
-- PASTE ทั้งหมดนี้ใน Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1) Clear existing mock data (ไม่ลบ user จริง)
truncate table public.listings  restart identity cascade;
truncate table public.games     restart identity cascade;
delete from public.profiles
  where id in (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004'
  );
delete from auth.users
  where id in (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004'
  );

-- 2) Mock sellers in auth.users (required before profiles)
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
values
  ('00000000-0000-0000-0000-000000000001', 'thaigamer88@mock.test',    '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', 'myitemseller@mock.test',   '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', 'ph_trader_boss@mock.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000004', 'sgpro99@mock.test',        '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- 3) Mock seller profiles
insert into public.profiles (id, username, avatar_url, kyc_status) values
  ('00000000-0000-0000-0000-000000000001', 'thaiGamer88',    null, 'approved'),
  ('00000000-0000-0000-0000-000000000002', 'myItemSeller',   null, 'approved'),
  ('00000000-0000-0000-0000-000000000003', 'ph_trader_boss', null, 'approved'),
  ('00000000-0000-0000-0000-000000000004', 'sgPro99',        null, 'approved')
on conflict (id) do update set
  username   = excluded.username,
  kyc_status = excluded.kyc_status;

-- 4) Games
insert into public.games (name, slug, category, logo_url, banner_url) values
  -- MMORPG
  ('Albion Online',         'albion-online',        'MMORPG',                '/games/albion-online/logo.webp',        '/games/albion-online/banner.webp'),
  ('Old School RuneScape',  'osrs',                 'MMORPG',                '/games/osrs/logo.webp',                 '/games/osrs/banner.webp'),
  ('RuneScape 3',           'runescape-3',          'MMORPG',                '/games/runescape-3/logo.webp',          null),
  ('World of Warcraft',     'wow',                  'MMORPG',                '/games/wow/logo.webp',                  '/games/wow/banner.webp'),
  ('Black Desert Online',   'black-desert-online',  'MMORPG',                '/games/black-desert-online/logo.webp',  '/games/black-desert-online/banner.webp'),
  ('Path of Exile 2',       'path-of-exile-2',      'MMORPG',                '/games/path-of-exile-2/logo.webp',      '/games/path-of-exile-2/banner.webp'),
  ('Path of Exile',         'path-of-exile',        'MMORPG',                '/games/path-of-exile/logo.webp',        null),
  ('Lost Ark',              'lost-ark',             'MMORPG',                '/games/lost-ark/logo.webp',             '/games/lost-ark/banner.webp'),
  ('Ragnarok Online',       'ragnarok-online',      'MMORPG',                '/games/ragnarok-online/logo.webp',      null),
  ('Lineage 2',             'lineage-2',            'MMORPG',                '/games/lineage-2/logo.webp',            null),
  ('Mabinogi',              'mabinogi',             'MMORPG',                '/games/mabinogi/logo.webp',             null),
  ('MapleStory',            'maplestory',           'MMORPG',                '/games/maplestory/logo.webp',           null),
  ('Mir4',                  'mir4',                 'MMORPG',                '/games/mir4/logo.webp',                 null),
  ('EVE Online',            'eve-online',           'MMORPG',                '/games/eve-online/logo.webp',           '/games/eve-online/banner.webp'),
  -- Survival / Sandbox
  ('Rust',                  'rust',                 'Survival / Sandbox',    '/games/rust/logo.webp',                 '/games/rust/banner.webp'),
  ('ARK: Survival Ascended','ark-sa',               'Survival / Sandbox',    '/games/ark-sa/logo.webp',               '/games/ark-sa/banner.webp'),
  ('ARK: Survival Evolved', 'ark-se',               'Survival / Sandbox',    '/games/ark-se/logo.webp',               null),
  ('Minecraft',             'minecraft',            'Survival / Sandbox',    '/games/minecraft/logo.webp',            '/games/minecraft/banner.webp'),
  ('Unturned',              'unturned',             'Survival / Sandbox',    '/games/unturned/logo.webp',             null),
  -- Shooter / Skin Market
  ('Counter-Strike 2',      'cs2',                  'Shooter / Skin Market', '/games/cs2/logo.webp',                  '/games/cs2/banner.webp'),
  ('Dota 2',                'dota2',                'Shooter / Skin Market', '/games/dota2/logo.webp',                '/games/dota2/banner.webp'),
  ('Team Fortress 2',       'tf2',                  'Shooter / Skin Market', '/games/tf2/logo.webp',                  null),
  ('PUBG: Battlegrounds',   'pubg',                 'Shooter / Skin Market', '/games/pubg/logo.webp',                 '/games/pubg/banner.webp'),
  ('Escape from Tarkov',    'escape-from-tarkov',   'Shooter / Skin Market', '/games/escape-from-tarkov/logo.webp',   null),
  -- Blockchain
  ('Axie Infinity',         'axie-infinity',        'Blockchain',            '/games/axie-infinity/logo.webp',        '/games/axie-infinity/banner.webp'),
  ('Pixels',                'pixels',               'Blockchain',            '/games/pixels/logo.webp',               null)
on conflict (slug) do update set
  name       = excluded.name,
  category   = excluded.category,
  logo_url   = excluded.logo_url,
  banner_url = excluded.banner_url;

-- 5) Listings (with descriptions)
do $$
declare
  s1 uuid := '00000000-0000-0000-0000-000000000001';
  s2 uuid := '00000000-0000-0000-0000-000000000002';
  s3 uuid := '00000000-0000-0000-0000-000000000003';
  s4 uuid := '00000000-0000-0000-0000-000000000004';
  g  record;
begin
  for g in select id, slug from public.games loop
    case g.slug

      when 'osrs' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s1, g.id, '100M OSRS Gold — Fast Delivery',
          E'Selling 100M OSRS Gold on any world.\n\n- Delivery within 5–10 minutes after payment confirmed\n- Trading via GE or direct trade\n- Available 24/7\n\nDM me after purchase to arrange meet-up world.',
          4.50, 'USDT', '{}', 'active'),
        (s2, g.id, 'Twisted Bow — Trade Ready',
          E'Genuine Twisted Bow, fully tradeable. Stats are clean, no notable wear.\n\nTrade method: GE or face-to-face on your world.\nDelivery: within 15 minutes of payment.',
          380.00, 'USDT', '{}', 'active'),
        (s3, g.id, 'OSRS Account — Maxed Pure 99 Str',
          E'1-Defence Pure account.\n\nStats:\n- 99 Strength\n- 60 Attack\n- 1 Defence\n- 70 Ranged\n- 44 Prayer\n\nNo bans on record. Email included. Recovery questions changed for you.',
          85.00, 'USDT', '{}', 'active'),
        (s4, g.id, '1B OSRS Gold — Bulk Rate',
          E'1 Billion OSRS Gold at bulk pricing. Great for gold farmers or high-level gear buyers.\n\nDelivery split into batches of 200M per trade if needed. Fast and reliable — 500+ transactions completed.',
          40.00, 'USDT', '{}', 'active');

      when 'wow' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s2, g.id, '500,000 WoW Gold — US/EU Realm',
          E'500k WoW Retail gold available on most US and EU realms.\n\nDelivery via in-game mail or Auction House method.\nSpecify your realm on purchase. Delivery within 1 hour.',
          12.00, 'USDT', '{}', 'active'),
        (s1, g.id, 'Gladiator Mount Boost — Season 4',
          E'Full Gladiator carry for Season 4 PvP.\n\nIncludes:\n- 2400+ rating achievement\n- Gladiator mount\n- Title\n\nDuration: 1–3 weeks depending on queue times. All classes welcome. Account share or self-play available.',
          60.00, 'USDT', '{}', 'active'),
        (s3, g.id, 'Mythic+ Carry 15+ Key Weekly',
          E'Weekly Mythic+ carry service. We clear your +15 key or higher in time for the weekly vault.\n\nWhat you get:\n- 1 timed +15 run\n- 2 extra vault options\n- Possible loot from group\n\nSpec: any. Start time: within 2 hours of purchase.',
          25.00, 'USDT', '{}', 'active'),
        (s4, g.id, 'WoW Classic SoD — 100k Gold',
          E'100,000 Classic Season of Discovery gold. Available on most SoD realms.\n\nDelivery method: face-to-face or neutral AH.\nPlease message your realm and faction after purchase.',
          18.00, 'USDT', '{}', 'active');

      when 'cs2' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s3, g.id, 'AK-47 Redline FT — CS2 Skin',
          E'AK-47 | Redline in Field-Tested condition.\n\nFloat: 0.28 (mid-FT, clean look)\nNo stickers. StatTrak: No.\n\nTrade hold: 0 days (instant).\nSteam trade link required on purchase.',
          8.50, 'USDT', '{}', 'active'),
        (s4, g.id, 'Karambit Fade Factory New',
          E'Karambit | Fade — Factory New.\n\nFade %: 93% (high fade, strong pink/purple)\nFloat: 0.004\nNo stickers.\n\nOne of the most sought-after knife skins. Price firm. Serious buyers only.',
          420.00, 'USDT', '{}', 'active'),
        (s1, g.id, 'AWP Dragon Lore FT',
          E'AWP | Dragon Lore in Field-Tested condition.\n\nFloat: 0.32\nStatTrak: No\nStickers: None (clean)\n\nExtremely rare drop skin. Priced below current market average. Will not go lower.',
          1200.00, 'USDT', '{}', 'active'),
        (s2, g.id, 'M4A4 Howl FT — Contraband',
          E'M4A4 | Howl — Contraband rarity (no longer obtainable from cases).\n\nCondition: Field-Tested\nFloat: 0.31\nStatTrak: No\n\nOwning a Howl is a flex. Price includes rarity premium.',
          900.00, 'USDT', '{}', 'active');

      when 'dota2' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s2, g.id, 'Genuine Monarch Bow — Drow Ranger',
          E'Genuine Monarch Bow courier for Drow Ranger. Genuine tag = obtained from official Dota 2 event.\n\nCondition: unused, never equipped.\nSteam trade link required.',
          35.00, 'USDT', '{}', 'active'),
        (s3, g.id, 'Inscribed Blade of the Decimator',
          E'Inscribed Blade of the Decimator for Dragon Knight.\n\nGems inscribed:\n- Kills: 1,204\n- Towers Destroyed: 88\n\nRare item, no longer in the store. Immediate trade.',
          18.00, 'USDT', '{}', 'active'),
        (s1, g.id, 'Golden Baby Roshan 2024',
          E'Golden Baby Roshan courier — 2024 edition.\n\nAnimated, full effects. Very limited supply.\nPerfect for Roshan fans or collectors.\n\nTrade within 24 hours of purchase.',
          110.00, 'USDT', '{}', 'active'),
        (s4, g.id, 'Arcana — Davion of the Dragon Blood',
          E'Davion of the Dragon Blood Arcana for Dragon Knight.\n\nFull arcana effects: custom animations, voice lines, kill effect, ambient particles.\nAccount-bound: NO (fully tradeable).',
          280.00, 'USDT', '{}', 'active');

      when 'path-of-exile-2' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s1, g.id, '100 Exalted Orbs PoE2 SC — Fast',
          E'100x Exalted Orbs on Path of Exile 2 — Softcore league.\n\nDelivery: in-game trade within 15 minutes.\nHow it works: add my PoE2 account name (provided after purchase), I send trade request.\n\nBulk discounts available — message before buying.',
          15.00, 'USDT', '{}', 'active'),
        (s4, g.id, 'Rare Endgame Build Full Gear Setup',
          E'Complete endgame rare gear setup optimised for Mapping (T16+) and Pinnacle Bosses.\n\nIncludes:\n- 6-link chest with good mods\n- BiS rare helmet with enchant\n- Ring + amulet with res/life\n- Gloves and boots capped\n\nSoftcore only. DPS: ~8M Shaper DPS.',
          55.00, 'USDT', '{}', 'active'),
        (s2, g.id, 'Headhunter Belt SC PoE2',
          E'Headhunter unique belt — the most powerful and iconic item in PoE2.\n\nCondition: Standard rolls. 1 white socket available.\nLeague: Softcore\n\nThis item will supercharge your mapping experience. Price is fair for current league.',
          280.00, 'USDT', '{}', 'active'),
        (s3, g.id, '500 Divine Orbs — Standard SC',
          E'500x Divine Orbs on PoE2 Standard Softcore.\n\nDelivery via in-game trade in multiple sessions if needed (max 100/trade for safety).\nReliable seller — 200+ trades on PoE community.',
          75.00, 'USDT', '{}', 'active');

      when 'rust' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s3, g.id, 'Rust Account — 3,000h+ Never Banned',
          E'Clean Rust account with 3,000+ hours.\n\nHighlights:\n- Zero VAC or game bans\n- Private profile option available\n- Linked to original email (transfer included)\n- DLC skins worth ~$40 included\n\nFull account access transferred after payment.',
          22.00, 'USDT', '{}', 'active'),
        (s1, g.id, 'Rust Skin Bundle — Full Metal Set',
          E'Full metal tier skin bundle for Rust. Includes:\n\n- Metal Facemask skin\n- Metal Chest Plate skin\n- Metal Kilt skin\n- Metal Boots skin\n\nAll skins are marketable and tradeable. Delivered via Steam trade.',
          9.00, 'USDT', '{}', 'active'),
        (s2, g.id, 'Desert Military Chest Plate',
          E'Desert Military Chest Plate skin — rare drop from Rust item store rotation.\n\nCondition: unused\nMarketable: Yes\nTrade hold: 0 days',
          6.50, 'USDT', '{}', 'active'),
        (s4, g.id, 'Tempered AK Skin — Factory New',
          E'Tempered AK-47 skin for Rust. One of the most popular AK skins.\n\nNever used. No trade hold. Looks incredible in first-person.',
          14.00, 'USDT', '{}', 'active');

      when 'axie-infinity' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s4, g.id, '3 Axies Team — Pure Origin Build',
          E'Meta-viable 3-Axie team for Origin ranked play.\n\nTeam composition: Plant / Beast / Bird (standard PBB)\nAll cards unlocked. No breeding remaining needed.\n\nWin rate with this team: ~62% in Platinum bracket.',
          18.00, 'USDT', '{}', 'active'),
        (s2, g.id, 'AXS 50 Tokens — Staked + Unlocked',
          E'50 AXS tokens, fully unstaked and ready to transfer.\n\nWallet: Ronin\nNetwork: Ronin Chain\n\nTransfer within 30 minutes after USDT received. Please share your Ronin wallet address after purchase.',
          70.00, 'USDT', '{}', 'active'),
        (s1, g.id, 'Mystic Axie — Forager Build',
          E'Rare Mystic-class Axie with Forager build parts.\n\nMystic parts: 2x (Furball + Risky Fish)\nBreeds remaining: 3\nClass: Aquatic\n\nMystic Axies are discontinued — no new ones can be created.',
          45.00, 'USDT', '{}', 'active'),
        (s3, g.id, 'Origin Axie Pack — Starter Ready',
          E'3-Axie starter pack ready for Origin Season play.\n\nAll Axies have good base cards for PvE and beginning PvP.\nBreeds: 4–5 remaining each.\n\nPerfect for new players who want to skip the grind.',
          12.00, 'USDT', '{}', 'active');

      when 'minecraft' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s1, g.id, 'Minecraft Java Account — Full Access',
          E'Legitimate Minecraft Java Edition account.\n\nIncludes:\n- Full email access\n- Microsoft account transfer\n- Cape: Migrator cape included\n- No bans, clean account\n\nAfter purchase, I transfer the Microsoft account to your email.',
          14.00, 'USDT', '{}', 'active'),
        (s3, g.id, 'SkyBlock Profile — Godly Gear F7',
          E'Hypixel SkyBlock profile ready for Floor 7 runs.\n\nGear includes:\n- Necron Armor (full set)\n- Hyperion Sword (upgraded)\n- 60M+ coins in bank\n- Collections: Farming/Mining/Combat maxed\n\nProfile transfer via account sale.',
          30.00, 'USDT', '{}', 'active'),
        (s2, g.id, 'Hypixel MVP+ Rank Account',
          E'Minecraft account with Hypixel MVP+ rank active (never expires).\n\nStats:\n- BedWars: 800+ wins\n- Skywars: 400+ wins\n- Clean chat history\n\nFull account access included.',
          22.00, 'USDT', '{}', 'active'),
        (s4, g.id, 'Bedrock + Java Bundle',
          E'Microsoft account with both Minecraft Java AND Bedrock editions.\n\nBoth versions fully purchased and accessible.\nCross-play ready.\n\nAccount is migrated to Microsoft. Full email transfer included.',
          18.00, 'USDT', '{}', 'active');

      when 'lost-ark' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s2, g.id, '100,000 Lost Ark Gold — EU Central',
          E'100,000 Lost Ark gold on EU Central server.\n\nDelivery method: Auction House (you post a junk item, I buy it).\nDelivery time: within 30 minutes.\n\nPlease specify your character name and server after purchase.',
          8.00, 'USDT', '{}', 'active'),
        (s4, g.id, '1490 Roster Boost — Full Carry',
          E'Full roster boost to 1490 item level.\n\nService includes:\n- Main character boosted to 1490\n- Honing materials included\n- Chaos dungeon + Guardian raid clears\n\nDuration: 5–7 days. Account share required.',
          45.00, 'USDT', '{}', 'active'),
        (s1, g.id, 'Brelshaza Gate 1-4 Weekly Carry',
          E'Weekly Brelshaza (Normal) Gate 1–4 carry for your character.\n\nRequirements: 1490+ item level\nGroup: pre-made premade, experienced\nLoot: all yours\n\nSchedule: Wednesdays and weekends. Reserve your slot after purchase.',
          35.00, 'USDT', '{}', 'active'),
        (s3, g.id, '500k Gold — KR Server',
          E'500,000 gold on Lost Ark KR server.\n\nNote: KR server gold — not EUW or NAE.\nDelivery: Auction House method within 1 hour.\n\nBulk orders welcome, contact for pricing.',
          38.00, 'USDT', '{}', 'active');

      when 'pubg' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s1, g.id, 'PUBG Account — Conqueror + Glacier M416',
          E'PUBG Mobile account at Conqueror tier with Glacier M416 skin.\n\nHighlights:\n- Conqueror frame (Season 26)\n- Glacier M416 (fully upgraded Level 7)\n- 15,000+ UC spent history\n- Clean account, no bans\n\nFull Google/Apple account transfer.',
          75.00, 'USDT', '{}', 'active'),
        (s3, g.id, 'UC 3,600 Top-Up — Any Server',
          E'3,600 UC top-up for PUBG Mobile. Works on any server (Global, KR, VNG).\n\nDelivery: directly to your PUBG Mobile account via player ID.\nTime: within 30 minutes.\n\nProvide your Player ID after purchase.',
          25.00, 'USDT', '{}', 'active'),
        (s2, g.id, 'Season 27 Conqueror Account',
          E'Fresh Season 27 Conqueror account. Reached Conqueror in Solo TPP.\n\nContents:\n- Conqueror title + frame\n- 4,200 UC remaining\n- Several permanent outfits\n\nTransfer via Google account.',
          50.00, 'USDT', '{}', 'active'),
        (s4, g.id, 'PUBG Vikendi Set + Kar98 Skin',
          E'Vikendi outfit set (top, bottom, shoes, mask) + Kar98k Vikendi skin.\n\nAll permanent cosmetics. Transferred via in-game gifting system (requires both accounts to be friends for 3 days).\n\nContact me to start the friend request process.',
          15.00, 'USDT', '{}', 'active');

      when 'albion-online' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s2, g.id, '10M Albion Silver — Fast Delivery',
          E'10,000,000 Albion Online Silver. Available on East and West servers.\n\nDelivery: face-to-face trade at your city bank.\nTime: within 20 minutes.\n\nSpecify your server and city after purchase.',
          12.00, 'USDT', '{}', 'active'),
        (s4, g.id, 'Tier 8 Artifact Gear Set — Mage',
          E'Complete Tier 8 Artifact mage gear set.\n\nIncludes:\n- T8 Artifact Tome of Spells\n- T8 Artifact Scholar Cowl\n- T8 Artifact Scholar Robe\n- T8 Artifact Scholar Sandals\n\nAll fully enchanted .3. Ready for endgame content.',
          90.00, 'USDT', '{}', 'active'),
        (s1, g.id, '50M Silver — West/East Server',
          E'50M Albion Silver, available on both West and East servers.\n\nBulk order — split delivery in batches of 10M per trade for safety.\nDelivery: within 1 hour of payment confirmation.',
          55.00, 'USDT', '{}', 'active'),
        (s3, g.id, 'T8 Avalonian Gear Set — Full',
          E'Full T8 Avalonian gear set for group PvP or ZvZ.\n\nIncludes:\n- Avalonian Cape\n- Avalonian Sword\n- Avalonian Plate armor\n\nAvalonian gear has unique passive bonuses not found on regular T8 gear.',
          120.00, 'USDT', '{}', 'active');

      when 'black-desert-online' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s3, g.id, 'BDO 10B Silver — PC NA/EU',
          E'10 Billion BDO Silver on PC NA or EU server.\n\nDelivery method: Marketplace (I list a cheap item, you buy it).\nTime: within 1 hour.\n\nNote: marketplace tax applies (~35%), price already accounts for this.',
          35.00, 'USDT', '{}', 'active'),
        (s1, g.id, 'TET Blackstar Mainhand Weapon',
          E'TET (+19) Blackstar Mainhand Weapon. Class: Warrior (Longsword).\n\nAP: 241\nAwakening AP: 229\nEnhancement: TET\n\nBlackstar weapons are the strongest PvE mainhand in the game. Transfer via Central Market.',
          180.00, 'USDT', '{}', 'active'),
        (s2, g.id, 'PEN Deboreka Necklace',
          E'PEN (V) Deboreka Necklace — the top-tier accessory in BDO.\n\nStats at PEN:\n+16 AP / +16 DP / +5 All AP\n\nExtremely hard to enhance. This item alone can push you into top-tier PvP bracket.',
          350.00, 'USDT', '{}', 'active'),
        (s4, g.id, '50B Silver — SEA Server',
          E'50 Billion silver on BDO SEA server.\n\nDelivery: via Central Market listing method.\nTime: within 2 hours (dependent on market activity).\n\nContact me first with your server and class if you have questions.',
          160.00, 'USDT', '{}', 'active');

      when 'eve-online' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s4, g.id, '10B ISK — Jita Delivery',
          E'10 Billion EVE Online ISK delivered in Jita 4-4.\n\nDelivery: contract in Jita within 30 minutes.\nSafe and tested method — 300+ ISK trades completed.\n\nBulk rates available for 50B+.',
          20.00, 'USDT', '{}', 'active'),
        (s2, g.id, 'Titan Pilot Character — 200M SP',
          E'EVE Online character with 200M skill points focused on Titan piloting.\n\nSkills:\n- Amarr Titan V\n- Doomsday Operation V\n- All support skills maxed\n\nCharacter transfer via CCP official transfer. Allow 10 hours for process.',
          500.00, 'USDT', '{}', 'active'),
        (s1, g.id, '100B ISK Bulk',
          E'100B EVE ISK bulk order.\n\nBest rate available — price per billion decreases at this volume.\nDelivery location: Jita, Amarr, or Dodixie.\nTime: within 2 hours.',
          180.00, 'USDT', '{}', 'active'),
        (s3, g.id, 'Capital Ship Blueprint — Naglfar',
          E'Naglfar Dreadnought Blueprint Original (BPO).\n\nMaterial Efficiency: 10/20 (fully researched)\nCopies remaining: original (unlimited runs)\n\nDelivered via contract in Jita. Naglfar is one of the most used Dreads in null-sec.',
          65.00, 'USDT', '{}', 'active');

      when 'ark-sa' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s1, g.id, 'ARK SA Starter Kit — PvE Official',
          E'Complete ARK: Survival Ascended starter kit for PvE Official servers.\n\nIncludes:\n- Basic metal tools set\n- Tamed Argentavis (level 180)\n- 5,000 ingots, 2,000 polymer\n- Starter base blueprint\n\nDelivery: drop in-game at agreed coordinates.',
          15.00, 'USDT', '{}', 'active'),
        (s3, g.id, 'Tek Tier Full Set + Meks',
          E'Full Tek Tier gear set plus 2x Meks for ARK SA.\n\nIncludes:\n- Tek Armor (helmet, chest, pants, gloves, boots) — all 100+ armor\n- Tek Rifle + Tek Sword\n- 2x Meks with Shield Module\n\nServer: PvE Official. Drop delivery.',
          40.00, 'USDT', '{}', 'active');

      when 'pixels' then insert into public.listings (seller_id, game_id, title, description, price_amount, price_currency, images, status) values
        (s2, g.id, 'Pixels Farm Land — Plot #4812',
          E'Pixels.xyz Farm Land NFT — Plot #4812.\n\nLocation: near town center (high foot traffic)\nSize: standard 16x16 plot\nCurrent crops: Wheat level 3 planted\n\nTransfer via Ronin wallet. Include your Ronin address after purchase.',
          28.00, 'USDT', '{}', 'active'),
        (s4, g.id, '10,000 PIXEL Tokens',
          E'10,000 PIXEL tokens (Pixels game currency).\n\nNetwork: Ronin Chain\nTransfer: direct wallet-to-wallet\nTime: within 30 minutes after payment confirmed.\n\nProvide your Ronin wallet address after purchase.',
          18.00, 'USDT', '{}', 'active');

      else null;
    end case;
  end loop;
end $$;

-- 6) Mock sold_count
update public.listings set sold_count = case title
  when '100M OSRS Gold — Fast Delivery'            then 312
  when '1B OSRS Gold — Bulk Rate'                  then 87
  when 'Twisted Bow — Trade Ready'                 then 14
  when 'OSRS Account — Maxed Pure 99 Str'          then 9
  when '500,000 WoW Gold — US/EU Realm'            then 204
  when 'Mythic+ Carry 15+ Key Weekly'              then 156
  when 'WoW Classic SoD — 100k Gold'               then 91
  when 'Gladiator Mount Boost — Season 4'          then 33
  when 'AK-47 Redline FT — CS2 Skin'              then 428
  when 'Karambit Fade Factory New'                 then 7
  when 'AWP Dragon Lore FT'                        then 3
  when 'M4A4 Howl FT — Contraband'                then 5
  when '100 Exalted Orbs PoE2 SC — Fast'          then 189
  when '500 Divine Orbs — Standard SC'             then 76
  when 'Rare Endgame Build Full Gear Setup'        then 42
  when 'Headhunter Belt SC PoE2'                   then 11
  when '10M Albion Silver — Fast Delivery'         then 267
  when '50M Silver — West/East Server'             then 98
  when '100,000 Lost Ark Gold — EU Central'        then 143
  when 'UC 3,600 Top-Up — Any Server'              then 334
  when '10B ISK — Jita Delivery'                   then 58
  when 'Minecraft Java Account — Full Access'      then 201
  when '3 Axies Team — Pure Origin Build'          then 37
  when 'Pixels Farm Land — Plot #4812'             then 4
  else floor(random() * 30)::int
end;

-- ✅ Done! Run SELECT count(*) FROM public.listings; to verify
