'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { rupee } from '@/lib/constants';
import ItemDoodle from '@/components/ItemDoodle';
import { useToast } from '@/components/Toast';
import { Empty, Spinner } from '@/components/States';

export default function CartPage() {
  const { cart, setQty, clearCart, total, user, profile } = useApp();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let saved = '';
    try { saved = localStorage.getItem('lc-phone') || ''; } catch {}
    setName((v) => v || profile?.full_name || '');
    setPhone((v) => v || profile?.phone || user?.phone || saved);
  }, [profile, user]);

  if (cart.items.length === 0)
    return (
      <Empty action={<Link href="/" className="btn">Browse shops</Link>}>
        <p className="text-lg font-bold text-ink">Your cart is empty</p>
        <p className="mt-1">Pick a shop and add something.</p>
      </Empty>
    );

  const place = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setErr('');
    if (!user) return router.push('/login?next=/cart');
    if (name.trim().length < 2 || phone.trim().length < 8) return setErr('Add your name and a phone number so the shop can reach you.');
    setBusy(true);
    const { data: order, error } = await supabase.from('orders').insert({
      shop_id: cart.shop.id, customer_id: user.id, customer_name: name, customer_phone: phone, note, total,
    }).select().single();
    if (error) { setBusy(false); toast('Could not send your order. Please try again.', 'error'); return setErr(error.message); }
    const { error: e2 } = await supabase.from('order_items').insert(
      cart.items.map((i) => ({ order_id: order.id, product_id: i.id, name: i.name, price: i.price, qty: i.qty }))
    );
    setBusy(false);
    if (e2) { toast('Your order was created but some items failed to save.', 'error'); return setErr(e2.message); }
    try { localStorage.setItem('lc-phone', phone); } catch {}
    clearCart();
    router.push('/orders?placed=1');
  };

  return (
    <div className="grid min-w-0 gap-6 pt-3 md:grid-cols-5 lg:gap-8">
      <section className="min-w-0 md:col-span-3">
        <h1 className="text-3xl font-bold">Your cart</h1>
        <p className="break-words text-ink/70">Ordering from <b>{cart.shop.name}</b></p>
        <ul className="mt-4 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
          {cart.items.map((i) => (
            <li key={i.id} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 p-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto_auto]">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-paper"><ItemDoodle name={i.name} blob="#E3F0ED" size="100%" /></div>
              <div className="min-w-0 flex-1 basis-32">
                <p className="line-clamp-2 break-words font-semibold">{i.name}</p>
                <p className="text-sm text-ink/70">{rupee(i.price)} each</p>
              </div>
              <p className="min-w-[4.5rem] text-right font-bold">{rupee(i.price * i.qty)}</p>
              <div className="col-span-2 flex items-center gap-1 sm:col-span-1">
                <button type="button" className="tap rounded-full ring-1 ring-line" aria-label={`Remove one ${i.name}`} onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                <span className="min-w-8 text-center font-bold" aria-live="polite">{i.qty}</span>
                <button type="button" className="tap rounded-full ring-1 ring-line" aria-label={`Add one ${i.name}`} onClick={() => setQty(i.id, i.qty + 1)}>+</button>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className="tap mt-2 px-1 text-sm text-tomato underline" onClick={() => { clearCart(); toast('Cart cleared'); }}>Clear cart</button>
      </section>

      <aside className="h-fit min-w-0 md:col-span-2 md:sticky md:top-4">
        <form onSubmit={place} className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Send order to shop</h2>
          <div className="mt-4 space-y-3">
            <input className="field" placeholder="Your name" aria-label="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="field" placeholder="Phone number" aria-label="Phone number" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <textarea className="field" rows={3} placeholder="Note: address, time, cake message…" aria-label="Note for the shop" autoComplete="street-address" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="mt-4 flex justify-between gap-3 text-lg font-extrabold"><span>Total</span><span>{rupee(total)}</span></div>
          <p className="mt-1 text-xs text-ink/70">Pay the shop directly on delivery or pickup.</p>
          {err && <p className="mt-3 break-words text-sm text-tomato" role="alert">{err}</p>}
          <button className="btn btn-accent mt-4 w-full" disabled={busy}>
            {busy && <Spinner />}{user ? (busy ? 'Sending…' : 'Place order') : 'Log in to place order'}
          </button>
        </form>
      </aside>
    </div>
  );
}
