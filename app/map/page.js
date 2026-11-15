'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, catOf } from '@/lib/constants';
import { km, here } from '@/lib/geo';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="h-full animate-pulse bg-line" /> });

export default function MapPage() {
  const [shops, setShops] = useState([]);
  const [cat, setCat] = useState('all');
  const [me, setMe] = useState(null);
  const [sel, setSel] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { supabase.from('shops').select('*').not('lat', 'is', null).then(({ data }) => setShops(data || [])); }, []);
  const shown = useMemo(() => shops.filter((s) => cat === 'all' || s.category === cat), [shops, cat]);
  const pick = useCallback((s) => setSel(s), []);
  const locate = async () => { setErr(''); try { setMe(await here()); } catch (e) { setErr(e.message); } };
  const dist = sel && me ? km(me, sel) : null;

  return (
    <>
      <p className="mt-5 text-sm text-ink/60">Live map · Bengaluru</p>
      <h1 className="mt-1">Shops <b>around you</b></h1>
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        {[{ key: 'all', label: 'All nearby' }, ...CATEGORIES].map((c) => (
          <button key={c.key} onClick={() => { setCat(c.key); setSel(null); }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${cat === c.key ? 'bg-ink text-white' : 'bg-white'}`}>{c.label}</button>
        ))}
      </div>
      <div className="relative mt-4 h-[calc(100dvh-330px)] min-h-[340px] overflow-hidden rounded-[28px] bg-soft">
        <MapView shops={shown} me={me} selectedId={sel?.id} onPick={pick} />
        <button onClick={locate} className="btn btn-accent absolute right-3 top-3 z-[500] h-10 px-4 text-sm">Find me</button>
        {sel && (
          <div className="absolute inset-x-3 bottom-3 z-[500] rounded-[24px] bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-semibold leading-tight">{sel.name}</p>
                <p className="text-sm text-ink/60">{catOf(sel.category).label}{sel.verified ? ' · Verified' : ''}{dist != null ? ` · ${dist < 1 ? Math.round(dist * 1000) + ' m' : dist.toFixed(1) + ' km'} away` : ''}</p>
              </div>
              <button aria-label="Close" onClick={() => setSel(null)} className="go bg-soft">×</button>
            </div>
            <div className="mt-3 flex gap-2">
              {sel.phone && <a href={`tel:${sel.phone}`} className="btn btn-ghost flex-1">Call</a>}
              <Link href={`/shop/${sel.id}`} className="btn flex-1">Open shop</Link>
            </div>
          </div>
        )}
      </div>
      {err && <p className="mt-2 text-sm text-tomato" role="alert">{err}</p>}
      {shops.length === 0 && <p className="mt-3 text-sm text-ink/60">No shops have a location yet. Shop owners can add theirs when opening a shop.</p>}
    </>
  );
}
