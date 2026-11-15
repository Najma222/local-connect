import Link from 'next/link';
import { catOf } from '@/lib/constants';
import Doodle from './Doodle';

export default function ShopCard({ shop, i = 0 }) {
  const cat = catOf(shop.category);
  return (
    <Link href={`/shop/${shop.id}`} className="relative block overflow-hidden rounded-[28px] p-5 transition active:scale-[0.98]" style={{ background: cat.bg, color: cat.fg }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm">{cat.label} · {shop.address || 'Nearby'}</p>
          <h3 className="mt-1 text-2xl font-semibold leading-tight">{shop.name}</h3>
        </div>
        <span className="go shrink-0 text-ink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9" /></svg>
        </span>
      </div>
      <p className="mt-2 line-clamp-2 max-w-[85%] text-sm">{shop.description}</p>
      <div className="mt-4 flex items-end justify-between">
        <span className="flex gap-2">
          {shop.verified && <span className="badge">✓ Verified neighbour</span>}
          {shop.rating && <span className="tg-r rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold">★ {Number(shop.rating.avg).toFixed(1)} ({shop.rating.count})</span>}
        </span>
        <span className="-mb-2 -mr-1">
          {shop.image_url ? <img src={shop.image_url} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <Doodle k={cat.doodle} blob={cat.blob} size={84} rotate={i % 2 ? -4 : 4} />}
        </span>
      </div>
    </Link>
  );
}
