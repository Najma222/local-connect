import { timingSafeEqual } from 'crypto';
import webpush from 'web-push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Called only by the Supabase triggers in supabase/update-v5-push.sql (pg_net), with a shared secret.
// The database sends the target devices, so this route needs no database key.
const ok = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function POST(req) {
  const { VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, PUSH_WEBHOOK_SECRET, VAPID_SUBJECT } = process.env;
  if (!VAPID_PRIVATE_KEY || !NEXT_PUBLIC_VAPID_PUBLIC_KEY || !PUSH_WEBHOOK_SECRET) return Response.json({ error: 'Push is not configured' }, { status: 503 });
  if (!ok(req.headers.get('x-push-secret'), PUSH_WEBHOOK_SECRET)) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let p;
  try { p = await req.json(); } catch { return Response.json({ error: 'Bad JSON' }, { status: 400 }); }
  const subs = Array.isArray(p.subs) ? p.subs.slice(0, 200) : [];
  if (!subs.length) return Response.json({ sent: 0 });

  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:push@local-connect.app', NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  const payload = JSON.stringify({
    title: String(p.title || 'Local Connect').slice(0, 80),
    body: String(p.body || '').slice(0, 180),
    url: typeof p.url === 'string' && p.url.startsWith('/') ? p.url : '/',
    tag: p.tag ? String(p.tag).slice(0, 64) : undefined,
  });

  const results = await Promise.allSettled(subs.map((s) =>
    webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600, urgency: 'high' })));
  const gone = results.map((r, i) => (r.status === 'rejected' && [404, 410].includes(r.reason?.statusCode) ? subs[i].endpoint : null)).filter(Boolean);
  return Response.json({ sent: results.filter((r) => r.status === 'fulfilled').length, gone });
}
