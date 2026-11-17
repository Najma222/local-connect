# Local Connect

One app for every shop, service and helper in your neighbourhood. Browse local shops, order, post a need, and track it all in real time. Installable on iPhone and Android as a web app (PWA).

**Live demo:** https://local-connect-six.vercel.app/

## Features
- Shop discovery with category filters and shop pages
- Hand-drawn per-item doodles (no photos needed)
- Live map of nearby shops (Leaflet + OpenStreetMap)
- Ask your neighbours: post a need (or a custom "something else"), compare replies, accept one and share your number with that shop only
- One-shop cart and realtime order tracking
- Ratings and reviews
- Buyer / seller mode switch and a shop dashboard
- Admin page to verify shops
- Optional AI listing helper ("Fill with AI")
- Live badges and in-app alerts for new orders, requests and replies
- Push notifications on Android and iPhone, even when the app is closed
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
5. `supabase/update-v4.sql`: Round 3 hardening (locks down replies and need status, fixes order step times). Safe to run again.
6. `supabase/update-v5-push.sql`: push notifications. Safe to run again. See **Push notifications** below.

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
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | For push | `lib/push.js` (subscribe) | Public |
| `VAPID_PRIVATE_KEY` | For push | `app/api/push/route.js` | Server only |
| `PUSH_WEBHOOK_SECRET` | For push | `app/api/push/route.js`, must match `push_config` | Server only |
| `VAPID_SUBJECT` | No | Push contact (`mailto:` or site URL) | Server only |

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

## Push notifications
Phones get notified even when the app is closed.

| Who | Gets notified about | Tapping opens |
|---|---|---|
| Shop | New order, new request in its category (custom needs go to every shop), customer cancelled, offer accepted | My shop |
| Customer | A shop replied; order accepted, ready, completed or cancelled by the shop | My needs or Orders |

### How it works
A change in the database (new order, reply, ...) fires a trigger in Supabase. The trigger looks up the right person's phones and calls `/api/push` on Vercel. That route signs the message and hands it to Google (Android) or Apple (iPhone), which deliver it to the phone. The service worker (`public/sw.js`) shows it.

### The three values
| Name | What it is | Where it goes |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public half of the VAPID key pair. VAPID is the standard way a web app proves to Google and Apple that pushes really come from it. Phones subscribe with this key. | Vercel (safe to be public) |
| `VAPID_PRIVATE_KEY` | Private half. Signs every push. Anyone with it could send pushes as your app. | Vercel only. Never commit it. |
| `PUSH_WEBHOOK_SECRET` | A password you make up. Supabase sends it with every call to `/api/push`, so strangers cannot call that route. | Vercel **and** the `push_config` row in Supabase (same value in both) |

Make them once, on your computer, in the project folder:
```bash
npx web-push generate-vapid-keys
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```
The first prints the public and private key, the second prints a secret. Put all three in `.env.local` (see `.env.example`). Keep the same values from then on: if you change the key pair, every phone has to turn notifications on again.

### Setup order
1. Add the three values in **Vercel > Settings > Environment Variables**.
2. Push the code (or **Redeploy** if it is already pushed). Vercel only uses variables that existed when the deployment started.
3. In Supabase run `update-v4.sql`, then `update-v5-push.sql`, then the `insert into push_config ...` statement at the bottom of v5 with your Vercel URL and the same secret.
4. On each phone, open **Profile** and tap **Turn on notifications**.

- **Android:** works in Chrome, installed or not.
- **iPhone:** iOS 16.4 or later, and only from the Home Screen app (Share, Add to Home Screen, open it from there). Safari tabs cannot get push.
- Safe to deploy before setup: without the public key the button is hidden, and without the `push_config` row nothing is sent.
- Nothing arriving? Run `select status_code, content from net._http_response order by created desc limit 5;` in the SQL Editor. `403` means the secret in Vercel and `push_config` differ; `503` means a Vercel variable is missing.

## Install on Android
Open the Vercel URL in Chrome and tap **Install app** (or menu > **Add to Home screen**). Long-press the icon for shortcuts to Map, Orders and Post a need.

## Troubleshooting
- **Page looks plain or unstyled in dev:** stop the dev server, delete the `.next` folder, run `npm run dev` again. Never run `npm run build` while the dev server is running; it corrupts `.next`.
- **Orders or needs do not update live:** check the tables are in the `supabase_realtime` publication (`update-v2.sql` adds them).
- **Sign-up needs an email confirmation:** turn off **Confirm email** in Supabase for the demo.
- **Old version shows in dev after testing a production build:** the service worker is only registered in production and is removed in dev; reload once.

## Project structure
```
app/           Pages (map, orders, need, needs, shop, dashboard, admin, profile, login, cart), app/api/ai-listing and app/api/push
components/    UI pieces (Navbar, MapView, Doodle, ItemDoodle, RegisterSW, InstallHint, ...)
lib/           Supabase client, app context, constants, geo, doodles, badges, push
public/        manifest.json, sw.js, offline.html, icons
supabase/      SQL files (run-first, schema, seed, update-v2 to v5, demo-bangalore)
docs/PRD.md    Product requirements
```
