'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { catOf, rupee } from '@/lib/constants';
import Doodle from '@/components/Doodle';

export default function ShopPage() {
  const { id } = useParams();
  const { addToCart, setQty, qtyOf, count, total, cart } = useApp();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState(null);
  const [rating, setRating] = useState(null);
  useEffect(() => { supabase.from('shop_ratings').select('*').eq('shop_id', id).maybeSingle().then(({ data }) => setRating(data)); }, [id]);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('shops').select('*').eq('id', id).single(),
        supabase.from('products').select('*').eq('shop_id', id).order('created_at'),
      ]);
      setShop(s); setProducts(p || []); setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;
  if (!shop) return <p>Shop not found. <Link href="/" className="underline">Back to all shops</Link></p>;
  const cat = catOf(shop.category);

  const add = (p) => { if (!addToCart(p, shop)) setWarn(p); };
  const swap = () => { addToCart(warn, shop, true); setWarn(null); };

  return (
    <>
      <Link href="/" className="text-sm font-semibold text-moss">← All shops</Link>
      <section className="mt-3 overflow-hidden rounded-[32px]" style={{ background: cat.bg, color: cat.fg }}>
        
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/60 text-5xl">
            {shop.image_url ? <img src={shop.image_url} alt="" className="h-full w-full object-cover" /> : <Doodle k={cat.doodle} blob={cat.blob} size={84} />}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold">{shop.name}</h1>
              {shop.verified && <span className="badge">✓ Verified by Local Connect</span>}
            </div>
            <p className="text-sm text-ink/60">{cat.label} · {shop.address}{rating ? ` · ★ ${Number(rating.avg).toFixed(1)} (${rating.count})` : ''}</p>
            <p className="mt-2 max-w-xl">{shop.description}</p>
          </div>
          <div className="flex gap-2">
            {shop.phone && <a className="btn btn-ghost" href={`tel:${shop.phone}`}>Call</a>}
            {shop.whatsapp && <a className="btn btn-accent" href={`https://wa.me/${shop.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          </div>
        </div>
      </section>

      <h2 className="mb-4 mt-8 text-2xl font-bold">Items and services</h2>
      {products.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-ink/70">This shop has not added items yet. Call or message them directly.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const q = qtyOf(p.id);
            return (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-[28px]" style={{ background: cat.bg, color: cat.fg }}>
                <div className="flex h-36 items-center justify-center">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <Doodle k={cat.doodle} blob={cat.blob} size={104} rotate={4} />}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="mt-1 flex-1 text-sm opacity-80">{p.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-extrabold">{rupee(p.price)}</span>
                    {!p.in_stock ? <span className="text-sm text-tomato">Out of stock</span> : q === 0 ? (
                      <button className="btn" onClick={() => add(p)}>Add to cart</button>
                    ) : (
                      <div className="flex items-center gap-3 rounded-full bg-ink px-2 py-1 text-white">
                        <button className="h-8 w-8 text-lg" aria-label="Remove one" onClick={() => setQty(p.id, q - 1)}>−</button>
                        <span className="w-4 text-center font-bold">{q}</span>
                        <button className="h-8 w-8 text-lg" aria-label="Add one" onClick={() => setQty(p.id, q + 1)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {warn && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold">Start a new cart?</h3>
            <p className="mt-2 text-sm">Your cart has items from {cart.shop?.name}. Each order goes to one shop, so adding this will clear it.</p>
            <div className="mt-5 flex gap-2">
              <button className="btn btn-ghost flex-1" onClick={() => setWarn(null)}>Keep my cart</button>
              <button className="btn flex-1" onClick={swap}>Start new cart</button>
            </div>
          </div>
        </div>
      )}

      {count > 0 && cart.shop?.id === shop.id && (
        <Link href="/cart" className="fixed inset-x-5 bottom-28 z-30 mx-auto flex max-w-md items-center justify-between rounded-full bg-ink px-6 py-4 font-semibold text-white shadow-xl">
          <span>{count} item{count > 1 ? 's' : ''} · {rupee(total)}</span><span>View cart</span>
        </Link>
      )}
    </>
  );
}
