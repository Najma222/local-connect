'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { useBadges } from '@/lib/useBadges';
import { useToast } from '@/components/Toast';

const P = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  map: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16',
  list: 'M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01',
  shop: 'M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 20v-6h6v6',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8z',
  cart: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  plus: 'M12 5v14M5 12h14',
};
const Icon = ({ d, size = 22, w = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const Dot = ({ n }) => n > 0 ? <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E29079] px-1 text-[10px] font-bold text-ink">{n}</span> : null;

export default function Navbar() {
  const { user, profile, count } = useApp();
  const b = useBadges();
  const path = usePathname();
  const isShop = profile?.role === 'shop';
  const toast = useToast();
  // App-wide heads-up when something new arrives (skips the first load and the page that already shows it).
  const prev = useRef(b);
  useEffect(() => {
    const p = prev.current; prev.current = b;
    if (!p.loaded || !b.loaded) return;
    if (b.newOrders > p.newOrders) toast(b.newOrders - p.newOrders > 1 ? `${b.newOrders - p.newOrders} new orders. Open My shop to accept.` : 'New order! Open My shop to accept it.');
    if (b.requests > p.requests && !path.startsWith('/dashboard')) toast('New request from a neighbour. Open My shop, Requests.');
    if (b.replies > p.replies && !path.startsWith('/needs')) toast('A shop replied to your need. Tap Ask to see it.');
  }, [b]); // eslint-disable-line react-hooks/exhaustive-deps
  const side = (href, label, d, badge = 0) => {
    const on = href === '/' ? path === '/' : path.startsWith(href);
    return (
      <Link key={label} href={href} aria-current={on ? 'page' : undefined} aria-label={badge ? `${label}, ${badge} waiting` : label}
        className={`relative flex h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[26px] text-[11px] font-semibold leading-none ${on ? 'bg-ink text-white' : 'text-ink/70'}`}>
        <Icon d={d} /><span className="max-w-full truncate px-1">{label}</span><Dot n={badge} />
      </Link>
    );
  };
  const askOn = path.startsWith('/need');
  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pb-2 pt-[calc(var(--safe-t)+1.25rem)] sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 rotate-[8deg] items-center justify-center rounded-[14px] bg-ink">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" /></svg>
          </span>
          <span className="truncate text-xl font-semibold tracking-tight">Local Connect</span>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          {user && <span className="hand hidden max-w-[10rem] -rotate-2 truncate sm:block">Namaste, {profile?.full_name?.split(' ')[0] || 'neighbour'}</span>}
          <Link href="/cart" aria-label={count > 0 ? `Cart, ${count} item${count > 1 ? 's' : ''}` : 'Cart'} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-soft">
            <Icon d={P.cart} />
            {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E29079] px-1 text-[11px] font-bold text-ink">{count}</span>}
          </Link>
        </div>
      </header>
      <nav aria-label="Main" className="fixed bottom-[calc(var(--safe-b)+var(--nav-gap))] left-1/2 z-nav flex w-[calc(100%-1rem)] max-w-md -translate-x-1/2 items-end gap-0.5 rounded-[32px] bg-white p-1 shadow-[0_10px_30px_rgba(80,60,60,0.18)]">
        {side('/', 'Explore', P.home)}
        {side('/map', 'Map', P.map)}
        <Link href={b.replies > 0 ? '/needs' : '/need'} aria-current={askOn ? 'page' : undefined} aria-label={b.replies ? `Ask neighbours, ${b.replies} replies waiting` : 'Ask neighbours: post a need'}
          className="relative flex h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-end">
          <span className={`absolute -top-6 flex h-14 w-14 items-center justify-center rounded-full text-ink shadow-lg ring-4 ring-white ${askOn ? 'bg-ink text-white' : 'bg-marigold'}`}><Icon d={P.plus} size={26} w={2.5} /></span>
          {b.replies > 0 && <span className="absolute -top-6 left-1/2 ml-4 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E29079] px-1 text-[11px] font-bold text-ink ring-2 ring-white">{b.replies}</span>}
          <span className="pb-1.5 text-[11px] font-bold leading-none">Ask</span>
        </Link>
        {isShop ? side('/dashboard', 'My shop', P.shop, b.newOrders + b.requests) : side('/orders', 'Orders', P.list)}
        {side('/profile', user ? 'Profile' : 'Log in', P.user)}
      </nav>
    </>
  );
}
