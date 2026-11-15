'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { rupee, STEPS } from '@/lib/constants';

function Timeline({ status }) {
  if (status === 'cancelled') return <p className="rounded-2xl bg-[#F6D9D2] p-3 text-sm font-semibold text-[#7A2410]">This order was cancelled by the shop. Call them to sort it out.</p>;
  const at = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="mt-1">
      {STEPS.map((s, i) => {
        const done = i < at || status === 'completed';
        const now = i === at && status !== 'completed';
        return (
          <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
            {i < STEPS.length - 1 && <span className={`absolute left-[13px] top-8 h-[calc(100%-22px)] w-0.5 ${done ? 'bg-[#8E9A5B]' : 'bg-line'}`} />}
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done ? 'bg-[#8E9A5B]' : now ? 'bg-[#E29079]' : 'bg-white ring-2 ring-line'}`}>
              {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg> : now ? <i className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
            </span>
            <div>
              <p className={`text-base ${now || done ? 'font-semibold' : 'text-ink/50'}`}>{s.title}</p>
              <p className="text-sm text-ink/60">{s.sub}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Rate({ order, review, onDone }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (review) return <p className="hand mt-3 text-xl text-moss">You rated this {review.rating} out of 5. Thank you!</p>;
  const send = async () => {
    if (!stars) return setErr('Tap a star first.');
    setBusy(true); setErr('');
    const { data, error } = await supabase.from('reviews').insert({ order_id: order.id, shop_id: order.shop_id, customer_id: order.customer_id, rating: stars, comment: comment || null }).select().single();
    setBusy(false);
    if (error) return setErr(error.message);
    onDone(data);
  };
  return (
    <div className="mt-4 rounded-2xl bg-soft p-4">
      <p className="font-semibold">How was it?</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setStars(n)} className={`h-11 w-11 text-3xl leading-none ${n <= stars ? 'text-[#E0A800]' : 'text-ink/25'}`}>★</button>)}
      </div>
      <input className="field mt-2" placeholder="Say something nice (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      {err && <p className="mt-2 text-sm text-tomato" role="alert">{err}</p>}
      <button className="btn mt-3 w-full" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Submit rating'}</button>
    </div>
  );
}

function List() {
  const { user, ready } = useApp();
  const placed = useSearchParams().get('placed');
  const [orders, setOrders] = useState(null);
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    if (!user) return;
    const load = () => supabase.from('orders').select('*, shops(name, phone), order_items(*)').eq('customer_id', user.id)
      .order('created_at', { ascending: false }).then(async ({ data }) => { setOrders(data || []); const { data: rv } = await supabase.from('reviews').select('*').eq('customer_id', user.id); setReviews(Object.fromEntries((rv || []).map((x) => [x.order_id, x]))); });
    load();
    const ch = supabase.channel('orders-' + user.id).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` }, load).subscribe();
    const t = setInterval(load, 15000); // fallback if realtime drops
    return () => { clearInterval(t); supabase.removeChannel(ch); };
  }, [user]);

  if (ready && !user) return <p className="mt-8"><Link href="/login?next=/orders" className="underline">Log in</Link> to track your orders.</p>;
  return (
    <>
      <p className="mt-5 text-sm text-ink/60">Track order</p>
      <h1 className="mt-1">My <b>orders</b></h1>
      {placed && <p className="hand mt-3 -rotate-1 text-2xl text-moss">Order sent! The shop will say yes shortly.</p>}
      {orders === null ? <p className="mt-6">Loading…</p> : orders.length === 0 ? (
        <p className="mt-6 rounded-[28px] bg-white p-8 text-center">No orders yet. <Link href="/" className="underline">Browse shops</Link></p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {orders.map((o) => (
            <article key={o.id} className="rounded-[28px] bg-white p-5 shadow-[0_8px_28px_rgba(80,60,60,0.08)]">
              <div className="flex items-start justify-between gap-2">
                <div><h2 className="text-xl font-semibold">{o.shops?.name}</h2><p className="text-xs text-ink/50">{new Date(o.created_at).toLocaleString()}</p></div>
                {o.shops?.phone && <a href={`tel:${o.shops.phone}`} className="btn btn-accent h-10 px-4 text-sm">Call</a>}
              </div>
              <div className="my-4"><Timeline status={o.status} /></div>
              <div className="rounded-2xl bg-[#EEDCD3] p-4 text-sm">
                {o.order_items.map((i) => <p key={i.id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{rupee(i.qty * i.price)}</span></p>)}
                <p className="mt-2 flex justify-between border-t border-dashed border-[#B99C8F] pt-2 text-lg font-bold"><span>Total</span><span>{rupee(o.total)}</span></p>
              </div>
              {o.status === 'completed' && <Rate order={o} review={reviews[o.id]} onDone={(r) => setReviews((x) => ({ ...x, [o.id]: r }))} />}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
export default function OrdersPage() { return <Suspense><List /></Suspense>; }
