'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';

export default function Admin() {
  const { profile, ready } = useApp();
  const [shops, setShops] = useState([]);
  const load = useCallback(() => supabase.from('shops').select('*').order('created_at', { ascending: false }).then(({ data }) => setShops(data || [])), []);
  useEffect(() => { load(); }, [load]);

  if (!ready) return <p>Loading…</p>;
  if (profile?.role !== 'admin') return <p>Admins only.</p>;
  const toggle = async (s) => { await supabase.from('shops').update({ verified: !s.verified }).eq('id', s.id); load(); };

  return (
    <>
      <h1 className="text-3xl font-bold">Verify shops</h1>
      <p className="text-ink/70">Verified shops get a badge and appear first on the home page.</p>
      <ul className="mt-5 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
        {shops.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 p-4">
            <div><p className="font-semibold">{s.name}</p><p className="text-sm text-ink/60">{s.category} · {s.address}</p></div>
            <button className={`btn ${s.verified ? 'btn-ghost' : 'btn-accent'}`} onClick={() => toggle(s)}>{s.verified ? 'Remove badge' : 'Verify'}</button>
          </li>
        ))}
      </ul>
    </>
  );
}
