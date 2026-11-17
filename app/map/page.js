'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, catOf, rupee } from '@/lib/constants';
import { km, here } from '@/lib/geo';
import { useToast } from '@/components/Toast';
import { Spinner } from '@/components/States';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="h-full animate-pulse bg-line" /> });

const PANEL = 'absolute inset-x-3 bottom-4 z-map-ui mx-auto max-w-md rounded-[24px] bg-white p-4 text-center text-sm shadow-xl';
const fmtD = (d) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);
const eta = (d) => (d < 1.5 ? `${Math.max(1, Math.round((d / 5) * 60))} min walk` : `${Math.max(2, Math.round((d / 20) * 60))} min by auto`);

export default function MapPage() {
  const toast = useToast();
  const [shops, setShops] = useState(null);
  const [ratings, setRatings] = useState({});
  const [items, setItems] = useState({});
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
    supabase.from('shop_ratings').select('*').then(({ data }) => setRatings(Object.fromEntries((data || []).map((r) => [r.shop_id, r]))));
  }, []);
  useEffect(() => { load(); }, [load]);

  const pick = useCallback((s) => {
    setSel(s);
    setItems((m) => {
      if (m[s.id]) return m;
      supabase.from('products').select('id, name, price').eq('shop_id', s.id).eq('in_stock', true).order('created_at').limit(3)
        .then(({ data }) => setItems((x) => ({ ...x, [s.id]: data || [] })));
      return m;
    });
  }, []);
  const locate = async () => {
    if (locating) return;
    setLocating(true);
    try { setMe(await here()); toast('Sorted by distance from you'); } catch (e) { toast(e.message, 'error'); }
    setLocating(false);
  };
  const shown = useMemo(() => {
    const list = (shops || []).filter((s) => cat === 'all' || s.category === cat).map((s) => ({ ...s, d: me ? km(me, s) : null }));
    return list.sort((a, b) => (me ? a.d - b.d : Number(b.verified) - Number(a.verified)));
  }, [shops, cat, me]);
  const cur = sel && shown.find((s) => s.id === sel.id);
  const empty = shops && !loadErr && shops.length === 0;
  const rt = cur && ratings[cur.id];

  return (
    <>
      <p className="mt-5 text-sm text-ink/70">Live map · Bengaluru</p>
      <h1 className="mt-1">Shops <b>around you</b></h1>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by category">
        {[{ key: 'all', label: 'All nearby' }, ...CATEGORIES].map((c) => (
          <button key={c.key} aria-pressed={cat === c.key} onClick={() => { setCat(c.key); setSel(null); }} className={`tap shrink-0 rounded-full px-4 text-sm font-semibold ${cat === c.key ? 'bg-ink text-white' : 'bg-white'}`}>{c.label}</button>
        ))}
      </div>
      <div className="relative isolate mt-3 h-[calc(100dvh-16.5rem-var(--nav-space)-var(--safe-t))] min-h-[360px] overflow-hidden rounded-[28px] bg-soft lg:h-[calc(100dvh-15rem-var(--nav-space))] lg:min-h-[480px]">
        <MapView shops={shown} me={me} selectedId={sel?.id} onPick={pick} />
        <button onClick={locate} disabled={locating} className="btn btn-accent btn-sm absolute right-3 top-3 z-map-ui shadow-md">{locating && <Spinner />}{locating ? 'Locating…' : me ? 'Update location' : 'Find me'}</button>
        {shops && !empty && !loadErr && <p className="absolute left-3 top-3 z-map-ui rounded-full bg-white px-3 py-2 text-xs font-semibold shadow-md" role="status">{shown.length} shop{shown.length === 1 ? '' : 's'} · tap a pin</p>}
        {shops === null && <p className="absolute left-3 top-3 z-map-ui flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-md" role="status"><Spinner />Loading shops…</p>}
        {loadErr && !cur && (
          <div className={PANEL} role="alert">
            <p className="break-words font-semibold text-tomato">Could not load shops. {loadErr}</p>
            <button className="btn btn-sm mt-2" onClick={load}>Try again</button>
          </div>
        )}
        {empty && !cur && <p className={`${PANEL} text-ink/70`}>No shops have a location yet. Shop owners can add theirs when opening a shop.</p>}
        {shops && !loadErr && !empty && shown.length === 0 && !cur && <p className={`${PANEL} text-ink/70`}>No shops in this category on the map yet.</p>}

        {!cur && shown.length > 0 && (
          <div className="absolute inset-x-0 bottom-3 z-map-ui">
            {!me && <p className="hand mx-auto mb-1 w-fit -rotate-1 rounded-full bg-white/90 px-3 py-1 text-base shadow">tap Find me to sort by distance</p>}
            <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-3 pb-1">
              {shown.slice(0, 12).map((s) => (
                <li key={s.id} className="snap-start">
                  <button type="button" onClick={() => pick(s)} className="w-[210px] rounded-2xl bg-white p-3 text-left shadow-lg">
                    <span className="block truncate font-semibold">{s.name}</span>
                    <span className="block truncate text-xs text-ink/70">{catOf(s.category).label}{s.verified ? ' · Verified' : ''}</span>
                    <span className="mt-1 block text-xs font-semibold">{s.d != null ? `${fmtD(s.d)} · ${eta(s.d)}` : 'Tap for details'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {cur && (
          <div className="absolute inset-x-3 bottom-3 z-map-ui mx-auto max-h-[72%] max-w-md overflow-y-auto overscroll-contain rounded-[24px] bg-white p-4 shadow-xl" role="region" aria-label="Selected shop">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="line-clamp-2 break-words text-lg font-semibold leading-tight">{cur.name}</p>
                <p className="mt-0.5 break-words text-sm text-ink/70">{catOf(cur.category).label}{cur.verified ? ' · ✓ Verified' : ''}{rt ? ` · ★ ${Number(rt.avg).toFixed(1)} (${rt.count})` : ''}</p>
              </div>
              <button aria-label="Close shop details" onClick={() => setSel(null)} className="go -mr-1 -mt-1 bg-soft text-xl">×</button>
            </div>
            <p className="mt-2 inline-flex rounded-full bg-[#EFEDF5] px-3 py-1 text-xs font-semibold">{cur.d != null ? `${fmtD(cur.d)} away · ${eta(cur.d)}` : 'Tap Find me to see your distance'}</p>
            {cur.address && <p className="mt-2 break-words text-sm text-ink/80">{cur.address}</p>}
            <div className="mt-3">
              <p className="text-sm font-semibold">Popular here</p>
              {!items[cur.id] ? <p className="mt-1 flex items-center gap-2 text-sm text-ink/70"><Spinner />Loading items…</p> : items[cur.id].length === 0 ? <p className="mt-1 text-sm text-ink/70">No items listed yet. Call or message the shop.</p> : (
                <ul className="mt-1 divide-y divide-line text-sm">
                  {items[cur.id].map((i) => <li key={i.id} className="flex justify-between gap-3 py-1.5"><span className="min-w-0 break-words">{i.name}</span><b className="shrink-0">{rupee(i.price)}</b></li>)}
                </ul>
              )}
            </div>
            <Link href={`/shop/${cur.id}`} className="btn mt-3 w-full">Open shop and order</Link>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {cur.phone ? <a href={`tel:${cur.phone}`} className="btn btn-ghost btn-sm px-2">Call</a> : <span />}
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${cur.lat},${cur.lng}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm px-2">Directions</a>
              {cur.whatsapp ? <a href={`https://wa.me/${cur.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm px-2">WhatsApp</a> : <span />}
            </div>
            <Link href={`/need?cat=${cur.category}`} className="tap mt-2 w-full justify-center rounded-2xl bg-[#F4E4DB] px-3 text-sm font-semibold">Ask for {catOf(cur.category).label.toLowerCase()} help instead</Link>
          </div>
        )}
      </div>
    </>
  );
}
