'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { catOf, rupee } from '@/lib/constants';
import Doodle from '@/components/Doodle';
import ItemDoodle from '@/components/ItemDoodle';
import Dialog from '@/components/Dialog';
import { useToast } from '@/components/Toast';
import { Loading, Empty } from '@/components/States';

export default function ShopPage() {
  const { id } = useParams();
  const { addToCart, setQty, qtyOf, count, total, cart } = useApp();
  const toast = useToast();
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

  if (loading) return <Loading label="Loading shop…" rows={1} />;
  if (!shop) return <Empty action={<Link href="/" className="btn btn-sm">Back to all shops</Link>}>We could not find that shop. It may have been removed, or the connection dropped.</Empty>;
  const cat = catOf(shop.category);

  const add = (p) => { if (addToCart(p, shop)) toast(`Added ${p.name} to your cart`); else setWarn(p); };
  const swap = () => { addToCart(warn, shop, true); toast(`Started a new cart with ${warn.name}`); setWarn(null); };

  return (
    <>
      <Link href="/" className="tap -ml-1 px-1 text-sm font-semibold text-moss">← All shops</Link>
      <section className="mt-1 overflow-hidden rounded-[32px]" style={{ background: cat.bg, color: cat.fg }}>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/60 text-5xl">
            {shop.image_url ? <img src={shop.image_url} alt="" width="96" height="96" decoding="async" className="h-full w-full object-cover" /> : <Doodle k={cat.doodle} blob={cat.blob} size={84} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold sm:text-3xl">{shop.name}</h1>
              {shop.verified && <span className="badge">✓ Verified by Local Connect</span>}
            </div>
            <p className="break-words text-sm">{cat.label} · {shop.address}{rating ? ` · ★ ${Number(rating.avg).toFixed(1)} (${rating.count})` : ''}</p>
            <p className="mt-2 max-w-xl break-words">{shop.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {shop.phone && <a className="btn btn-ghost" href={`tel:${shop.phone}`}>Call</a>}
            {shop.whatsapp && <a className="btn btn-accent" href={`https://wa.me/${shop.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          </div>
        </div>
      </section>

      <h2 className="mb-4 mt-8 text-2xl font-bold">Items and services</h2>
      {products.length === 0 ? (
        <Empty>This shop has not added items yet. Call or message them directly.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const q = qtyOf(p.id);
            return (
              <article key={p.id} className="flex min-w-0 flex-col overflow-hidden rounded-[28px]" style={{ background: cat.bg, color: cat.fg }}>
                <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden">
                  {p.image_url ? <img src={p.image_url} alt={p.name} width="400" height="300" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="block h-24 w-24"><ItemDoodle name={p.name} description={p.description} fallback={cat.doodle} blob={cat.blob} size="100%" /></span>}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 break-words font-bold">{p.name}</h3>
                  <p className="mt-1 line-clamp-3 flex-1 break-words text-sm">{p.description}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-lg font-extrabold">{rupee(p.price)}</span>
                    {!p.in_stock ? <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-tomato">Out of stock</span> : q === 0 ? (
                      <button className="btn" onClick={() => add(p)}>Add to cart</button>
                    ) : (
                      <div className="flex items-center gap-1 rounded-full bg-ink p-0.5 text-white">
                        <button className="tap rounded-full text-xl" aria-label={`Remove one ${p.name}`} onClick={() => setQty(p.id, q - 1)}>−</button>
                        <span className="min-w-6 text-center font-bold" aria-live="polite">{q}</span>
                        <button className="tap rounded-full text-xl" aria-label={`Add one ${p.name}`} onClick={() => setQty(p.id, q + 1)}>+</button>
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
        <Dialog title="Start a new cart?" onClose={() => setWarn(null)}>
          <p className="mt-2 break-words text-sm">Your cart has items from {cart.shop?.name}. Each order goes to one shop, so adding this will clear it.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button className="btn btn-ghost flex-1" data-autofocus onClick={() => setWarn(null)}>Keep my cart</button>
            <button className="btn flex-1" onClick={swap}>Start new cart</button>
          </div>
        </Dialog>
      )}

      {count > 0 && cart.shop?.id === shop.id && (
        <>
          <div className="h-16" aria-hidden="true" />
          <Link href="/cart" className="bottom-above-nav fixed inset-x-4 z-fab mx-auto flex min-h-14 max-w-md items-center justify-between gap-3 rounded-full bg-ink px-6 py-3 font-semibold text-white shadow-xl">
            <span className="min-w-0 truncate">{count} item{count > 1 ? 's' : ''} · {rupee(total)}</span><span className="shrink-0">View cart</span>
          </Link>
        </>
      )}
    </>
  );
}
