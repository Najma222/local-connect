'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/app-context';

const P = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  map: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16',
  list: 'M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8z',
  cart: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
};
const Icon = ({ d }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

export default function Navbar() {
  const { user, profile, count } = useApp();
  const path = usePathname();
  const tabs = [['/', 'Explore', P.home], ['/map', 'Live map', P.map], ['/orders', 'Bookings', P.list], ['/profile', user ? 'Profile' : 'Log in', P.user]];
  return (
    <>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pb-2 pt-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 rotate-[8deg] items-center justify-center rounded-[14px] bg-ink">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" /></svg>
          </span>
          <span className="text-xl font-semibold tracking-tight">Local Connect</span>
        </Link>
        <div className="flex items-center gap-3">
          {user && <span className="hand hidden -rotate-2 sm:block">Namaste, {profile?.full_name?.split(' ')[0] || 'neighbour'}</span>}
          <Link href="/cart" aria-label="Cart" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-soft">
            <Icon d={P.cart} />
            {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E29079] px-1 text-[11px] font-bold">{count}</span>}
          </Link>
        </div>
      </header>
      <nav aria-label="Main" className="fixed bottom-5 left-1/2 z-[600] flex -translate-x-1/2 gap-1.5 rounded-[32px] bg-white p-1.5 shadow-[0_10px_30px_rgba(80,60,60,0.18)]">
        {tabs.map(([href, label, d]) => {
          const on = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link key={label} href={href} aria-label={label} className={`flex h-[54px] w-[60px] items-center justify-center rounded-[22px] ${on ? 'bg-ink text-white' : 'text-ink/60'}`}><Icon d={d} /></Link>
          );
        })}
      </nav>
    </>
  );
}
