# Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router), JavaScript | One codebase for pages and the AI API route; deploys free on Vercel |
| Styling | Tailwind CSS, Outfit + Caveat fonts | Fast, consistent tokens in `tailwind.config.js` |
| Database | Supabase Postgres with Row Level Security | Auth, DB, storage and realtime in one free service |
| Auth | Supabase Auth (email + password) | Roles: customer, shop, admin |
| Storage | Supabase Storage bucket `images` | Shop and item photos |
| Realtime | Supabase Realtime on `orders` and `need_responses` | Order tracking and replies update by themselves (15s polling as fallback) |
| Map | Leaflet + OpenStreetMap tiles | Free, no API key or billing |
| Location | Browser Geolocation + haversine distance | No paid APIs |
| Voice | Web Speech API (where the browser supports it) | Optional voice-to-text on the quick-need form |
| AI | Anthropic API from `/api/ai-listing` (key stays on the server) | Optional: fills item name, price and description from a photo |
| Hosting | Vercel + installable PWA (manifest, icons) | iPhone: Safari, Share, Add to Home Screen |

## Data model
profiles, shops (lat, lng, verified), products, orders, order_items, needs, need_responses, reviews, view shop_ratings.

## Run order for the SQL
1. `supabase/schema.sql` 2. `supabase/seed.sql` 3. `supabase/update-v2.sql` 4. `supabase/demo-bangalore.sql` (after creating the two demo accounts).
