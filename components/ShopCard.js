import Link from 'next/link';
import { catOf } from '@/lib/constants';
import Doodle from './Doodle';

export default function ShopCard({ shop, i = 0 }) {
  const cat = catOf(shop.category);
  return (
    <Link href={`/shop/${shop.id}`} className="relative flex min-w-0 flex-col overflow-hidden rounded-[28px] p-4 transition active:scale-[0.98] sm:p-5" style={{ background: cat.bg, color: cat.fg }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 break-words text-sm">{cat.label} · {shop.address || 'Nearby'}</p>
          <h3 className="mt-1 line-clamp-2 break-words text-2xl font-semibold leading-tight">{shop.name}</h3>
        </div>
        <span className="go text-ink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9" /></svg>
        </span>
      </div>
      {shop.description && <p className="mt-2 line-clamp-2 break-words text-sm">{shop.description}</p>}
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <span className="flex min-w-0 flex-wrap gap-2">
          {shop.verified && <span className="badge">✓ Verified neighbour</span>}
          {shop.rating && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink">★ {Number(shop.rating.avg).toFixed(1)} ({shop.rating.count})</span>}
        </span>
        <span className="block h-16 w-16 shrink-0 overflow-hidden sm:h-[72px] sm:w-[72px]">
          {shop.image_url
            ? <img src={shop.image_url} alt="" width="72" height="72" loading="lazy" decoding="async" className="h-full w-full rounded-2xl bg-white/50 object-cover" />
            : <Doodle k={cat.doodle} blob={cat.blob} size="100%" rotate={i % 2 ? -4 : 4} />}
        </span>
      </div>
    </Link>
  );
}
