-- Local Connect: believable Bangalore demo data.
-- Run AFTER schema.sql, seed.sql and update-v2.sql in the Supabase SQL Editor.
--
-- Safe to run more than once: only the fixed demo rows below are deleted and
-- re-inserted, so real sign-ups and real data are left alone.
--
-- 1) Replace the two email placeholders in the config block below with your
--    demo shop account and demo customer account. They are used once.
--    DEMO_SHOP_EMAIL     -> owns the bakery, the plumber and the taxi shop
--    DEMO_CUSTOMER_EMAIL -> owns the 4 demo orders, 3 needs and 1 review
-- 2) Run the whole file. If an account does not exist yet, its part is skipped
--    quietly. Create the accounts in the app, then run this file again.
--
-- image_url stays null on purpose: the app draws hand-drawn doodles instead.
-- I will add real photos later for 3-4 hero shops only.

-- ---------------------------------------------------------------------------
-- Demo account emails (edit these two lines once)
-- ---------------------------------------------------------------------------
drop table if exists _lc_demo_config;
create temporary table _lc_demo_config (
  demo_shop_email text not null,
  demo_customer_email text not null
);
insert into _lc_demo_config (demo_shop_email, demo_customer_email) values
  ('lankanajma@gmail.com',      -- DEMO_SHOP_EMAIL
   'moonstars2202@gmail.com'); -- DEMO_CUSTOMER_EMAIL

-- Keep the verified flag when this file runs in the SQL Editor (no auth.uid()).
-- This is the same function as schema.sql, repeated here so demo data also
-- works on a project that ran an older version of schema.sql.
create or replace function protect_verified() returns trigger as $$
declare is_admin boolean;
begin
  if auth.uid() is null then return new; end if;
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin') into is_admin;
  if not is_admin then
    if tg_op = 'INSERT' then new.verified := false;
    else new.verified := old.verified; end if;
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- Remove previous demo rows only (old Delhi seed + this Bangalore demo)
-- ---------------------------------------------------------------------------
delete from needs where id in (
  'b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002',
  'b2000000-0000-4000-8000-000000000003'
);

delete from shops where id in (
  -- old Delhi-style seed rows
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000009',
  -- this Bangalore demo (products, orders, reviews and replies cascade)
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002',
  'b1000000-0000-4000-8000-000000000003',
  'b1000000-0000-4000-8000-000000000004',
  'b1000000-0000-4000-8000-000000000005',
  'b1000000-0000-4000-8000-000000000006',
  'b1000000-0000-4000-8000-000000000007',
  'b1000000-0000-4000-8000-000000000008',
  'b1000000-0000-4000-8000-000000000009',
  'b1000000-0000-4000-8000-000000000010',
  'b1000000-0000-4000-8000-000000000011',
  'b1000000-0000-4000-8000-000000000012',
  'b1000000-0000-4000-8000-000000000013',
  'b1000000-0000-4000-8000-000000000014',
  'b1000000-0000-4000-8000-000000000015',
  'b1000000-0000-4000-8000-000000000016',
  'b1000000-0000-4000-8000-000000000017',
  'b1000000-0000-4000-8000-000000000018'
);

-- ---------------------------------------------------------------------------
-- 18 shops, 2 per category, scattered within ~600 m of six Bangalore areas
-- ---------------------------------------------------------------------------
insert into shops (id, name, category, description, address, phone, whatsapp, verified, lat, lng, image_url) values
  ('b1000000-0000-4000-8000-000000000001','Nandini''s Cake Studio','bakery','Small-batch home bakery in Indiranagar. Chocolate, red velvet and custom photo cakes, baked to order.','12th Main, Indiranagar, Bengaluru 560038','90000 00001','919000000001',true,12.9801,77.6422,null),
  ('b1000000-0000-4000-8000-000000000002','Byadgi Baking Co.','bakery','Neighbourhood bakery in Jayanagar known for butter croissants, banana bread and simple fondant cakes.','4th Block, Jayanagar, Bengaluru 560011','90000 00002','919000000002',true,12.9271,77.5962,null),
  ('b1000000-0000-4000-8000-000000000003','Paper Moon Studio','crafts','Handmade gifts and resin art from a two-person studio in Koramangala. Custom names and hampers.','5th Block, Koramangala, Bengaluru 560095','90000 00003','919000000003',true,12.9370,77.6268,null),
  ('b1000000-0000-4000-8000-000000000004','Chalk and Charcoal','crafts','Illustrated prints, macrame and gift hampers made by a Malleshwaram illustrator.','8th Cross, Malleshwaram, Bengaluru 560003','90000 00004','919000000004',false,13.0052,77.5669,null),
  ('b1000000-0000-4000-8000-000000000005','Wrap and Wonder Crochet','crochet','Handmade crochet bags, flowers and soft toys. Made at home in HSR Layout, custom colours welcome.','Sector 2, HSR Layout, Bengaluru 560102','90000 00005','919000000005',true,12.9130,77.6412,null),
  ('b1000000-0000-4000-8000-000000000006','Loop by Loop','crochet','Small crochet studio on 100 Feet Road. Bookmarks, cushion covers and little charms.','100 Feet Road, Indiranagar, Bengaluru 560038','90000 00006','919000000006',false,12.9765,77.6381,null),
  ('b1000000-0000-4000-8000-000000000007','Metro Kirana Corner','store','Daily groceries, fresh coriander and a monthly basket for families around Jayanagar.','11th Main, Jayanagar, Bengaluru 560041','90000 00007','919000000007',true,12.9228,77.5912,null),
  ('b1000000-0000-4000-8000-000000000008','Green Leaf Daily Store','store','Milk, bread, eggs and a weekend basket. A short walk from ITPL Main Road.','ITPL Main Road, Whitefield, Bengaluru 560066','90000 00008','919000000008',true,12.9720,77.7532,null),
  ('b1000000-0000-4000-8000-000000000009','Nandi Plumbing Works','plumbing','Two plumbers covering HSR and Koramangala. Leaks, taps, blocked sinks and geyser fitting.','27th Main, HSR Layout, Bengaluru 560102','90000 00009','919000000009',true,12.9098,77.6361,null),
  ('b1000000-0000-4000-8000-000000000010','FlowFix Plumbing','plumbing','Same-day plumbing visits for leaking pipes, flush repairs and overhead tank cleaning.','80 Feet Road, Koramangala, Bengaluru 560095','90000 00010','919000000010',false,12.9331,77.6220,null),
  ('b1000000-0000-4000-8000-000000000011','Volt and Wire Electricals','electrical','Fan fitting, switchboard repairs and inverter checks by a licensed electrician in Indiranagar.','CMH Road, Indiranagar, Bengaluru 560038','90000 00011','919000000011',true,12.9812,77.6395,null),
  ('b1000000-0000-4000-8000-000000000012','Bright Spark Electricals','electrical','Doorbells, MCBs and home wiring audits. Small jobs welcome in Malleshwaram.','Sampige Road, Malleshwaram, Bengaluru 560003','90000 00012','919000000012',false,13.0011,77.5624,null),
  ('b1000000-0000-4000-8000-000000000013','Garage 560','auto','Bike and car servicing, punctures and AC gas top-ups near Varthur Road.','Varthur Road, Whitefield, Bengaluru 560066','90000 00013','919000000013',true,12.9670,77.7468,null),
  ('b1000000-0000-4000-8000-000000000014','Two-Wheel Tune-Up','auto','A small two-wheeler workshop in Jayanagar. Oil changes, brake pads and chain cleaning.','30th Cross, Jayanagar, Bengaluru 560041','90000 00014','919000000014',false,12.9260,77.5905,null),
  ('b1000000-0000-4000-8000-000000000015','Namma Ride Cabs','taxi','Airport drops, local cabs and full-day bookings. Based in Koramangala, drivers who know the shortcuts.','7th Block, Koramangala, Bengaluru 560095','90000 00015','919000000015',true,12.9362,77.6213,null),
  ('b1000000-0000-4000-8000-000000000016','City Auto and Cab','taxi','Auto rides around Indiranagar plus airport pickups and Mysuru outstation drops.','Domlur Road, Indiranagar, Bengaluru 560071','90000 00016','919000000016',true,12.9754,77.6439,null),
  ('b1000000-0000-4000-8000-000000000017','Campus Notes Tutoring','student','College students offering maths, physics and spoken English tuition near Malleshwaram.','15th Cross, Malleshwaram, Bengaluru 560003','90000 00017','919000000017',true,13.0046,77.5619,null),
  ('b1000000-0000-4000-8000-000000000018','Student Errand Help','student','Typing, project help and small errands within 5 km of HSR Layout.','24th Main, HSR Layout, Bengaluru 560102','90000 00018','919000000018',false,12.9128,77.6357,null);

-- ---------------------------------------------------------------------------
-- 3 to 5 items per shop with Bangalore prices
-- ---------------------------------------------------------------------------
insert into products (shop_id, name, description, price) values
  ('b1000000-0000-4000-8000-000000000001','Belgian chocolate cake (1 kg)','Rich dark chocolate, baked fresh to order.',950),
  ('b1000000-0000-4000-8000-000000000001','Red velvet cake (1 kg)','Cream cheese frosting with a light cocoa sponge.',1050),
  ('b1000000-0000-4000-8000-000000000001','Vanilla cupcakes (box of 6)','Soft vanilla sponge with buttercream swirls.',420),
  ('b1000000-0000-4000-8000-000000000001','Fresh cream plum cake (500 g)','A Christmas favourite, packed with dry fruit.',650),
  ('b1000000-0000-4000-8000-000000000001','Custom photo cake (1 kg)','Send a photo on WhatsApp and we print it on edible paper.',1100),

  ('b1000000-0000-4000-8000-000000000002','Butter croissants (pack of 4)','Flaky all-butter croissants baked every morning.',240),
  ('b1000000-0000-4000-8000-000000000002','Whole wheat banana bread','Less sugar, made with ripe local bananas.',380),
  ('b1000000-0000-4000-8000-000000000002','Fondant birthday cake (1 kg)','Simple fondant finish, name and age included.',900),
  ('b1000000-0000-4000-8000-000000000002','Masala bun (pack of 6)','Soft buns with onion, coriander and green chilli.',180),

  ('b1000000-0000-4000-8000-000000000003','Resin name keychain','Custom name in resin, ready in two days.',249),
  ('b1000000-0000-4000-8000-000000000003','Personalised photo frame (A4)','Wooden frame with a printed photo collage.',599),
  ('b1000000-0000-4000-8000-000000000003','Wedding gift hamper','Handmade candles, chocolates and a card.',1299),
  ('b1000000-0000-4000-8000-000000000003','Hand-painted terracotta diya set (12)','Festive diyas painted by hand.',450),

  ('b1000000-0000-4000-8000-000000000004','Anniversary gift hamper','Curated hamper with a handwritten note.',899),
  ('b1000000-0000-4000-8000-000000000004','Tarot card wall print (A3)','Printed on thick matte paper.',349),
  ('b1000000-0000-4000-8000-000000000004','Macrame wall hanging','Cotton macrame, about 60 cm wide.',749),

  ('b1000000-0000-4000-8000-000000000005','Crochet tote bag','Handmade cotton tote in five colour options.',850),
  ('b1000000-0000-4000-8000-000000000005','Amigurumi elephant','Soft crochet toy, about 18 cm tall.',650),
  ('b1000000-0000-4000-8000-000000000005','Crochet flower bouquet','Mixed flowers that never wilt.',750),
  ('b1000000-0000-4000-8000-000000000005','Baby booties (0-6 months)','Soft cotton yarn, machine washable.',400),

  ('b1000000-0000-4000-8000-000000000006','Crochet bookmarks (set of 3)','Lightweight yarn bookmarks in pastel shades.',250),
  ('b1000000-0000-4000-8000-000000000006','Granny square cushion cover','16-inch cover with a hidden zip.',700),
  ('b1000000-0000-4000-8000-000000000006','Keychain charm','Small crochet charm, choose your colour.',180),

  ('b1000000-0000-4000-8000-000000000007','Sona masoori rice (5 kg)','Everyday rice, freshly stocked.',340),
  ('b1000000-0000-4000-8000-000000000007','Toor dal (1 kg)','Cleaned and packed this week.',175),
  ('b1000000-0000-4000-8000-000000000007','Sunflower oil (1 L)','Refined sunflower oil.',145),
  ('b1000000-0000-4000-8000-000000000007','Fresh coriander and curry leaf pack','Cut fresh every morning.',25),
  ('b1000000-0000-4000-8000-000000000007','Monthly grocery basket','Rice, dal, oil, atta, sugar and six more essentials.',1250),

  ('b1000000-0000-4000-8000-000000000008','Fresh toned milk (500 ml)','Fresh milk, delivered daily.',28),
  ('b1000000-0000-4000-8000-000000000008','Brown bread loaf','Baked locally, no maida.',55),
  ('b1000000-0000-4000-8000-000000000008','Eggs (pack of 6)','Farm eggs, checked for cracks.',48),
  ('b1000000-0000-4000-8000-000000000008','Idli-dosa batter (1 kg)','Fresh batter, ready to cook.',65),
  ('b1000000-0000-4000-8000-000000000008','Weekend grocery basket','Bread, eggs, milk, fruit and snacks.',899),

  ('b1000000-0000-4000-8000-000000000009','Tap repair visit','Leaking or dripping tap, parts extra.',299),
  ('b1000000-0000-4000-8000-000000000009','Bathroom tap replacement','Includes fitting, tap not included.',450),
  ('b1000000-0000-4000-8000-000000000009','Kitchen sink pipe unclogging','Same-day visit across HSR and Koramangala.',399),
  ('b1000000-0000-4000-8000-000000000009','Geyser installation','Wall-mounted geyser fitting.',650),

  ('b1000000-0000-4000-8000-000000000010','Leaking pipe repair','Concealed or exposed pipe leak.',350),
  ('b1000000-0000-4000-8000-000000000010','Toilet flush repair','Repair or replace the flush mechanism.',400),
  ('b1000000-0000-4000-8000-000000000010','Water tank cleaning','Overhead tank scrub and wash.',1200),

  ('b1000000-0000-4000-8000-000000000011','Ceiling fan installation','Per fan, including regulator fitting.',299),
  ('b1000000-0000-4000-8000-000000000011','Switchboard repair','Loose wires, sparks or a dead socket.',249),
  ('b1000000-0000-4000-8000-000000000011','Inverter wiring checkup','Battery, wiring and backup test.',699),
  ('b1000000-0000-4000-8000-000000000011','LED light fitting (per point)','Downlight or batten fitting.',180),

  ('b1000000-0000-4000-8000-000000000012','Doorbell installation','Wired or wireless doorbell.',250),
  ('b1000000-0000-4000-8000-000000000012','MCB replacement','Single or double pole MCB.',350),
  ('b1000000-0000-4000-8000-000000000012','Home safety wiring audit','Room-by-room wiring and earthing check.',799),

  ('b1000000-0000-4000-8000-000000000013','Bike general service','Engine oil, chain, brakes and wash.',650),
  ('b1000000-0000-4000-8000-000000000013','Car wash and interior cleaning','Exterior wash plus vacuum.',499),
  ('b1000000-0000-4000-8000-000000000013','Puncture repair (two-wheeler)','Tubeless or tube, while you wait.',100),
  ('b1000000-0000-4000-8000-000000000013','Car AC gas top-up','Includes leak check.',1800),

  ('b1000000-0000-4000-8000-000000000014','Two-wheeler oil change','Engine oil and filter, labour included.',450),
  ('b1000000-0000-4000-8000-000000000014','Brake pad replacement (bike)','Front or rear set.',550),
  ('b1000000-0000-4000-8000-000000000014','Chain cleaning and lube','Degrease, clean and lubricate.',180),

  ('b1000000-0000-4000-8000-000000000015','Airport drop (Indiranagar to KIA)','Sedan, up to 4 passengers and 2 bags.',950),
  ('b1000000-0000-4000-8000-000000000015','Local auto ride within 5 km','Metered auto, city limits.',120),
  ('b1000000-0000-4000-8000-000000000015','Local cab within 10 km','AC sedan, up to 4 passengers.',300),
  ('b1000000-0000-4000-8000-000000000015','Full-day cab (8 hours, 80 km)','Driver and fuel included.',2200),

  ('b1000000-0000-4000-8000-000000000016','Auto ride within 3 km','Quick auto hop around Indiranagar.',90),
  ('b1000000-0000-4000-8000-000000000016','Airport pickup (KIA to Koramangala)','Meet and greet at arrivals.',1000),
  ('b1000000-0000-4000-8000-000000000016','Night drop within Bengaluru','Between 10 pm and 5 am.',450),
  ('b1000000-0000-4000-8000-000000000016','Outstation to Mysuru (one way)','Sedan, up to 4 passengers.',3500),

  ('b1000000-0000-4000-8000-000000000017','Maths tuition (Class 8-10, 1 hour)','One-to-one at home or online.',350),
  ('b1000000-0000-4000-8000-000000000017','Physics tuition (Class 11-12, 1 hour)','Board and competitive exam basics.',400),
  ('b1000000-0000-4000-8000-000000000017','Spoken English practice (1 hour)','Conversation practice with a student tutor.',300),
  ('b1000000-0000-4000-8000-000000000017','Exam revision notes (per subject)','Handwritten summary and question bank.',250),

  ('b1000000-0000-4000-8000-000000000018','Assignment typing (per page)','Clean formatting, same day.',40),
  ('b1000000-0000-4000-8000-000000000018','College project help (per hour)','Research, slides and formatting.',300),
  ('b1000000-0000-4000-8000-000000000018','Errand runner within 5 km','Pickup or drop around HSR.',100),
  ('b1000000-0000-4000-8000-000000000018','Kannada translation (per page)','English to Kannada or back.',80);

-- ---------------------------------------------------------------------------
-- Ownership, demo orders, review and needs (only when the accounts exist)
-- ---------------------------------------------------------------------------
do $$
declare
  v_shop_email text;
  v_customer_email text;
  v_shop_uid uuid;
  v_customer_uid uuid;

  v_bakery  uuid := 'b1000000-0000-4000-8000-000000000001';
  v_plumber uuid := 'b1000000-0000-4000-8000-000000000009';
  v_taxi    uuid := 'b1000000-0000-4000-8000-000000000015';

  v_need_plumbing uuid := 'b2000000-0000-4000-8000-000000000001';
  v_need_bakery   uuid := 'b2000000-0000-4000-8000-000000000002';
  v_need_taxi     uuid := 'b2000000-0000-4000-8000-000000000003';

  v_order_new       uuid := 'b3000000-0000-4000-8000-000000000001';
  v_order_accepted  uuid := 'b3000000-0000-4000-8000-000000000002';
  v_order_ready     uuid := 'b3000000-0000-4000-8000-000000000003';
  v_order_completed uuid := 'b3000000-0000-4000-8000-000000000004';
begin
  select demo_shop_email, demo_customer_email
    into v_shop_email, v_customer_email
    from _lc_demo_config limit 1;

  select id into v_shop_uid from auth.users where lower(email) = lower(v_shop_email) limit 1;
  select id into v_customer_uid from auth.users where lower(email) = lower(v_customer_email) limit 1;

  -- Make the shop account a seller, then give it 3 shops.
  if v_shop_uid is not null then
    insert into profiles (id, full_name, role)
    values (v_shop_uid, 'Demo Shop', 'shop')
    on conflict (id) do update set role = 'shop';

    update shops
       set owner_id = v_shop_uid
     where id in (v_bakery, v_plumber, v_taxi);
  end if;

  -- Orders, review and needs need the customer account.
  if v_customer_uid is not null then
    insert into orders (id, shop_id, customer_id, customer_name, customer_phone, note, total, status, created_at) values
      (v_order_new,       v_bakery, v_customer_uid, 'Aarav Rao', '90000 00020', 'Please add a chocolate happy birthday topper if possible.', 1370, 'new',       now() - interval '25 minutes'),
      (v_order_accepted,  v_bakery, v_customer_uid, 'Aarav Rao', '90000 00020', 'Eggless red velvet, pickup at 6 pm.',                       1050, 'accepted',  now() - interval '3 hours'),
      (v_order_ready,     v_bakery, v_customer_uid, 'Aarav Rao', '90000 00020', 'Plum cake, please pack it well.',                            1070, 'ready',     now() - interval '1 day'),
      (v_order_completed, v_bakery, v_customer_uid, 'Aarav Rao', '90000 00020', 'Photo cake with our dog on top.',                            1100, 'completed', now() - interval '2 days');

    insert into order_items (order_id, product_id, name, price, qty) values
      (v_order_new,       null, 'Belgian chocolate cake (1 kg)', 950, 1),
      (v_order_new,       null, 'Vanilla cupcakes (box of 6)',   420, 1),
      (v_order_accepted,  null, 'Red velvet cake (1 kg)',        1050, 1),
      (v_order_ready,     null, 'Fresh cream plum cake (500 g)', 650, 1),
      (v_order_ready,     null, 'Vanilla cupcakes (box of 6)',   420, 1),
      (v_order_completed, null, 'Custom photo cake (1 kg)',      1100, 1);

    insert into reviews (order_id, shop_id, customer_id, rating, comment, created_at) values
      (v_order_completed, v_bakery, v_customer_uid, 5, 'The photo cake came out exactly like the reference. Everyone at the party loved it.', now() - interval '1 day');

    insert into needs (id, customer_id, category, description, budget, when_text, status, created_at) values
      (v_need_plumbing, v_customer_uid, 'plumbing', 'The kitchen tap under the sink is leaking badly. Need someone to fix it this evening.', 350, 'Today', 'open', now() - interval '2 hours'),
      (v_need_bakery,   v_customer_uid, 'bakery',   'Need a 1 kg chocolate cake for Friday evening. Eggless if possible, with "Happy Birthday Amma" on top.', 1000, 'This week (Friday)', 'open', now() - interval '1 day'),
      (v_need_taxi,     v_customer_uid, 'taxi',     'Airport drop on Saturday at 5 am from Indiranagar. One suitcase and two passengers.', 1000, 'This week', 'open', now() - interval '3 hours');

    -- One reply from the matching plumbing shop (owned by the shop account above).
    insert into need_responses (need_id, shop_id, message, price, created_at) values
      (v_need_plumbing, v_plumber, 'I can come by 6 pm today. Visit charge is included in the price.', 299, now() - interval '90 minutes');
  end if;
end $$;

drop table if exists _lc_demo_config;
