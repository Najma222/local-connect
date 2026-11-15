'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { rupee } from '@/lib/constants';

export default function CartPage() {
  const { cart, setQty, clearCart, total, user, profile } = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (cart.items.length === 0)
    return (
      <div className="rounded-2xl bg-white p-10 text-center">
        <p className="text-lg font-bold">Your cart is empty</p>
        <p className="mt-1 text-ink/70">Pick a shop and add something.</p>
        <Link href="/" className="btn mt-5">Browse shops</Link>
      </div>
    );

  const place = async () => {
    setErr('');
    if (!user) return router.push('/login?next=/cart');
    if (name.trim().length < 2 || phone.trim().length < 8) return setErr('Add your name and a phone number so the shop can reach you.');
    setBusy(true);
    const { data: order, error } = await supabase.from('orders').insert({
      shop_id: cart.shop.id, customer_id: user.id, customer_name: name, customer_phone: phone, note, total,
    }).select().single();
    if (error) { setBusy(false); return setErr(error.message); }
    const { error: e2 } = await supabase.from('order_items').insert(
      cart.items.map((i) => ({ order_id: order.id, product_id: i.id, name: i.name, price: i.price, qty: i.qty }))
    );
    setBusy(false);
    if (e2) return setErr(e2.message);
    clearCart();
    router.push('/orders?placed=1');
  };

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <section className="md:col-span-3">
        <h1 className="text-3xl font-bold">Your cart</h1>
        <p className="text-ink/70">Ordering from <b>{cart.shop.name}</b></p>
        <ul className="mt-4 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
          {cart.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 p-4">
              <div><p className="font-semibold">{i.name}</p><p className="text-sm text-ink/60">{rupee(i.price)} each</p></div>
              <div className="flex items-center gap-3">
                <button className="h-8 w-8 rounded-full ring-1 ring-line" aria-label="Remove one" onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                <span className="w-4 text-center font-bold">{i.qty}</span>
                <button className="h-8 w-8 rounded-full ring-1 ring-line" aria-label="Add one" onClick={() => setQty(i.id, i.qty + 1)}>+</button>
              </div>
              <p className="w-20 text-right font-bold">{rupee(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
        <button className="mt-3 text-sm text-tomato underline" onClick={clearCart}>Clear cart</button>
      </section>

      <aside className="h-fit rounded-[28px] bg-white p-5 shadow-sm md:col-span-2">
        <h2 className="text-xl font-bold">Send order to shop</h2>
        <div className="mt-4 space-y-3">
          <input className="field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="field" placeholder="Phone number" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <textarea className="field" rows={3} placeholder="Note: address, time, cake message…" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="mt-4 flex justify-between text-lg font-extrabold"><span>Total</span><span>{rupee(total)}</span></div>
        <p className="mt-1 text-xs text-ink/60">Pay the shop directly on delivery or pickup.</p>
        {err && <p className="mt-3 text-sm text-tomato" role="alert">{err}</p>}
        <button className="btn btn-accent mt-4 w-full" disabled={busy} onClick={place}>
          {user ? (busy ? 'Sending…' : 'Place order') : 'Log in to place order'}
        </button>
      </aside>
    </div>
  );
}
