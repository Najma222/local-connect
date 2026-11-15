-- Run AFTER schema.sql and seed.sql. Adds map coordinates, quick needs, reviews, ratings, profile switch, realtime.
-- Shop coordinates are supplied by demo-bangalore.sql (or by the shop owner in the app).
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
