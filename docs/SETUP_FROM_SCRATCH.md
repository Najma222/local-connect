# Local Connect: start from scratch

Everything you need to go from "no Supabase project" to a working phone demo. Follow this in order. Commands are for Windows PowerShell unless noted.

## 0. What you need first

- A free account at https://supabase.com
- A free account at https://github.com
- A free account at https://vercel.com
- Node.js installed (you already have it)
- This project folder: `C:\Users\Admin\Downloads\local-connect`

You do **not** need Docker, a Mac, or an Android phone.

## 1. Create the Supabase project

1. Go to https://supabase.com/dashboard and click **New project**.
2. Pick an organisation, a project name (for example `local-connect`), and a strong database password. Save the password somewhere safe.
3. Choose the region closest to Bengaluru, for example **South Asia (Mumbai) ap-south-1**, if it is available.
4. Wait 1 to 2 minutes for the project to finish provisioning.
5. Open **Project Settings -> API** and copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key
6. Keep this tab open; you will paste both values into `.env.local` later.

## 2. Run the SQL files in this exact order

In the Supabase dashboard open **SQL Editor -> New query**. Paste the whole contents of a file, click **Run**, wait for success, then repeat with the next file.

1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/update-v2.sql`
4. `supabase/demo-bangalore.sql` (run this after step 4 below, when the two accounts exist)

The first three files create the tables, Row Level Security, storage bucket, quick needs, ratings and realtime. The last one adds the Bangalore demo shops, orders and needs.

If `schema.sql` fails because objects already exist, you are running it on an old project. For a clean demo, create a fresh Supabase project and start again from file 1.

## 3. Turn off email confirmation

1. In Supabase, open **Authentication -> Providers -> Email**.
2. Turn **Confirm email** off.
3. Save.

This lets the two demo accounts sign in immediately.

## 4. Create `.env.local` and start the app locally

In PowerShell, from the project folder:

```powershell
cd C:\Users\Admin\Downloads\local-connect
Copy-Item .env.example .env.local
notepad .env.local
```

Fill it in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
# Optional. Leave blank to test the friendly AI fallback.
ANTHROPIC_API_KEY=
```

Then install and run:

```powershell
npm install
npm run dev
```

Open http://localhost:3000. The home page will look empty until the demo SQL runs, which is expected.

## 5. Create the two demo accounts

Use the running app at http://localhost:3000/login.

| Account | Sign-up choice | Email to use |
|---|---|---|
| Shop account | **I run a shop** | Your shop email, for example `yourname+shop@gmail.com` |
| Customer account | **I want to buy** | Your customer email, for example `yourname+customer@gmail.com` |

With **Confirm email** off, these do not need to receive mail, but they must be valid email formats. Remember both passwords.

After both accounts exist, sign out and sign back in as the customer when you test the customer flow.

## 6. Add the Bangalore demo data

1. Open `supabase/demo-bangalore.sql`.
2. Near the top, replace these two placeholders with the exact emails you used above:

```sql
'demo.shop@localconnect.test',      -- DEMO_SHOP_EMAIL
'demo.customer@localconnect.test'   -- DEMO_CUSTOMER_EMAIL
```

3. Save the file.
4. In Supabase **SQL Editor**, open a new query, paste the whole updated file, and click **Run** once. Run the whole file in one go, because it uses a temporary config table.

This is safe to run again later. It deletes and re-inserts only the fixed demo rows, which is useful if you break the demo while rehearsing.

Verify it worked in the SQL Editor:

```sql
select category, count(*) from shops group by category order by category;
select verified, count(*) from shops group by verified;
select count(*) as products from products;
select status, count(*) from orders group by status;
select count(*) as needs from needs;
select count(*) as replies from need_responses;
select count(*) as reviews from reviews;
```

Expected with both accounts created:

- 18 shops, 2 per category, 12 verified and 6 unverified
- 70 products
- 4 orders: one each in `new`, `accepted`, `ready`, `completed`
- 3 needs, 1 reply, 1 review

If the orders/needs are missing, the customer email did not match. Fix the email in the demo file and run it again.

## 7. Make yourself admin

Sign up or log in in the app with your admin email, then run this in the SQL Editor (replace the email):

```sql
insert into public.profiles (id, full_name, role)
select id, coalesce(raw_user_meta_data->>'full_name', 'Admin'), 'admin'
from auth.users
where email = 'YOUR-ADMIN-EMAIL'
on conflict (id) do update set role = 'admin';
```

Reload the app. Open **Profile**. You will see **Admin -> Verify shops**. Only admins can set the verified badge.

Use a third email for admin if possible, so the shop account stays a shop account.

## 8. Create a new git repository

Important: this project currently sits inside `C:\Users\Admin`, which is itself a git repository. Create a **new, independent** repository inside the project folder so your commits are clean.

```powershell
cd C:\Users\Admin\Downloads\local-connect
git init
git status
```

`git status` should now list only this project's files, not your whole home folder. If it still lists a huge home directory, the `git init` did not run in this folder; check `pwd` and try again.

Check that secrets are ignored (`.gitignore` already covers `.env.local`, `.next` and `node_modules`):

```powershell
git check-ignore .env.local
git check-ignore node_modules
git check-ignore .next
```

Then make the first commit:

```powershell
git add .
git status
git commit -m "Local Connect: Bangalore hackathon build"
```

Review `git status` before committing. You should not see `.env.local`, `.next` or `node_modules`.

### Push to GitHub

Create an empty public repository on GitHub named `local-connect` (do not add a README there), then:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/local-connect.git
git push -u origin main
```

If you have the GitHub CLI installed, this is one command:

```powershell
gh repo create local-connect --public --source=. --remote=origin --push
```

Never commit `.env.local` or any API key. If you ever do, rotate the key in Supabase / Anthropic immediately.

## 9. Deploy to Vercel

1. Go to https://vercel.com/new and import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected).
3. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` (optional)
4. Click **Deploy**.
5. Open the deployed URL on your phone and log in with the same accounts. The Supabase project is unchanged, so the demo data is already there.
6. If you created the admin account after deploying, run the admin SQL from step 7 again for that email.

## 10. Test on the iPhone

1. Open the Vercel URL in **Safari**.
2. Tap **Share -> Add to Home Screen**. It opens full screen like an app.
3. Keep the customer on Safari and the shop account in a private tab or a second browser, so you can watch order status move while both stay signed in.
4. Follow `docs/DEMO_CHECKLIST.md` click by click. It covers the full customer, shop, map, needs, rating and admin flow with expected results.

## 11. If something breaks

| Symptom | Fix |
|---|---|
| Home page is empty | The demo SQL has not run, or the Supabase URL/anon key in `.env.local` is wrong. |
| Demo shop owns nothing | `DEMO_SHOP_EMAIL` must exactly match the signed-up shop account. Edit the demo file and run it again. |
| No demo orders | `DEMO_CUSTOMER_EMAIL` must exactly match the signed-up customer account. |
| Admin page says "Admins only" | Run the admin SQL for the signed-in email, then reload the app. |
| Verification badge does not appear | Run the latest `schema.sql` or `demo-bangalore.sql`; both fix the `protect_verified` trigger. |
| Order status does not move by itself | Realtime may not be enabled. Re-run `update-v2.sql`; the page also refreshes every 15 seconds. |
| Photo upload fails | Re-run `schema.sql` on a fresh project, or check the `images` bucket and its signed-in upload policy. |
| Location denied | The map still works and shows pins. Allow location in Safari and tap **Find me** again. |
| AI button fails | Expected without `ANTHROPIC_API_KEY`. Type the item details manually. |
| SQL Editor says a policy/table already exists | You are re-running a file that is not idempotent on an old project. Use a fresh project, or run only `demo-bangalore.sql`, which is safe to repeat. |

## 12. Reset the demo before judging

Run `supabase/demo-bangalore.sql` again. It removes and recreates only the fixed demo shops, products, orders, review, needs and reply. Real accounts and their passwords are untouched.

Do not reset the database by deleting the whole project close to judging time.

## 13. Final safety check

- [ ] `.env.local` is not committed.
- [ ] No API keys appear in the repo.
- [ ] Both demo accounts can sign in on the deployed URL.
- [ ] `demo-bangalore.sql` ran after both accounts existed.
- [ ] Admin SQL ran for the admin account and the Admin page is visible.
- [ ] The full `docs/DEMO_CHECKLIST.md` rehearsal passes on the phone.
