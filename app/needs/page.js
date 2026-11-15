'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { catOf, rupee } from '@/lib/constants';

function List() {
  const { user, ready } = useApp();
  const posted = useSearchParams().get('posted');
  const [needs, setNeeds] = useState(null);

  const load = useCallback(() => supabase.from('needs').select('*, need_responses(*, shops(id, name, phone, verified))')
    .eq('customer_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setNeeds(data || [])), [user]);
  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel('resp-' + user.id).on('postgres_changes', { event: '*', schema: 'public', table: 'need_responses' }, load).subscribe();
    const t = setInterval(load, 15000);
    return () => { clearInterval(t); supabase.removeChannel(ch); };
  }, [user, load]);

  const close = async (id) => { await supabase.from('needs').update({ status: 'closed' }).eq('id', id); load(); };
  if (ready && !user) return <p className="mt-8"><Link href="/login?next=/needs" className="underline">Log in</Link> to see your needs.</p>;

  return (
    <>
      <p className="mt-5 text-sm text-ink/60">Quick needs</p>
      <div className="flex items-end justify-between"><h1 className="mt-1">My <b>needs</b></h1><Link href="/need" className="btn btn-accent mb-1 h-10 px-4 text-sm">Post a need</Link></div>
      {posted && <p className="hand mt-3 -rotate-1 text-2xl text-moss">Sent! Replies will show up here.</p>}
      {needs === null ? <p className="mt-6">Loading…</p> : needs.length === 0 ? (
        <p className="mt-6 rounded-[28px] bg-white p-8 text-center">Nothing posted yet. Tell nearby shops what you need.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {needs.map((n) => {
            const c = catOf(n.category);
            return (
              <article key={n.id} className="rounded-[28px] p-5" style={{ background: c.bg, color: c.fg }}>
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-sm">{c.label} · {n.when_text}{n.budget ? ` · up to ${rupee(n.budget)}` : ''}</p><p className="mt-1 text-lg font-semibold leading-snug">{n.description}</p></div>
                  <span className="shrink-0 rounded-full bg-white/70 px-3 py-1 text-xs font-bold capitalize">{n.status}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {n.need_responses.length === 0 && <p className="hand text-lg">waiting for replies…</p>}
                  {n.need_responses.map((r) => (
                    <div key={r.id} className="rounded-2xl bg-white p-3 text-ink">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/shop/${r.shops?.id}`} className="font-semibold underline">{r.shops?.name}</Link>
                        {r.price != null && <b>{rupee(r.price)}</b>}
                      </div>
                      {r.message && <p className="mt-1 text-sm">{r.message}</p>}
                      {r.shops?.phone && <a href={`tel:${r.shops.phone}`} className="btn mt-2 h-10 px-4 text-sm">Call</a>}
                    </div>
                  ))}
                </div>
                {n.status === 'open' && <button onClick={() => close(n.id)} className="mt-3 text-sm underline">Close this need</button>}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
export default function NeedsPage() { return <Suspense><List /></Suspense>; }
