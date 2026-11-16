'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { useToast } from '@/components/Toast';
import { Loading, Empty, ErrorState, Spinner } from '@/components/States';

export default function Admin() {
  const { profile, ready } = useApp();
  const toast = useToast();
  const [shops, setShops] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [pending, setPending] = useState(null);
  const load = useCallback(() => supabase.from('shops').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
    if (error) { setLoadErr(error.message || 'Could not load shops.'); return setShops((x) => x || []); }
    setLoadErr(''); setShops(data || []);
  }), []);
  useEffect(() => { load(); }, [load]);

  if (!ready) return <Loading label="Loading…" />;
  if (profile?.role !== 'admin') return <Empty>This page is for admins only.</Empty>;
  const toggle = async (s) => {
    if (pending) return;
    setPending(s.id);
    const { error } = await supabase.from('shops').update({ verified: !s.verified }).eq('id', s.id);
    setPending(null);
    if (error) toast('Could not update the shop. Please try again.', 'error'); else toast(s.verified ? `Removed badge from ${s.name}` : `${s.name} is now verified`);
    load();
  };

  return (
    <>
      <h1 className="mt-4 text-3xl font-bold">Verify shops</h1>
      <p className="max-w-prose text-ink/70">Verified shops get a badge and appear first on the home page.</p>
      {shops === null ? <Loading label="Loading shops…" rows={3} /> : loadErr && !shops.length ? <ErrorState message={`We could not load shops. ${loadErr}`} onRetry={load} /> : shops.length === 0 ? <Empty>No shops have been created yet.</Empty> : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {shops.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
              <div className="min-w-0 flex-1 basis-40"><p className="line-clamp-2 break-words font-semibold">{s.name}</p><p className="line-clamp-2 break-words text-sm text-ink/70">{s.category} · {s.address}{s.verified ? ' · verified' : ''}</p></div>
              <button className={`btn btn-sm ${s.verified ? 'btn-ghost' : 'btn-accent'}`} disabled={pending === s.id} onClick={() => toggle(s)}>{pending === s.id && <Spinner />}{s.verified ? 'Remove badge' : 'Verify'}</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
