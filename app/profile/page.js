'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { useToast } from '@/components/Toast';
import { Loading, Spinner } from '@/components/States';

export default function Profile() {
  const { user, profile, ready, refreshProfile } = useApp();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (ready && !user) return (
    <div className="mt-8 max-w-md"><h1>Your <b>profile</b></h1><p className="mt-3">Log in to see orders, needs and your shop.</p><Link href="/login?next=/profile" className="btn mt-4">Log in</Link></div>
  );
  if (!profile) return <Loading label="Loading your profile…" />;

  const isShop = profile.role === 'shop', isAdmin = profile.role === 'admin';
  const switchMode = async () => {
    if (busy) return;
    setBusy(true); setErr('');
    const role = isShop ? 'customer' : 'shop';
    const { error } = await supabase.from('profiles').update({ role }).eq('id', user.id);
    if (error) { setBusy(false); toast('Could not switch mode. Please try again.', 'error'); return setErr(error.message); }
    await refreshProfile(); setBusy(false);
    toast(role === 'shop' ? 'Seller mode is on' : 'Buyer mode is on');
    if (role === 'shop') router.push('/dashboard');
  };
  const rows = [['/orders', 'My orders', 'Track what you ordered'], ['/needs', 'My needs', 'Quick requests and replies'], ['/cart', 'My cart', 'Items waiting to be ordered']];
  if (isShop) rows.unshift(['/dashboard', 'My shop', 'Orders, items and requests']);
  if (isAdmin) rows.unshift(['/admin', 'Admin', 'Verify shops']);

  return (
    <div className="mx-auto max-w-xl lg:max-w-2xl">
      <p className="mt-5 text-sm text-ink/70">Profile</p>
      <h1 className="mt-1 break-words">{profile.full_name || 'Neighbour'}</h1>
      <p className="mt-1 break-all text-sm text-ink/70">{user.email} · {isAdmin ? 'Admin' : isShop ? 'Seller mode' : 'Buyer mode'}</p>
      <ul className="mt-6 space-y-3">
        {rows.map(([href, t, s]) => (
          <li key={href}><Link href={href} className="flex min-h-14 items-center justify-between gap-3 rounded-[24px] bg-white p-4 shadow-sm"><span className="min-w-0"><b className="block">{t}</b><span className="text-sm text-ink/70">{s}</span></span><span className="go bg-soft" aria-hidden="true">→</span></Link></li>
        ))}
      </ul>
      {!isAdmin && <button className="btn btn-accent mt-6 h-auto min-h-12 w-full whitespace-normal py-2 text-center" disabled={busy} onClick={switchMode}>{busy && <Spinner />}{isShop ? 'Switch to buyer mode' : 'Switch to seller mode and open a shop'}</button>}
      {err && <p className="mt-2 break-words text-sm text-tomato" role="alert">{err}</p>}
      <button className="btn btn-ghost mt-3 w-full" onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}>Log out</button>
    </div>
  );
}
