# Local Connect: phone demo checklist

A click-by-click test of the full flow on a phone. Run it once on the deployed Vercel link in Safari before the demo. Two accounts are needed: the shop account in a second browser or private tab, and the customer account in Safari.

## Before you start (5 minutes)

- [ ] Run the SQL in this order: `schema.sql`, `seed.sql`, `update-v2.sql`, `demo-bangalore.sql`.
- [ ] Replace the two email placeholders at the top of `demo-bangalore.sql` with the real demo emails, then run it again.
- [ ] Sign up the **shop** account with "I run a shop" and the **customer** account with "I want to buy".
- [ ] Run the admin SQL from the README for the admin account, then reload the app.
- [ ] Turn off **Confirm email** in Supabase Authentication settings.
- [ ] Add the site to the iPhone Home Screen: Safari → Share → Add to Home Screen.
- [ ] Open the shop account in a second browser or a private tab and keep both signed in.
- [ ] Confirm `.env.local` or Vercel has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## The 10-step rehearsal path

### 1. Home page looks local
- [ ] Open `/` on the phone.
- [ ] Expect "Namaste · Indiranagar, Bengaluru", the handwritten line about a home baker and the airport auto, and 9 category cards.
- [ ] Expect 18 shops with the 12 verified shops first, each showing a name, area, description, doodle and verified badge.

### 2. Filter and search
- [ ] Tap **Cakes and bakery**. Expect exactly 2 bakeries.
- [ ] Tap the card again to clear the filter.
- [ ] Type `plumber` in the search box. Expect the 2 plumbing shops; clear the search.

### 3. Open the hero bakery
- [ ] Open **Nandini's Cake Studio** (Indiranagar).
- [ ] Expect the verified badge, 5 items, rupee prices (1 kg cakes from ₹950 to ₹1,100), and a 5.0 rating from the seeded review.
- [ ] Tap **WhatsApp** and confirm the prefilled number starts with 91. Do not send a message unless you want to.

### 4. One-shop cart rule
- [ ] Add the **Belgian chocolate cake (1 kg)** and **Vanilla cupcakes (box of 6)**.
- [ ] Expect the floating cart bar to show 2 items and ₹1,370.
- [ ] Open another shop (for example **Nandi Plumbing Works**) and tap **Add to cart**.
- [ ] Expect the "Start a new cart?" dialog. Tap **Keep my cart** and confirm the bakery cart is unchanged.
- [ ] Tap **Add to cart** again and choose **Start new cart**. Expect the plumber item in the cart and the bakery items gone.

### 5. Logged-out redirect with next
- [ ] Sign out of the customer account, add a bakery item again, then open `/cart`.
- [ ] Tap **Log in to place order**.
- [ ] Expect the login page with `?next=/cart`. Log in as the customer and expect to land back on the cart.

### 6. Place an order
- [ ] Enter the customer name and phone. Tap **Place order**.
- [ ] Expect the redirect to `/orders?placed=1`, the "Order sent" note, and a new order at the top with the timeline on **Order placed**.
- [ ] Expect the seeded orders below it in accepted, ready and completed states.

### 7. Shop updates the status
- [ ] In the second browser, open the shop account → **Profile** → **My shop** → **Orders**.
- [ ] Expect the new order at the top with the customer name and phone.
- [ ] Change the status to **accepted**. Expect the customer order screen to move to **Accepted** by itself within a few seconds (realtime), or within 15 seconds (polling fallback).
- [ ] Change it to **ready**, then **completed**. Expect the customer timeline to follow each change.
- [ ] If realtime does not move, check that `orders` and `need_responses` are in the `supabase_realtime` publication. The 15-second poll still updates the screen.

### 8. Rate a completed order
- [ ] On the customer completed order, expect the "How was it?" rating box.
- [ ] Tap 5 stars and **Submit rating**. Expect "You rated this 5 out of 5. Thank you!"
- [ ] Open the shop page again and expect the rating count and average to include the new review.

### 9. Map with and without location
- [ ] Open `/map`. Expect the map centred on Indiranagar, Bengaluru, with pins across the seeded areas and the category chips.
- [ ] Tap **Find me** and deny location permission. Expect the message "Location is off or denied. The map still works; turn on location to see distances." Pins must still be visible.
- [ ] Tap a pin. Expect the shop card with category, verified state, **Call** and **Open shop**.
- [ ] Tap **Find me** again and allow location. Expect a dark dot for you and a distance on the selected shop card.

### 10. Quick need and shop reply
- [ ] As the customer, tap the plus button on the home page.
- [ ] Step 1: choose **Plumbing**. Step 2: type "Kitchen tap under the sink is leaking. Need someone this evening." Step 3: budget `350`, timing **Today**, then send.
- [ ] Expect `/needs?posted=1` with the new open need.
- [ ] In the shop browser, open the shop dashboard. The demo shop account owns 3 shops, so use the **Managing shop** dropdown and pick **Nandi Plumbing Works**.
- [ ] Open **Requests**. Expect the plumbing need. (The bakery's Requests tab shows the Friday cake need instead.)
- [ ] Reply with price `299` and "I can come by 6 pm today." Expect "reply sent".
- [ ] Back on the customer's **My needs**, expect the reply with the shop name, ₹299 and a **Call** button. Expect the seeded bakery and taxi needs and the seeded plumbing reply too.

### 11. Admin verification
- [ ] Sign in as the admin on a third tab (or temporarily sign out the shop and sign in as admin).
- [ ] Open `/profile` → **Admin**. Expect the list of shops with Verify buttons.
- [ ] Verify an unverified shop, for example **Loop by Loop** or another unverified shop.
- [ ] Expect the button to change to **Remove badge**, and the badge to appear on the home page and shop page after a reload.
- [ ] Open `/admin` as the shop account and expect "Admins only."

### 12. Role switch
- [ ] As the customer, open `/profile` → **Switch to seller mode and open a shop**.
- [ ] Expect the dashboard. Return to Profile and switch back to buyer mode.
- [ ] As a shop with shops, the switch must never allow the admin role.

### 13. AI fallback without a key
- [ ] In the shop dashboard, open **Items and services**, choose a photo, and tap **Fill name, price and description with AI**.
- [ ] Without `ANTHROPIC_API_KEY`, expect "AI is not set up. Add ANTHROPIC_API_KEY, or type the details yourself." The manual fields must still work.
- [ ] Add item manually with a name, price and description. Expect it on the public shop page immediately.

### 14. Log out and protected pages
- [ ] Log out. Open `/orders`, `/needs`, `/cart`, `/dashboard` and `/profile`.
- [ ] Expect each page to show a log-in link with the correct `?next=` path, and no private data flash.

## Final 10-step demo path to rehearse (two minutes)

1. Home: "The baker next door is invisible online." Show the Bangalore shops and verified-first order.
2. Tap Cakes and bakery, open Nandini's Cake Studio, show items, prices and rating.
3. Add two items and show the one-shop cart.
4. Place the order as the customer and show the **Order placed** timeline.
5. On the shop account, set the order to **accepted**, then **ready**. The customer screen moves by itself.
6. Set it to **completed** and give a 5-star rating. Show the rating on the shop page.
7. Open the map, deny location once, then allow it to show Shops around you.
8. Post a quick need for a leaking tap, then reply as the plumbing shop with ₹299.
9. Show the customer's reply with the Call button.
10. As admin, verify one unverified shop and show the badge everywhere. Close with the impact: a shop live in 2 minutes and an order in 3 taps.

## Troubleshooting

| Symptom | Check |
|---|---|
| Home page is empty | Run `demo-bangalore.sql`; check the Supabase URL and anon key in the environment. |
| Demo shop account owns nothing | The email in `demo-bangalore.sql` must match the signed-up shop account; run the file again after signing up. |
| Customer has no seeded orders | The customer email must match; run the demo file again after signing up. |
| Verified shops show without a badge | Run the latest `schema.sql` or `demo-bangalore.sql` (it updates the `protect_verified` trigger). |
| Admin page says "Admins only" | Run the admin SQL for the signed-in email, then reload the app. |
| Shop cannot see a need | The shop category and the need category must match. |
| Order status does not move by itself | Confirm the realtime publication contains `orders`; the 15-second polling fallback still works. |
| Photo upload fails | Confirm the `images` storage bucket exists and signed-in uploads are allowed. |
| Location is denied | The map still shows pins; allow location in Safari settings and tap **Find me** again. |
| AI button fails | That is expected without `ANTHROPIC_API_KEY`; type the item details manually. |
