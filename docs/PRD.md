# Local Connect: Product Requirements Document

## 1. Problem
Small local sellers and service providers (home bakers, crochet and gift makers, corner stores, plumbers, electricians, garages, taxis, student gig workers) are invisible online. Customers juggle WhatsApp groups, Instagram, Justdial and Maps. Directories rank by ad spend, so small sellers lose.

## 2. Vision
One app where every shop in your neighbourhood has a storefront, and ordering takes three taps.

## 3. Users
| User | Goal |
|---|---|
| Customer | Find a nearby shop, see its items, add to cart, send an order |
| Shop / business owner | Get a storefront in 2 minutes, list items fast, receive and manage orders |
| Admin | Verify genuine shops with a trust badge |

## 4. Scope (36-hour MVP)
**Must have**
- Home page showing all registered shops, with category chips and search
- Shop page showing that shop's items and services, with add to cart
- Cart limited to one shop per order, quantity controls, order form (name, phone, note)
- Sign up and log in with roles: customer, shop, admin
- Shop dashboard: create shop, add or delete items, stock toggle, photo upload, order list with status updates
- Order tracking: a 4-step timeline (placed, accepted, ready, completed) that refreshes every 8 seconds
- Admin verify toggle, with Verified badge and verified-first sorting
- AI listing: upload a photo, AI fills name, price and description

**Added in v2:** live map of shops, quick needs (3-step post, shop replies with price), ratings for completed orders, buyer/seller mode switch, realtime order updates.

**Out of scope:** online payments (pay the shop directly), delivery logistics, real-time chat, native apps, online payments, taxi dispatch (taxis and autos are bookable listings).

## 5. Key flows
1. **Customer:** Home → tap shop → add items → cart → log in → place order → My orders shows status.
2. **Shop:** Sign up as "I run a shop" → open shop → add items (photo + AI) → Orders tab → Accept → Ready → Completed.
3. **Admin:** Admin page → Verify shop → badge shows everywhere.

## 6. Functional requirements
- FR1: Home lists every shop, verified first. Filter by category, search by name and description.
- FR2: Shop page lists items with price and stock state.
- FR3: Cart persists across reloads, holds one shop at a time, and asks before switching shops.
- FR4: Orders store a snapshot of item names and prices.
- FR5: Row-level security: customers see only their orders, shops see only their orders, only admins can set `verified`.
- FR6: AI key stays server-side.

## 7. Non-functional
Mobile first. Home loads under 3 seconds on 4G. Keyboard focus visible. Reduced motion respected. Secrets never committed.

## 8. Data model
`profiles(id, full_name, role)`, `shops(id, owner_id, name, category, description, address, phone, whatsapp, image_url, verified)`, `products(id, shop_id, name, description, price, image_url, in_stock)`, `orders(id, shop_id, customer_id, customer_name, customer_phone, note, total, status)`, `order_items(id, order_id, product_id, name, price, qty)`.

## 9. Success metrics (for the demo)
Shop live in under 2 minutes. Item listed in under 60 seconds with AI. 3 taps from home to cart. 18 seeded Bangalore shops with 70 items across all 9 categories.

## 10. Risks
| Risk | Mitigation |
|---|---|
| Empty marketplace | Bangalore seed data in `demo-bangalore.sql` |
| Fake shops | Admin verification badge |
| Email confirmation blocks the demo | Turn it off in Supabase for the hackathon |
| AI fails live | Manual entry still works, and keep a backup screen recording |

## 11. Future scope
Online payments (UPI), location-based sorting, ratings and reviews, delivery partners, push and WhatsApp notifications.
