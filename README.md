# Local Connect

One app for every shop, service and helper in your neighbourhood. Browse local shops, order, post a need, and track it all in real time. Installable on iPhone and Android as a web app (PWA).

**Live demo:** <add Vercel URL>

## Features
- Shop discovery with category filters and shop pages
- Hand-drawn per-item doodles (no photos needed)
- Live map of nearby shops (Leaflet + OpenStreetMap)
- Quick needs: post a request, shops reply
- One-shop cart and realtime order tracking
- Ratings and reviews
- Buyer / seller mode switch and a shop dashboard
- Admin page to verify shops
- Optional AI listing helper ("Fill with AI")
- Installable PWA with an offline page

Product details are in [docs/PRD.md](docs/PRD.md).

## Tech stack
Next.js 14 (App Router, plain JavaScript), Tailwind CSS 3, Supabase (Postgres, Auth, Storage, RLS, Realtime), Leaflet, Gemini or Anthropic for the optional AI listing, Vercel for hosting.

## Local setup
1. Create a free project at supabase.com.
2. Run the SQL files (next section).
3. In **Authentication > Providers > Email**, turn off **Confirm email** so demo sign-ups work immediately.
4. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key (Project Settings > API).
5. `npm install`, then `npm run dev` and open http://localhost:3000.

## Supabase SQL run order
Run these in the Supabase SQL Editor.

1. `supabase/run-first.sql`: one-paste first-time setup. It contains `schema.sql`, `seed.sql` and `update-v2.sql` in the right order. Use this on a fresh project.
2. Sign up your demo accounts in the app (see below).
3. `supabase/demo-bangalore.sql`: Bangalore demo data. Safe to run again.
4. `supabase/update-v3.sql`: Round 3 upgrade (accept replies, custom needs, order times, cancel). Safe to run again. See [docs/ROUND3.md](docs/ROUND3.md).

Alternative to step 1: run `schema.sql`, then `seed.sql`, then `update-v2.sql` yourself. Do not run both routes.

## Demo accounts
`demo-bangalore.sql` links ownership, orders and needs by email. Sign up two accounts in the app:

| Account | Sign up as | Gets |
|---|---|---|
| Shop | I run a shop | The bakery, plumber and taxi shops |
| Customer | I want to buy | 4 orders, 3 needs and 1 review |

Then edit the config block at the top of `supabase/demo-bangalore.sql` and replace the two emails with the ones you signed up with, for example:

```sql
('demo.shop@example.com',      -- DEMO_SHOP_EMAIL
 'demo.customer@example.com'); -- DEMO_CUSTOMER_EMAIL
```

If an account does not exist yet, that part is skipped quietly. Sign up, then run the file again.

## Make yourself admin
After signing up, run this in the SQL Editor (replace the email):

```sql
insert into public.profiles (id, full_name, role)
select id, coalesce(raw_user_meta_data->>'full_name', 'Admin'), 'admin'
from auth.users
where email = 'ADMIN_EMAIL'
on conflict (id) do update set role = 'admin';
```

Reload the app. The Admin page appears in your Profile. Only admins can set the verified badge.

## Environment variables
| Name | Required | Used in | Visibility |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase client (`lib/supabase.js`) | Public (sent to browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase client | Public (protected by RLS) |
| `GEMINI_API_KEY` | No | `app/api/ai-listing/route.js` | Server only |
| `GEMINI_MODEL` | No | AI route (default `gemini-3.5-flash`) | Server only |
| `ANTHROPIC_API_KEY` | No | AI route, used only if no Gemini key | Server only |

The AI route uses Gemini if `GEMINI_API_KEY` is set, otherwise Anthropic if `ANTHROPIC_API_KEY` is set. With neither, the AI button shows a friendly message and manual entry still works. Never prefix the AI keys with `NEXT_PUBLIC`.

## Deploy to Vercel
1. Push the repo to GitHub (`.env.local` is git-ignored; never commit keys).
2. On vercel.com choose **Add New > Project** and import the repo.
3. Vercel auto-detects Next.js. Leave the build settings alone.
4. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `GEMINI_API_KEY`, `GEMINI_MODEL`, `ANTHROPIC_API_KEY`.
5. Click **Deploy** and note your Vercel URL.
6. In Supabase go to **Authentication > URL Configuration**. Set **Site URL** to the Vercel URL. Add the Vercel URL and `http://localhost:3000` to **Redirect URLs**.
7. Run the admin SQL above for the account you use on the deployed app.

If you change environment variables later, redeploy: new values only apply to new deployments.

## Install on iPhone
1. Open the HTTPS Vercel URL in **Safari** (installing needs HTTPS; plain localhost on your PC will not work from a phone).
2. Tap **Share**, then **Add to Home Screen**, then **Add**.
3. Open it from the home screen. It runs full screen like an app.

Offline: only a simple "You are offline" page is shown. Shops, orders and the map need a connection.

Updating: close the app fully (swipe it away) and open it again. The latest version loads on the next launch.

## Install on Android
Open the Vercel URL in Chrome and tap **Install app** (or menu > **Add to Home screen**). Long-press the icon for shortcuts to Map, Orders and Post a need.

## Troubleshooting
- **Page looks plain or unstyled in dev:** stop the dev server, delete the `.next` folder, run `npm run dev` again. Never run `npm run build` while the dev server is running; it corrupts `.next`.
- **Orders or needs do not update live:** check the tables are in the `supabase_realtime` publication (`update-v2.sql` adds them).
- **Sign-up needs an email confirmation:** turn off **Confirm email** in Supabase for the demo.
- **Old version shows in dev after testing a production build:** the service worker is only registered in production and is removed in dev; reload once.

## Project structure
```
app/           Pages (map, orders, need, needs, shop, dashboard, admin, profile, login, cart) and app/api/ai-listing
components/    UI pieces (Navbar, MapView, Doodle, ItemDoodle, RegisterSW, InstallHint, ...)
lib/           Supabase client, app context, constants, geo, doodles
public/        manifest.json, sw.js, offline.html, icons
supabase/      SQL files (run-first, schema, seed, update-v2, demo-bangalore)
docs/PRD.md    Product requirements
```
