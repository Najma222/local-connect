'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { catOf, rupee } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import { Loading, Empty, ErrorState, Spinner } from '@/components/States';

function List() {
  const { user, ready } = useApp();
  const posted = useSearchParams().get('posted');
  const toast = useToast();
  const [needs, setNeeds] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [closing, setClosing] = useState(null);

  const load = useCallback(() => supabase.from('needs').select('*, need_responses(*, shops(id, name, phone, verified))')
    .eq('customer_id', user.id).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) { setLoadErr(error.message || 'Could not load your needs.'); return setNeeds((x) => x || []); }
      setLoadErr(''); setNeeds(data || []);
    }), [user]);
  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel('resp-' + user.id).on('postgres_changes', { event: '*', schema: 'public', table: 'need_responses' }, load).subscribe();
    const t = setInterval(load, 15000);
    return () => { clearInterval(t); supabase.removeChannel(ch); };
  }, [user, load]);

  const close = async (id) => {
    if (closing) return;
    setClosing(id);
    const { error } = await supabase.from('needs').update({ status: 'closed' }).eq('id', id);
    setClosing(null);
    if (error) toast('Could not close this need. Please try again.', 'error'); else toast('Need closed');
    load();
  };
  if (ready && !user) return <Empty action={<Link href="/login?next=/needs" className="btn">Log in</Link>}>Log in to see your needs.</Empty>;

  return (
    <>
      <p className="mt-5 text-sm text-ink/70">Quick needs</p>
      <div className="flex flex-wrap items-end justify-between gap-2"><h1 className="mt-1">My <b>needs</b></h1><Link href="/need" className="btn btn-accent btn-sm mb-1">Post a need</Link></div>
      {posted && <p className="hand mt-3 -rotate-1 text-2xl text-moss" role="status">Sent! Replies will show up here.</p>}
      {needs === null ? <Loading label="Loading your needs…" rows={2} /> : loadErr && !needs.length ? <ErrorState message={`We could not load your needs. ${loadErr}`} onRetry={load} /> : needs.length === 0 ? (
        <Empty action={<Link href="/need" className="btn btn-sm">Post a need</Link>}>Nothing posted yet. Tell nearby shops what you need.</Empty>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {needs.map((n) => {
            const c = catOf(n.category);
            return (
              <article key={n.id} className="min-w-0 rounded-[28px] p-5" style={{ background: c.bg, color: c.fg }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="break-words text-sm">{c.label} · {n.when_text}{n.budget ? ` · up to ${rupee(n.budget)}` : ''}</p><p className="mt-1 break-words text-lg font-semibold leading-snug">{n.description}</p></div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-ink">{n.status}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {n.need_responses.length === 0 && <p className="hand text-lg">waiting for replies…</p>}
                  {n.need_responses.map((r) => (
                    <div key={r.id} className="rounded-2xl bg-white p-3 text-ink">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/shop/${r.shops?.id}`} className="tap min-w-0 justify-start break-words font-semibold underline">{r.shops?.name}</Link>
                        {r.price != null && <b className="shrink-0">{rupee(r.price)}</b>}
                      </div>
                      {r.message && <p className="mt-1 break-words text-sm">{r.message}</p>}
                      {r.shops?.phone && <a href={`tel:${r.shops.phone}`} className="btn btn-sm mt-2">Call</a>}
                    </div>
                  ))}
                </div>
                {n.status === 'open' && <button onClick={() => close(n.id)} disabled={closing === n.id} className="tap mt-2 gap-2 px-1 text-sm underline">{closing === n.id && <Spinner />}Close this need</button>}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
export default function NeedsPage() { return <Suspense><List /></Suspense>; }
