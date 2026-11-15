'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/constants';
import { useApp } from '@/lib/app-context';
import ShopCard from '@/components/ShopCard';
import Doodle from '@/components/Doodle';
import Link from 'next/link';

export default function Home() {
  const { profile } = useApp();
  const [shops, setShops] = useState(null);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase.from('shops').select('*').order('verified', { ascending: false }).order('created_at', { ascending: false })
      .then(async ({ data }) => { const { data: r } = await supabase.from('shop_ratings').select('*'); const m = Object.fromEntries((r || []).map((x) => [x.shop_id, x])); setShops((data || []).map((s) => ({ ...s, rating: m[s.id] }))); });
  }, []);

  const shown = (shops || []).filter(
    (s) => (cat === 'all' || s.category === cat) && (s.name + ' ' + (s.description || '')).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <p className="mt-5 text-sm text-ink/60">Namaste{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} · Indiranagar, Bengaluru</p>
      <h1 className="mt-1 max-w-md">What do you need <b>nearby</b> today?</h1>
      <p className="hand mt-2 -rotate-1 text-ink/60">Try a home baker in Indiranagar or an auto to Kempegowda Airport.</p>
      <label className="mt-5 flex h-[60px] max-w-xl items-center justify-between rounded-full bg-soft pl-6 pr-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Plum cake, plumber, auto to the airport…" aria-label="Search shops" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
        <span className="go bg-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M11 3a8 8 0 1 0 0 16 8 8 0 1 0 0-16zM21 21l-4.3-4.3" /></svg></span>
      </label>

      <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((c, i) => {
          const on = cat === c.key;
          return (
            <button key={c.key} onClick={() => setCat(on ? 'all' : c.key)} aria-pressed={on}
              className={`relative overflow-hidden rounded-[28px] p-4 text-left transition active:scale-[0.97] ${i % 2 ? 'h-[112px]' : 'h-[132px]'}`}
              style={{ background: c.bg, color: c.fg, boxShadow: on ? 'inset 0 0 0 3px #15141A' : 'none' }}>
              <span className="block w-[110px] text-base font-semibold leading-tight">{c.label}</span>
              <span className="absolute -bottom-1 left-0"><Doodle k={c.doodle} blob={c.blob} size={86} rotate={i % 2 ? -4 : 3} /></span>
              <span className="go absolute bottom-3 right-3 text-ink">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9" /></svg>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 mt-9 flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold">{cat === 'all' ? 'Shops near you' : CATEGORIES.find((c) => c.key === cat)?.label}</h2>
        <span className="hand -rotate-2">{shops ? `${shown.length} open` : 'loading…'}</span>
      </div>
      {shops === null ? (
        <div className="grid gap-4 sm:grid-cols-2">{[1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-[28px] bg-line" />)}</div>
      ) : shown.length === 0 ? (
        <p className="rounded-[28px] bg-white p-8 text-center text-ink/70">No shops here yet. Try another category, or clear the search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{shown.map((s, i) => <ShopCard key={s.id} shop={s} i={i} />)}</div>
      )}
      <Link href="/need" aria-label="Post a quick need" className="fixed bottom-28 right-5 z-40 flex h-14 w-14 -rotate-6 items-center justify-center rounded-[20px] bg-ink text-white shadow-xl">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </Link>
    </>
  );
}
