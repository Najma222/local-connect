'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/constants';
import { useApp } from '@/lib/app-context';
import ShopCard from '@/components/ShopCard';
import Doodle from '@/components/Doodle';
import Link from 'next/link';
import { Loading, Empty, ErrorState } from '@/components/States';
import { useBadges } from '@/lib/useBadges';

const EXAMPLES = [
  { label: 'Leaking tap tonight', cat: 'plumbing', text: 'Kitchen tap is leaking under the sink. Need someone this evening.' },
  { label: 'Cake for Friday', cat: 'bakery', text: 'Need an eggless cake for 10 people on Friday.' },
  { label: 'Airport drop, 5 am', cat: 'taxi', text: 'Need a cab to Kempegowda Airport at 5 am this Saturday.' },
  { label: '+ Something else', cat: 'other', text: '' },
];

export default function Home() {
  const { profile, user } = useApp();
  const badges = useBadges();
  const [shops, setShops] = useState(null);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');

  const [loadErr, setLoadErr] = useState('');
  const load = useCallback(() => {
    setLoadErr('');
    supabase.from('shops').select('*').order('verified', { ascending: false }).order('created_at', { ascending: false })
      .then(async ({ data, error }) => {
        if (error) { setShops((x) => x || []); return setLoadErr(error.message || 'Could not load shops.'); }
        const { data: r } = await supabase.from('shop_ratings').select('*');
        const m = Object.fromEntries((r || []).map((x) => [x.shop_id, x]));
        setShops((data || []).map((s) => ({ ...s, rating: m[s.id] })));
      });
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = (shops || []).filter(
    (s) => (cat === 'all' || s.category === cat) && (s.name + ' ' + (s.description || '')).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <p className="mt-5 truncate text-sm text-ink/70">Namaste{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} · Indiranagar, Bengaluru</p>
      <h1 className="mt-1 max-w-md sm:max-w-lg">What do you need <b>nearby</b> today?</h1>
      <p className="hand mt-2 max-w-prose -rotate-1 text-ink/70 leading-snug">Try a home baker in Indiranagar or an auto to Kempegowda Airport.</p>
      <label className="mt-5 flex min-h-[60px] max-w-xl items-center justify-between gap-2 rounded-full bg-soft py-1 pl-5 pr-2 focus-within:ring-2 focus-within:ring-ink">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Plum cake, plumber, auto to the airport…" aria-label="Search shops" type="search" enterKeyHint="search" autoComplete="off" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
        <span className="go bg-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M11 3a8 8 0 1 0 0 16 8 8 0 1 0 0-16zM21 21l-4.3-4.3" /></svg></span>
      </label>

      <section className="mt-6 overflow-hidden rounded-[32px] bg-ink p-5 text-white sm:p-7" aria-labelledby="ask-title">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="hand -rotate-1 text-[#EBD878]">free · takes 30 seconds</p>
            <h2 id="ask-title" className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">Can't find it? <b className="font-bold">Ask your neighbours.</b></h2>
            <p className="mt-2 max-w-md text-sm text-white/80">Post what you need. Nearby shops and helpers reply with a price. You accept one and they call you.</p>
          </div>
          <span className="hidden shrink-0 sm:block"><Doodle k="chat" blob="#EBD878" size={96} rotate={4} /></span>
        </div>
        <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          {['Post a need', 'Shops reply with a price', 'You accept, they call'].map((t, i) => (
            <li key={t} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 p-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EBD878] text-ink">{i + 1}</span>{t}</li>
          ))}
        </ol>
        <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1" role="group" aria-label="Quick examples">
          {EXAMPLES.map((e) => <Link key={e.label} href={`/need?cat=${e.cat}&text=${encodeURIComponent(e.text)}`} className="tap shrink-0 rounded-full bg-white/15 px-4 text-sm font-semibold">{e.label}</Link>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/need" className="btn btn-accent">Post a need</Link>
          {user && <Link href="/needs" className="btn btn-ghost !text-white !ring-white/60">{badges.replies > 0 ? `${badges.replies} need${badges.replies > 1 ? 's have' : ' has'} replies` : 'My needs'}</Link>}
          {profile?.role === 'shop' && badges.requests > 0 && <Link href="/dashboard?tab=requests" className="btn btn-ghost !text-white !ring-white/60">{badges.requests} open request{badges.requests > 1 ? 's' : ''}</Link>}
        </div>
      </section>

      <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {CATEGORIES.map((c, i) => {
          const on = cat === c.key;
          return (
            <button key={c.key} onClick={() => setCat(on ? 'all' : c.key)} aria-pressed={on}
              className="flex min-h-[136px] min-w-0 flex-col justify-between gap-2 overflow-hidden rounded-[28px] p-3.5 text-left transition active:scale-[0.97] sm:min-h-[150px] sm:p-4"
              style={{ background: c.bg, color: c.fg, boxShadow: on ? 'inset 0 0 0 3px #15141A' : 'none' }}>
              <span className="line-clamp-2 block break-words text-base font-semibold leading-tight">{c.label}</span>
              <span className="flex items-end justify-between gap-2">
                <span className="block h-16 w-16 shrink-0 sm:h-20 sm:w-20"><Doodle k={c.doodle} blob={c.blob} size="100%" rotate={i % 2 ? -4 : 3} /></span>
                <span className="go text-ink">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9" /></svg>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 mt-9 flex items-baseline justify-between gap-3">
        <h2 className="min-w-0 truncate text-2xl font-semibold">{cat === 'all' ? 'Shops near you' : CATEGORIES.find((c) => c.key === cat)?.label}</h2>
        <span className="hand shrink-0 -rotate-2">{shops ? `${shown.length} open` : 'loading…'}</span>
      </div>
      {shops === null ? (
        <Loading label="Loading shops…" rows={3} />
      ) : loadErr ? (
        <ErrorState message={`We could not load shops. ${loadErr}`} onRetry={() => { setShops(null); load(); }} />
      ) : shown.length === 0 ? (
        <Empty action={(cat !== 'all' || q) && <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setCat('all'); setQ(''); }}>Clear filters</button>}>No shops here yet. Try another category, or clear the search.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((s, i) => <ShopCard key={s.id} shop={s} i={i} />)}</div>
      )}
    </>
  );
}
