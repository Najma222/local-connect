'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { rupee, STEPS, STATUS_LINE, fmtTime } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import Dialog from '@/components/Dialog';
import { Loading, Empty, ErrorState, Spinner } from '@/components/States';

const ACTIVE = ['new', 'accepted', 'ready'];

function Stepper({ order }) {
  const st = order.status;
  if (st === 'cancelled') return <p className="rounded-2xl bg-[#F6D9D2] p-3 text-sm font-semibold text-[#7A2410]">Cancelled. Call the shop if this is a surprise.</p>;
  const at = STEPS.findIndex((s) => s.key === st);
  const times = order.status_times || {};
  return (
    <ol className="grid grid-cols-4" aria-label="Order progress">
      {STEPS.map((s, i) => {
        const done = i < at || st === 'completed';
        const now = i === at && st !== 'completed';
        return (
          <li key={s.key} className="relative flex min-w-0 flex-col items-center text-center" aria-current={now ? 'step' : undefined}>
            {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-[13px] h-0.5 w-full ${i <= at || st === 'completed' ? 'bg-[#8E9A5B]' : 'bg-line'}`} />}
            <span className={`relative flex h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-[#8E9A5B]' : now ? 'pulse-ring bg-[#E29079]' : 'bg-white ring-2 ring-line'}`}>
              {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg> : now ? <i className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
            </span>
            <span className={`mt-1.5 text-xs leading-tight ${now || done ? 'font-semibold' : 'text-ink/70'}`}>{s.short}</span>
            <span className="min-h-[14px] text-[11px] text-ink/70">{times[s.key] ? fmtTime(times[s.key]) : ''}</span>
            <span className="sr-only">{done ? 'done' : now ? 'current step' : 'not yet'}</span>
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

function OrderCard({ o, review, onReview, onCancel, highlight }) {
  const active = ACTIVE.includes(o.status);
  const ref = useRef(null);
  useEffect(() => { if (highlight) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [highlight]);
  return (
    <article ref={ref} className={`card-shadow min-w-0 rounded-[28px] bg-white p-5 ${highlight ? 'ring-2 ring-ink' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="line-clamp-2 break-words text-xl font-semibold">{o.shops?.name}</h2>
          <p className="text-xs text-ink/70">Ordered {new Date(o.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {rupee(o.total)}</p>
        </div>
        {active && <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#E3F6EA] px-2.5 py-1 text-xs font-semibold text-[#0B6B33]"><i className="h-2 w-2 rounded-full bg-[#2E9E5B]" />Live</span>}
      </div>
      <p className={`mt-3 text-base font-semibold leading-snug ${o.status === 'cancelled' ? 'text-[#7A2410]' : ''}`} role="status">{STATUS_LINE[o.status]}</p>
      <div className="mt-4"><Stepper order={o} /></div>
      <details className="mt-4 rounded-2xl bg-[#EEDCD3] p-4 text-sm">
        <summary className="tap cursor-pointer justify-between font-semibold">Order details<span className="font-normal">{o.order_items.length} item{o.order_items.length > 1 ? 's' : ''}</span></summary>
        <div className="mt-2">
          {o.order_items.map((i) => <p key={i.id} className="flex justify-between gap-3"><span className="min-w-0 break-words">{i.qty} × {i.name}</span><span className="shrink-0">{rupee(i.qty * i.price)}</span></p>)}
          {o.note && <p className="mt-2 break-words italic">“{o.note}”</p>}
          <p className="mt-2 flex justify-between border-t border-dashed border-[#B99C8F] pt-2 text-lg font-bold"><span>Total</span><span>{rupee(o.total)}</span></p>
        </div>
      </details>
      {(active || o.status === 'new') && (
        <div className="mt-3 flex flex-wrap gap-2">
          {o.shops?.phone && <a href={`tel:${o.shops.phone}`} className="btn btn-accent btn-sm">Call shop</a>}
          {o.shops?.whatsapp && <a href={`https://wa.me/${o.shops.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">WhatsApp</a>}
          {o.status === 'new' && <button type="button" onClick={() => onCancel(o)} className="tap px-2 text-sm text-tomato underline">Cancel order</button>}
        </div>
      )}
      {o.status === 'completed' && <Rate order={o} review={review} onDone={onReview} />}
    </article>
  );
}

function List() {
  const { user, ready } = useApp();
  const placed = useSearchParams().get('placed');
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [reviews, setReviews] = useState({});
  const [loadErr, setLoadErr] = useState('');
  const [tick, setTick] = useState(0);
  const [cancel, setCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const seen = useRef(null);

  useEffect(() => {
    if (!user) return;
    const load = () => supabase.from('orders').select('*, shops(name, phone, whatsapp), order_items(*)').eq('customer_id', user.id)
      .order('created_at', { ascending: false }).then(async ({ data, error }) => {
        if (error) { setLoadErr(error.message || 'Could not load orders.'); return setOrders((x) => x || []); }
        setLoadErr('');
        const next = Object.fromEntries((data || []).map((o) => [o.id, o.status]));
        if (seen.current) (data || []).forEach((o) => { if (seen.current[o.id] && seen.current[o.id] !== o.status) toast(`${o.shops?.name}: ${STATUS_LINE[o.status].replace(/\.$/, '')}`); });
        seen.current = next;
        setOrders(data || []);
        const { data: rv } = await supabase.from('reviews').select('*').eq('customer_id', user.id);
        setReviews(Object.fromEntries((rv || []).map((x) => [x.order_id, x])));
      });
    load();
    const ch = supabase.channel('orders-' + user.id).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` }, load).subscribe();
    const t = setInterval(load, 10000); // fallback if realtime drops
    return () => { clearInterval(t); supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tick]);

  const doCancel = async () => {
    setCancelling(true);
    // RLS turns a blocked update into 0 rows (no error), so check that a row actually changed.
    const { data, error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', cancel.id).eq('status', 'new').select('id');
    setCancelling(false);
    if (error || !data?.length) toast('Could not cancel. The shop has already accepted it, so please call them.', 'error'); else toast('Order cancelled');
    setCancel(null); setTick((t) => t + 1);
  };

  if (ready && !user) return <Empty action={<Link href="/login?next=/orders" className="btn">Log in</Link>}>Log in to track your orders.</Empty>;
  const active = (orders || []).filter((o) => ACTIVE.includes(o.status));
  const past = (orders || []).filter((o) => !ACTIVE.includes(o.status));
  const newest = placed && active[0]?.id;
  return (
    <>
      <p className="mt-5 text-sm text-ink/70">Track order</p>
      <h1 className="mt-1">My <b>orders</b></h1>
      {placed && <p className="hand mt-3 -rotate-1 text-2xl text-moss" role="status">Order sent! The shop will say yes shortly.</p>}
      {orders === null ? <Loading label="Loading your orders…" rows={2} /> : loadErr && !orders.length ? <ErrorState message={`We could not load your orders. ${loadErr}`} onRetry={() => { setOrders(null); setTick((t) => t + 1); }} /> : orders.length === 0 ? (
        <Empty action={<Link href="/" className="btn btn-sm">Browse shops</Link>}>No orders yet. Find something nearby and it will show up here.</Empty>
      ) : (
        <>
          {active.length > 0 && <h2 className="mb-3 mt-6 text-xl font-semibold">In progress</h2>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {active.map((o) => <OrderCard key={o.id} o={o} review={reviews[o.id]} highlight={o.id === newest} onCancel={setCancel} onReview={(r) => setReviews((x) => ({ ...x, [o.id]: r }))} />)}
          </div>
          {active.length === 0 && <Empty action={<Link href="/" className="btn btn-sm">Order something</Link>}>Nothing in progress right now.</Empty>}
          {past.length > 0 && <h2 className="mb-3 mt-8 text-xl font-semibold">Past orders</h2>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {past.map((o) => <OrderCard key={o.id} o={o} review={reviews[o.id]} onCancel={setCancel} onReview={(r) => setReviews((x) => ({ ...x, [o.id]: r }))} />)}
          </div>
        </>
      )}
      {cancel && (
        <Dialog title="Cancel this order?" onClose={() => setCancel(null)}>
          <p className="mt-2 text-sm text-ink/80">You can only cancel before the shop accepts it. {cancel.shops?.name} will see it as cancelled.</p>
          <div className="mt-5 flex gap-2">
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setCancel(null)}>Keep order</button>
            <button type="button" className="btn flex-1" disabled={cancelling} onClick={doCancel}>{cancelling && <Spinner />}Cancel order</button>
          </div>
        </Dialog>
      )}
    </>
  );
}
export default function OrdersPage() { return <Suspense><List /></Suspense>; }
