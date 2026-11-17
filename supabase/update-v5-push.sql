-- Push notifications (Android + iPhone). Run in the Supabase SQL Editor AFTER update-v4.sql (safe to run again).
-- Then run the "Turn it on" insert at the bottom with your Vercel URL and PUSH_WEBHOOK_SECRET.
-- Until that row exists, nothing is sent and nothing else changes.

create extension if not exists pg_net;

-- 1) One row per phone/browser that turned notifications on.
create table if not exists push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references auth.users on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz default now()
);
create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);
alter table push_subscriptions enable row level security;
drop policy if exists "own push devices" on push_subscriptions;
create policy "own push devices" on push_subscriptions for select using (user_id = auth.uid());
-- Writes only through these two functions. Saving an endpoint moves the device to whoever is logged in now.
create or replace function save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Log in first.'; end if;
  insert into push_subscriptions (endpoint, user_id, p256dh, auth) values (p_endpoint, auth.uid(), p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
end $$;
create or replace function remove_push_subscription(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
$$;
revoke execute on function save_push_subscription(text, text, text) from public, anon;
revoke execute on function remove_push_subscription(text) from public, anon;
grant execute on function save_push_subscription(text, text, text) to authenticated;
grant execute on function remove_push_subscription(text) to authenticated;

-- 2) Where to send. Private: RLS on, no policies, no grants. Only the database itself reads it.
create table if not exists push_config (
  id     int primary key default 1 check (id = 1),
  url    text not null,
  secret text not null
);
alter table push_config enable row level security;
revoke all on push_config from anon, authenticated;

-- 3) Send helper. Never raises: a failed push must not block an order, need or reply.
create or replace function send_push(uids uuid[], p_title text, p_body text, p_url text, p_tag text default null) returns void
language plpgsql security definer set search_path = public as $$
declare cfg push_config; subs jsonb;
begin
  select * into cfg from push_config where id = 1;
  if not found then return; end if;
  select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)) into subs
    from push_subscriptions s where s.user_id = any(uids);
  if subs is null then return; end if;
  perform net.http_post(
    url     := cfg.url,
    body    := jsonb_build_object('subs', subs, 'title', p_title, 'body', p_body, 'url', p_url, 'tag', p_tag),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', cfg.secret));
exception when others then
  raise warning 'send_push skipped: %', sqlerrm;
end $$;
revoke execute on function send_push(uuid[], text, text, text, text) from public, anon, authenticated;

-- 4) Orders: new order -> shop; status change -> customer; customer cancel -> shop.
create or replace function orders_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_shop text;
begin
  select owner_id, name into v_owner, v_shop from shops where id = new.shop_id;
  if tg_op = 'INSERT' then
    perform send_push(array[v_owner], 'New order · ₹' || trim_scale(new.total), new.customer_name || ' just ordered. Tap to accept.', '/dashboard', 'order-' || new.id);
  elsif new.status is distinct from old.status then
    if new.status = 'cancelled' and auth.uid() = new.customer_id then
      perform send_push(array[v_owner], 'Order cancelled', new.customer_name || ' cancelled their order.', '/dashboard', 'order-' || new.id);
    else
      perform send_push(array[new.customer_id], coalesce(v_shop, 'Your order'),
        case new.status
          when 'accepted'  then 'Accepted! The shop is getting your order ready.'
          when 'ready'     then 'Your order is ready.'
          when 'completed' then 'Order completed. Tap to rate it.'
          when 'cancelled' then 'The shop cancelled your order. Call them if this is a surprise.'
          else 'Your order was updated.' end,
        '/orders', 'order-' || new.id);
    end if;
  end if;
  return null;
end $$;
drop trigger if exists orders_push on orders;
create trigger orders_push after insert or update of status on orders for each row execute function orders_push();

-- 5) Needs: new need -> owners of matching shops (custom "other" needs -> every shop owner).
create or replace function needs_push() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform send_push(
    array(select distinct owner_id from shops where owner_id is not null and owner_id <> new.customer_id
          and (category = new.category or new.category = 'other')),
    case when new.category = 'other' then 'New request: ' || coalesce(new.custom_label, 'Something else') else 'New request nearby' end,
    left(new.description, 140), '/dashboard?tab=requests', 'need-' || new.id);
  return null;
end $$;
drop trigger if exists needs_push on needs;
create trigger needs_push after insert on needs for each row execute function needs_push();

-- 6) Replies: new reply -> customer; reply accepted -> that shop.
create or replace function need_responses_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_customer uuid; v_shop text; v_owner uuid;
begin
  select customer_id into v_customer from needs where id = new.need_id;
  select name, owner_id into v_shop, v_owner from shops where id = new.shop_id;
  if tg_op = 'INSERT' then
    perform send_push(array[v_customer], coalesce(v_shop, 'A shop') || ' replied',
      coalesce('₹' || trim_scale(new.price) || ' · ', '') || coalesce(new.message, 'Tap to compare and accept.'), '/needs', 'need-' || new.need_id);
  elsif new.status = 'accepted' and old.status is distinct from 'accepted' then
    perform send_push(array[v_owner], 'You got the job!', coalesce(new.customer_name, 'The customer') || ' accepted your offer. Tap to call them.',
      '/dashboard?tab=requests', 'resp-' || new.id);
  end if;
  return null;
end $$;
drop trigger if exists need_responses_push on need_responses;
create trigger need_responses_push after insert or update of status on need_responses for each row execute function need_responses_push();

-- 7) Turn it on: replace both values, then run just this statement. Re-run it to change them.
-- insert into push_config (id, url, secret) values (1, 'https://YOUR-APP.vercel.app/api/push', 'PASTE_PUSH_WEBHOOK_SECRET')
--   on conflict (id) do update set url = excluded.url, secret = excluded.secret;
