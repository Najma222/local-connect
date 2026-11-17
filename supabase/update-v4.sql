-- Round 3 hardening. Run in the Supabase SQL Editor AFTER update-v3.sql (safe to run again).
-- Changes no screens. Closes loopholes and fixes order step times for orders inserted past "new".

-- 1) Backfill a "Placed" time for orders that are missing one (must run before the trigger below).
update orders set status_times = jsonb_build_object('new', created_at) || status_times
 where not (status_times ? 'new');

-- 2) Order times: on insert always record "Placed" at created_at; clients cannot overwrite the times.
create or replace function log_order_status() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.status_times := jsonb_build_object('new', coalesce(new.created_at, now()));
    if new.status <> 'new' then new.status_times := new.status_times || jsonb_build_object(new.status, now()); end if;
  elsif new.status is distinct from old.status then
    new.status_times := coalesce(old.status_times, '{}'::jsonb) || jsonb_build_object(new.status, now());
  else
    new.status_times := old.status_times;
  end if;
  return new;
end $$;

-- 3) Shops can only post a plain pending reply (no faking "accepted", no customer contact).
drop policy if exists "shop answers open need" on need_responses;
create policy "shop answers open need" on need_responses for insert
  with check (owns_shop(shop_id) and status = 'pending' and customer_name is null and customer_phone is null
              and exists (select 1 from needs n where n.id = need_id and n.status = 'open'));

-- 4) Customers can only close their own open need (no reopening a booked one). Accepting goes through accept_response.
drop policy if exists "customer updates need" on needs;
create policy "customer updates need" on needs for update
  using (customer_id = auth.uid() and status = 'open') with check (customer_id = auth.uid() and status = 'closed');

-- 5) Two Accepts at the same moment: lock the need row so only the first wins.
create or replace function accept_response(rid uuid, cname text, cphone text) returns void
language plpgsql security definer set search_path = public as $$
declare nid uuid;
begin
  select r.need_id into nid from need_responses r join needs n on n.id = r.need_id
   where r.id = rid and n.customer_id = auth.uid() and n.status = 'open'
   for update of n;
  if nid is null then raise exception 'You can only accept a reply on your own open need.'; end if;
  update need_responses set
    status = case when id = rid then 'accepted' else 'declined' end,
    customer_name = case when id = rid then cname else customer_name end,
    customer_phone = case when id = rid then cphone else customer_phone end
  where need_id = nid;
  update needs set status = 'booked' where id = nid;
end $$;
grant execute on function accept_response(uuid, text, text) to authenticated;
