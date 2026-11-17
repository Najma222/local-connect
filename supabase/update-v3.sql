-- Round 3 upgrade. Run ONCE in the Supabase SQL Editor, after update-v2.sql (safe to run again).
-- Adds: accept a reply on a need, custom ("something else") needs, order status times, customer cancel.

-- 1) Needs: custom needs + a "booked" state
alter table needs add column if not exists custom_label text;
alter table needs drop constraint if exists needs_status_check;
alter table needs add constraint needs_status_check check (status in ('open','booked','closed'));

-- Shops can read needs in their category AND custom ("other") needs
drop policy if exists "customer or matching shop reads need" on needs;
create policy "customer or matching shop reads need" on needs for select
  using (customer_id = auth.uid() or exists (
    select 1 from shops s where s.owner_id = auth.uid() and (s.category = needs.category or needs.category = 'other')));

-- 2) Replies: pending / accepted / declined, plus contact shared only on accept
alter table need_responses add column if not exists status text not null default 'pending';
alter table need_responses drop constraint if exists need_responses_status_check;
alter table need_responses add constraint need_responses_status_check check (status in ('pending','accepted','declined'));
alter table need_responses add column if not exists customer_name text;
alter table need_responses add column if not exists customer_phone text;

create or replace function accept_response(rid uuid, cname text, cphone text) returns void
language plpgsql security definer set search_path = public as $$
declare nid uuid;
begin
  select r.need_id into nid from need_responses r join needs n on n.id = r.need_id
   where r.id = rid and n.customer_id = auth.uid() and n.status = 'open';
  if nid is null then raise exception 'You can only accept a reply on your own open need.'; end if;
  update need_responses set
    status = case when id = rid then 'accepted' else 'declined' end,
    customer_name = case when id = rid then cname else customer_name end,
    customer_phone = case when id = rid then cphone else customer_phone end
  where need_id = nid;
  update needs set status = 'booked' where id = nid;
end $$;
grant execute on function accept_response(uuid, text, text) to authenticated;

-- 3) Orders: remember when each status happened, and let customers cancel a new order
alter table orders add column if not exists status_times jsonb not null default '{}'::jsonb;
update orders set status_times = jsonb_build_object('new', created_at) where status_times = '{}'::jsonb;
create or replace function log_order_status() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then new.status_times := jsonb_build_object(new.status, now());
  elsif new.status is distinct from old.status then
    new.status_times := coalesce(old.status_times, '{}'::jsonb) || jsonb_build_object(new.status, now());
  end if;
  return new;
end $$;
drop trigger if exists orders_log_status on orders;
create trigger orders_log_status before insert or update on orders for each row execute function log_order_status();

drop policy if exists "customer cancels new order" on orders;
create policy "customer cancels new order" on orders for update
  using (customer_id = auth.uid() and status = 'new') with check (customer_id = auth.uid() and status = 'cancelled');

-- 4) Realtime for new needs (shops see requests as they arrive)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'needs') then
    execute 'alter publication supabase_realtime add table public.needs';
  end if;
end $$;
