# Local Connect

One app for every shop, service and helper in your neighbourhood. Browse Bangalore shops, add items to a cart, place an order and track it. Shops get a dashboard to list items and manage orders. Works on iPhone as an installable web app (PWA).

**Live demo:** <vercel-url>(in-progress)

## Tech
Next.js 14 (App Router, JavaScript), Tailwind CSS, Supabase (Postgres, Auth, Storage, RLS, Realtime), Leaflet + OpenStreetMap, Vercel. AI listing is optional.

## What the demo data contains
`supabase/demo-bangalore.sql` adds 18 invented Bangalore shops (2 per category) around Indiranagar, Koramangala, HSR Layout, Jayanagar, Malleshwaram and Whitefield, with 3 to 5 items each and rupee pricing. It also adds:

- 12 verified and 6 unverified shops, with approximate map coordinates.
- 4 bakery orders for the demo customer in `new`, `accepted`, `ready` and `completed` states, plus 1 review.
- 3 open needs (leaking tap, Friday cake, airport drop) and 1 reply from the plumbing shop.
- Ownership of 3 shops (bakery, plumber, taxi) for the demo shop account, when that account exists.

Shop and item `image_url` values are left empty on purpose: the app draws hand-drawn doodles. Add real photos later for 3 to 4 hero shops only.

## Setup
1. Create a free project at supabase.com.
2. In **SQL Editor**, run the files in this exact order:
   1. `supabase/schema.sql`
   2. `supabase/seed.sql` (removes the old Delhi demo rows; no new data)
   3. `supabase/update-v2.sql` (map, quick needs, ratings, realtime)
   4. `supabase/demo-bangalore.sql` (Bangalore demo data; safe to run again)
3. **Authentication → Providers → Email:** turn off **Confirm email** so demo sign-ups work immediately.
4. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key. `ANTHROPIC_API_KEY` is optional; without it the AI button shows a friendly message and manual entry still works.
5. `npm install` then `npm run dev` (http://localhost:3000).

## Create the two demo accounts first
The demo SQL links ownership, orders and needs by email. Create these accounts in the app, then run `demo-bangalore.sql`:

| Account | How to create it | Used by the demo |
|---|---|---|
| Shop | Sign up with **I run a shop** | Owns the bakery, the plumber and the taxi shop |
| Customer | Sign up with **I want to buy** | Owns the 4 orders, 3 needs and 1 review |

Before running `demo-bangalore.sql`, replace the two placeholder emails at the top of that file:

```sql
-- DEMO_SHOP_EMAIL
'demo.shop@localconnect.test'
-- DEMO_CUSTOMER_EMAIL
'demo.customer@localconnect.test'
```

If you run the demo SQL before creating the accounts, that is fine: it skips them quietly. Run the file again after signing up.

## Make yourself admin
Run this in the Supabase SQL Editor after you have signed up in the app (replace the email):

```sql
insert into public.profiles (id, full_name, role)
select id, coalesce(raw_user_meta_data->>'full_name', 'Admin'), 'admin'
from auth.users
where email = 'ADMIN_EMAIL'
on conflict (id) do update set role = 'admin';
```

Then reload the app. The Admin page appears in your Profile. Only admins can set the verified badge.

## Deploy (Vercel)
1. Push to a public GitHub repo (`.env.local` is git-ignored; never commit keys).
2. vercel.com → Add New Project → import the repo.
3. Add the same environment variables in the project settings, then Deploy.
4. Run the admin SQL above for the account you use on the deployed app.

## Test on your iPhone (no Mac or Android needed)
1. Open your Vercel link in **Safari** on the iPhone.
2. Tap Share → **Add to Home Screen**. It opens full screen like an app.
3. Use two accounts: the shop account in a second browser or private tab, so you can see the order tracking move while the customer stays signed in.

## Features
Shop discovery with category filters, shop pages and a one-shop cart, order tracking (realtime), live map (Leaflet), quick needs with shop replies, ratings, buyer/seller mode switch, admin verification, optional AI listing.

## Demo run order (SQL recap)
`supabase/schema.sql` → `supabase/seed.sql` → `supabase/update-v2.sql` → `supabase/demo-bangalore.sql`.

## Docs
`docs/SETUP_FROM_SCRATCH.md` (new Supabase project, accounts, git repo and Vercel, start to finish), `docs/PRD.md`, `docs/TECH_STACK.md`, `docs/DEMO_CHECKLIST.md` (the phone test), `docs/AGENT_PROMPT.md` (hand this to another AI agent), `docs/PROMPTS.md`.
