-- ============================================================
-- Local Connect: first-time setup (schema + cleanup + v2 features)
-- Paste this ENTIRE file into Supabase > SQL Editor and click Run.
-- Safe order preserved: schema.sql -> seed.sql -> update-v2.sql
-- After this, create your two accounts in the app, then run
-- demo-bangalore.sql separately.
-- ============================================================

-- ============================================================
-- 1) schema.sql
-- ============================================================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer','shop','admin')),
  created_at timestamptz default now()
);

create table shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete set null,
  name text not null,
  category text not null,
  description text,
  address text,
  phone text,
  whatsapp text,
  image_url text,
  verified boolean not null default false,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops on delete cascade,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  image_url text,
  in_stock boolean not null default true,
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops on delete cascade,
  customer_id uuid not null references auth.users on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  note text,
  total numeric not null,
  status text not null default 'new' check (status in ('new','accepted','ready','completed','cancelled')),
  created_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  product_id uuid references products on delete set null,
  name text not null,
  price numeric not null,
  qty int not null check (qty > 0)
);

-- Create a profile automatically on sign up (role can only be customer or shop)
create function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name',
          case when new.raw_user_meta_data->>'role' = 'shop' then 'shop' else 'customer' end);
  return new;
end $$ language plpgsql security definer set search_path = public;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Only admins can set the verified badge.
-- auth.uid() is null in the Supabase SQL Editor / service role, so seeding is allowed.
create function protect_verified() returns trigger as $$
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
create trigger shops_protect_verified before insert or update on shops
  for each row execute function protect_verified();

-- Row level security
alter table profiles enable row level security;
alter table shops enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create function is_admin() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$ language sql security definer stable set search_path = public;
create function owns_shop(sid uuid) returns boolean as $$
  select exists (select 1 from shops where id = sid and owner_id = auth.uid())
$$ language sql security definer stable set search_path = public;

create policy "own profile" on profiles for select using (id = auth.uid());

create policy "shops public read" on shops for select using (true);
create policy "owner creates shop" on shops for insert with check (owner_id = auth.uid());
create policy "owner or admin updates shop" on shops for update using (owner_id = auth.uid() or is_admin());

create policy "products public read" on products for select using (true);
create policy "owner adds product" on products for insert with check (owns_shop(shop_id));
create policy "owner edits product" on products for update using (owns_shop(shop_id));
create policy "owner deletes product" on products for delete using (owns_shop(shop_id));

create policy "customer places order" on orders for insert with check (customer_id = auth.uid());
create policy "customer or shop reads order" on orders for select using (customer_id = auth.uid() or owns_shop(shop_id));
create policy "shop updates order" on orders for update using (owns_shop(shop_id));

create policy "add items to own order" on order_items for insert
  with check (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "read items of visible order" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or owns_shop(o.shop_id))));

-- Image storage
insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict do nothing;
create policy "images public read" on storage.objects for select using (bucket_id = 'images');
create policy "images signed-in upload" on storage.objects for insert to authenticated with check (bucket_id = 'images');

-- ============================================================
-- 2) seed.sql (legacy cleanup only)
-- ============================================================
delete from shops where id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000009'
);

-- ============================================================
-- 3) update-v2.sql (map, needs, reviews, realtime)
-- ============================================================
alter table shops add column if not exists lat double precision;
alter table shops add column if not exists lng double precision;

create table if not exists needs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users on delete cascade,
  category text not null,
  description text not null,
  budget numeric,
  when_text text,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz default now()
);
create table if not exists need_responses (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references needs on delete cascade,
  shop_id uuid not null references shops on delete cascade,
  message text,
  price numeric,
  created_at timestamptz default now(),
  unique (need_id, shop_id)
);
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders on delete cascade,
  shop_id uuid not null references shops on delete cascade,
  customer_id uuid not null references auth.users on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);
create or replace view shop_ratings as
  select shop_id, round(avg(rating)::numeric, 1) as avg, count(*)::int as count from reviews group by shop_id;

alter table needs enable row level security;
alter table need_responses enable row level security;
alter table reviews enable row level security;

drop policy if exists "customer posts need" on needs;
create policy "customer posts need" on needs for insert with check (customer_id = auth.uid());
drop policy if exists "customer or matching shop reads need" on needs;
create policy "customer or matching shop reads need" on needs for select
  using (customer_id = auth.uid() or exists (select 1 from shops s where s.owner_id = auth.uid() and s.category = needs.category));
drop policy if exists "customer updates need" on needs;
create policy "customer updates need" on needs for update using (customer_id = auth.uid());

drop policy if exists "shop answers open need" on need_responses;
create policy "shop answers open need" on need_responses for insert
  with check (owns_shop(shop_id) and exists (select 1 from needs n where n.id = need_id and n.status = 'open'));
drop policy if exists "shop or need owner reads response" on need_responses;
create policy "shop or need owner reads response" on need_responses for select
  using (owns_shop(shop_id) or exists (select 1 from needs n where n.id = need_id and n.customer_id = auth.uid()));

drop policy if exists "reviews public read" on reviews;
create policy "reviews public read" on reviews for select using (true);
drop policy if exists "customer reviews completed order" on reviews;
create policy "customer reviews completed order" on reviews for insert
  with check (customer_id = auth.uid() and exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid() and o.status = 'completed' and o.shop_id = reviews.shop_id));

-- Let people switch between buyer and seller mode (never to admin)
drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update using (id = auth.uid()) with check (role in ('customer','shop'));

-- Realtime (safe to re-run: only adds the tables if they are not in the publication yet).
-- Full replica identity keeps filtered UPDATE/DELETE events reliable.
alter table orders replica identity full;
alter table need_responses replica identity full;
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
      execute 'alter publication supabase_realtime add table public.orders';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'need_responses') then
      execute 'alter publication supabase_realtime add table public.need_responses';
    end if;
  end if;
end $$;
