'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { rupee, STEPS } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import { Loading, Empty, ErrorState, Spinner } from '@/components/States';

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
              <p className={`text-base ${now || done ? 'font-semibold' : 'text-ink/70'}`}>{s.title}</p>
              <p className="text-sm text-ink/70">{s.sub}</p>
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
  const toast = useToast();
  const onKey = (e) => {
    const k = e.key;
    const next = k === 'ArrowRight' || k === 'ArrowUp' ? Math.min(5, (stars || 0) + 1) : k === 'ArrowLeft' || k === 'ArrowDown' ? Math.max(1, (stars || 2) - 1) : k === 'Home' ? 1 : k === 'End' ? 5 : 0;
    if (!next) return;
    e.preventDefault();
    setStars(next);
    e.currentTarget.querySelector(`[data-star="${next}"]`)?.focus();
  };
  if (review) return <p className="hand mt-3 text-xl text-moss">You rated this {review.rating} out of 5. Thank you!</p>;
  const send = async () => {
    if (busy) return;
    if (!stars) return setErr('Tap a star first.');
    setBusy(true); setErr('');
    const { data, error } = await supabase.from('reviews').insert({ order_id: order.id, shop_id: order.shop_id, customer_id: order.customer_id, rating: stars, comment: comment || null }).select().single();
    setBusy(false);
    if (error) { toast('Could not save your rating.', 'error'); return setErr(error.message); }
    toast('Thanks for rating!');
    onDone(data);
  };
  return (
    <div className="mt-4 rounded-2xl bg-soft p-4">
      <p className="font-semibold">How was it?</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating" onKeyDown={onKey}>
        {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} data-star={n} role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} tabIndex={stars === n || (!stars && n === 1) ? 0 : -1} onClick={() => setStars(n)} className={`h-11 w-11 rounded-full text-3xl leading-none ${n <= stars ? 'text-[#A16207]' : 'text-ink/50'}`}>{n <= stars ? '★' : '☆'}</button>)}
      </div>
      <input className="field mt-2" placeholder="Say something nice (optional)" aria-label="Comment (optional)" autoComplete="off" value={comment} onChange={(e) => setComment(e.target.value)} />
      {err && <p className="mt-2 text-sm text-tomato" role="alert">{err}</p>}
      <button type="button" className="btn mt-3 w-full" disabled={busy} onClick={send}>{busy && <Spinner />}{busy ? 'Sending…' : 'Submit rating'}</button>
    </div>
  );
}

function List() {
  const { user, ready } = useApp();
  const placed = useSearchParams().get('placed');
  const [orders, setOrders] = useState(null);
  const [reviews, setReviews] = useState({});
  const [loadErr, setLoadErr] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = () => supabase.from('orders').select('*, shops(name, phone), order_items(*)').eq('customer_id', user.id)
      .order('created_at', { ascending: false }).then(async ({ data, error }) => { if (error) { setLoadErr(error.message || 'Could not load orders.'); return setOrders((x) => x || []); } setLoadErr(''); setOrders(data || []); const { data: rv } = await supabase.from('reviews').select('*').eq('customer_id', user.id); setReviews(Object.fromEntries((rv || []).map((x) => [x.order_id, x]))); });
    load();
    const ch = supabase.channel('orders-' + user.id).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` }, load).subscribe();
    const t = setInterval(load, 15000); // fallback if realtime drops
    return () => { clearInterval(t); supabase.removeChannel(ch); };
  }, [user, tick]);

  if (ready && !user) return <Empty action={<Link href="/login?next=/orders" className="btn">Log in</Link>}>Log in to track your orders.</Empty>;
  return (
    <>
      <p className="mt-5 text-sm text-ink/70">Track order</p>
      <h1 className="mt-1">My <b>orders</b></h1>
      {placed && <p className="hand mt-3 -rotate-1 text-2xl text-moss" role="status">Order sent! The shop will say yes shortly.</p>}
      {orders === null ? <Loading label="Loading your orders…" rows={2} /> : loadErr ? <ErrorState message={`We could not load your orders. ${loadErr}`} onRetry={() => { setOrders(null); setTick((t) => t + 1); }} /> : orders.length === 0 ? (
        <Empty action={<Link href="/" className="btn btn-sm">Browse shops</Link>}>No orders yet. Find something nearby and it will show up here.</Empty>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => (
            <article key={o.id} className="card-shadow min-w-0 rounded-[28px] bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><h2 className="line-clamp-2 break-words text-xl font-semibold">{o.shops?.name}</h2><p className="text-xs text-ink/70">{new Date(o.created_at).toLocaleString()}</p></div>
                {o.shops?.phone && <a href={`tel:${o.shops.phone}`} className="btn btn-accent btn-sm shrink-0">Call</a>}
              </div>
              <div className="my-4"><Timeline status={o.status} /></div>
              <div className="rounded-2xl bg-[#EEDCD3] p-4 text-sm">
                {o.order_items.map((i) => <p key={i.id} className="flex justify-between gap-3"><span className="min-w-0 break-words">{i.qty} × {i.name}</span><span className="shrink-0">{rupee(i.qty * i.price)}</span></p>)}
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
