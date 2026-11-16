'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, catOf } from '@/lib/constants';
import { km, here } from '@/lib/geo';
import { useToast } from '@/components/Toast';
import { Spinner } from '@/components/States';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="h-full animate-pulse bg-line" /> });

const PANEL = 'absolute inset-x-3 bottom-5 z-map-ui mx-auto max-w-md rounded-[24px] bg-white p-4 text-center text-sm shadow-xl';

export default function MapPage() {
  const toast = useToast();
  const [shops, setShops] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [cat, setCat] = useState('all');
  const [me, setMe] = useState(null);
  const [sel, setSel] = useState(null);
  const [locating, setLocating] = useState(false);

  const load = useCallback(() => {
    setLoadErr('');
    supabase.from('shops').select('*').not('lat', 'is', null).then(({ data, error }) => {
      if (error) { setLoadErr(error.message || 'Could not load shops.'); return setShops((x) => x || []); }
      setShops(data || []);
    });
  }, []);
  useEffect(() => { load(); }, [load]);
  const shown = useMemo(() => (shops || []).filter((s) => cat === 'all' || s.category === cat), [shops, cat]);
  const pick = useCallback((s) => setSel(s), []);
  const locate = async () => {
    if (locating) return;
    setLocating(true);
    try { setMe(await here()); } catch (e) { toast(e.message, 'error'); }
    setLocating(false);
  };
  const dist = sel && me ? km(me, sel) : null;
  const empty = shops && !loadErr && shops.length === 0;

  return (
    <>
      <p className="mt-5 text-sm text-ink/70">Live map · Bengaluru</p>
      <h1 className="mt-1">Shops <b>around you</b></h1>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by category">
        {[{ key: 'all', label: 'All nearby' }, ...CATEGORIES].map((c) => (
          <button key={c.key} aria-pressed={cat === c.key} onClick={() => { setCat(c.key); setSel(null); }} className={`tap shrink-0 rounded-full px-4 text-sm font-semibold ${cat === c.key ? 'bg-ink text-white' : 'bg-white'}`}>{c.label}</button>
        ))}
      </div>
      <div className="relative isolate mt-3 h-[calc(100dvh-16.5rem-var(--nav-space)-var(--safe-t))] min-h-[320px] overflow-hidden rounded-[28px] bg-soft lg:h-[calc(100dvh-15rem-var(--nav-space))] lg:min-h-[480px]">
        <MapView shops={shown} me={me} selectedId={sel?.id} onPick={pick} />
        <button onClick={locate} disabled={locating} className="btn btn-accent btn-sm absolute right-3 top-3 z-map-ui shadow-md">{locating && <Spinner />}{locating ? 'Locating…' : 'Find me'}</button>
        {shops === null && <p className="absolute left-3 top-3 z-map-ui flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-md" role="status"><Spinner />Loading shops…</p>}
        {loadErr && !sel && (
          <div className={PANEL} role="alert">
            <p className="break-words font-semibold text-tomato">Could not load shops. {loadErr}</p>
            <button className="btn btn-sm mt-2" onClick={load}>Try again</button>
          </div>
        )}
        {empty && !sel && <p className={`${PANEL} text-ink/70`}>No shops have a location yet. Shop owners can add theirs when opening a shop.</p>}
        {shops && !loadErr && !empty && shown.length === 0 && !sel && <p className={`${PANEL} text-ink/70`}>No shops in this category on the map yet.</p>}
        {sel && (
          <div className="absolute inset-x-3 bottom-5 z-map-ui mx-auto max-w-md rounded-[24px] bg-white p-4 shadow-xl" role="region" aria-label="Selected shop">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="line-clamp-2 break-words text-lg font-semibold leading-tight">{sel.name}</p>
                <p className="mt-0.5 break-words text-sm text-ink/70">{catOf(sel.category).label}{sel.verified ? ' · Verified' : ''}{dist != null ? ` · ${dist < 1 ? Math.round(dist * 1000) + ' m' : dist.toFixed(1) + ' km'} away` : ''}</p>
              </div>
              <button aria-label="Close shop details" onClick={() => setSel(null)} className="go -mr-1 -mt-1 bg-soft text-xl">×</button>
            </div>
            <div className="mt-3 flex gap-2">
              {sel.phone && <a href={`tel:${sel.phone}`} className="btn btn-ghost min-w-0 flex-1 px-3">Call</a>}
              <Link href={`/shop/${sel.id}`} className="btn min-w-0 flex-1 px-3">Open shop</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
