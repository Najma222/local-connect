'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { catOf, rupee } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import Dialog from '@/components/Dialog';
import { Loading, Empty, ErrorState, Spinner } from '@/components/States';
import { refreshBadges } from '@/lib/useBadges';
import PushToggle from '@/components/PushToggle';

const CHIP = { open: 'Open', booked: 'Booked', closed: 'Closed' };

function List() {
  const { user, ready, profile } = useApp();
  const posted = useSearchParams().get('posted');
  const toast = useToast();
  const [needs, setNeeds] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [closing, setClosing] = useState(null);
  const [askClose, setAskClose] = useState(null);
  const [pick, setPick] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [aerr, setAerr] = useState('');

  const load = useCallback(() => supabase.from('needs').select('*, need_responses(*, shops(id, name, phone, verified))')
    .eq('customer_id', user.id).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) { setLoadErr(error.message || 'Could not load your needs.'); return setNeeds((x) => x || []); }
      setLoadErr(''); setNeeds(data || []);
    }), [user]);
  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel('resp-' + user.id).on('postgres_changes', { event: '*', schema: 'public', table: 'need_responses' }, load).subscribe();
    const t = setInterval(load, 10000);
    return () => { clearInterval(t); supabase.removeChannel(ch); };
  }, [user, load]);
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem('lc-contact') || 'null'); if (s) { setName(s.name || ''); setPhone(s.phone || ''); } } catch {} }, []);
  useEffect(() => { if (profile?.full_name && !name) setName(profile.full_name); }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = async (id) => {
    if (closing) return;
    setClosing(id); setAskClose(null);
    const { error } = await supabase.from('needs').update({ status: 'closed' }).eq('id', id);
    setClosing(null);
    if (error) toast('Could not close this need. Please try again.', 'error'); else toast('Need closed');
    load(); refreshBadges();
  };
  const accept = async (e) => {
    e.preventDefault();
    if (accepting) return;
    if (name.trim().length < 2 || phone.trim().length < 8) return setAerr('Add your name and a phone number so the shop can call you.');
    setAccepting(true); setAerr('');
    const { error } = await supabase.rpc('accept_response', { rid: pick.reply.id, cname: name.trim(), cphone: phone.trim() });
    setAccepting(false);
    if (error) return setAerr(error.message);
    try { localStorage.setItem('lc-contact', JSON.stringify({ name: name.trim(), phone: phone.trim() })); } catch {}
    toast(`Accepted! ${pick.reply.shops?.name} will call you.`);
    setPick(null); load(); refreshBadges();
  };
  if (ready && !user) return <Empty action={<Link href="/login?next=/needs" className="btn">Log in</Link>}>Log in to see your needs.</Empty>;

  return (
    <>
      <p className="mt-5 text-sm text-ink/70">Ask your neighbours</p>
      <div className="flex flex-wrap items-end justify-between gap-2"><h1 className="mt-1">My <b>needs</b></h1><Link href="/need" className="btn btn-accent btn-sm mb-1">Post a need</Link></div>
      {posted && <p className="hand mt-3 -rotate-1 text-2xl text-moss" role="status">Sent! Replies will show up here, live.</p>}
      <PushToggle className="mt-4" />
      {needs === null ? <Loading label="Loading your needs…" rows={2} /> : loadErr && !needs.length ? <ErrorState message={`We could not load your needs. ${loadErr}`} onRetry={load} /> : needs.length === 0 ? (
        <Empty action={<Link href="/need" className="btn btn-sm">Post a need</Link>}>Nothing posted yet. Tell nearby shops what you need and compare their prices.</Empty>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {needs.map((n) => {
            const c = catOf(n.category);
            const replies = [...n.need_responses].sort((a, b) => (a.status === 'accepted' ? -1 : b.status === 'accepted' ? 1 : (a.price ?? 1e12) - (b.price ?? 1e12)));
            const lowest = Math.min(...n.need_responses.filter((r) => r.price != null).map((r) => Number(r.price)));
            return (
              <article key={n.id} className="min-w-0 rounded-[28px] p-5" style={{ background: c.bg, color: c.fg }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-sm">{n.category === 'other' ? `Custom · ${n.custom_label || 'Something else'}` : c.label} · {n.when_text}{n.budget ? ` · up to ${rupee(n.budget)}` : ''}</p>
                    <p className="mt-1 break-words text-lg font-semibold leading-snug">{n.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-ink">{CHIP[n.status] || n.status}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {replies.length === 0 && <p className="hand text-lg">{n.status === 'open' ? 'waiting for replies…' : 'no replies'}</p>}
                  {replies.length > 0 && <p className="text-sm font-semibold">{replies.length} repl{replies.length > 1 ? 'ies' : 'y'}{n.status === 'open' ? '. Pick one to book.' : ''}</p>}
                  {replies.map((r) => {
                    const acc = r.status === 'accepted', dec = r.status === 'declined';
                    return (
                      <div key={r.id} className={`rounded-2xl bg-white p-3 text-ink ${acc ? 'ring-2 ring-[#2E9E5B]' : ''} ${dec ? 'opacity-60' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/shop/${r.shops?.id}`} className="tap min-w-0 justify-start break-words font-semibold underline">{r.shops?.name}</Link>
                          <span className="flex shrink-0 items-center gap-2">
                            {r.price != null && Number(r.price) === lowest && n.need_responses.length > 1 && !dec && <span className="badge">Lowest</span>}
                            {r.price != null && <b>{rupee(r.price)}</b>}
                          </span>
                        </div>
                        {r.message && <p className="mt-1 break-words text-sm">{r.message}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {acc && <span className="badge">✓ Accepted</span>}
                          {dec && <span className="text-xs font-semibold text-ink/70">Not chosen</span>}
                          {r.shops?.phone && !dec && <a href={`tel:${r.shops.phone}`} className="btn btn-ghost btn-sm">Call</a>}
                          {n.status === 'open' && !dec && <button type="button" className="btn btn-accent btn-sm" onClick={() => { setAerr(''); setPick({ need: n, reply: r }); }}>Accept</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {n.status === 'open' && <button onClick={() => setAskClose(n)} disabled={closing === n.id} className="tap mt-2 gap-2 px-1 text-sm underline">{closing === n.id && <Spinner />}Close this need</button>}
              </article>
            );
          })}
        </div>
      )}
      {askClose && (
        <Dialog title="Close this need?" onClose={() => setAskClose(null)}>
          <p className="mt-2 text-sm text-ink/80">Shops will stop seeing it and you cannot reopen it. Post a new need if you change your mind.</p>
          <div className="mt-5 flex gap-2">
            <button type="button" className="btn btn-ghost flex-1" data-autofocus onClick={() => setAskClose(null)}>Keep it open</button>
            <button type="button" className="btn flex-1" onClick={() => close(askClose.id)}>Close need</button>
          </div>
        </Dialog>
      )}
      {pick && (
        <Dialog title={`Accept ${pick.reply.shops?.name}?`} onClose={() => setPick(null)}>
          <form onSubmit={accept}>
            <p className="mt-2 text-sm text-ink/80">{pick.reply.price != null ? `${rupee(pick.reply.price)}. ` : ''}Your name and number are shared only with this shop, so they can call you. Other replies are closed.</p>
            <div className="mt-4 space-y-3">
              <input className="field" placeholder="Your name" aria-label="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} data-autofocus />
              <input className="field" placeholder="Phone number" aria-label="Phone number" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {aerr && <p className="mt-3 break-words text-sm text-tomato" role="alert">{aerr}</p>}
            <div className="mt-5 flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setPick(null)}>Not now</button>
              <button className="btn flex-1" disabled={accepting}>{accepting && <Spinner />}Accept and share</button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
export default function NeedsPage() { return <Suspense><List /></Suspense>; }
