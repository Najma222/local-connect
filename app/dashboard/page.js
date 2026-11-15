'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, uploadImage } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { CATEGORIES, STATUSES, rupee } from '@/lib/constants';
import { here } from '@/lib/geo';

export default function Dashboard() {
  const { user, profile, ready } = useApp();
  const [shops, setShops] = useState(undefined);
  const [shopId, setShopId] = useState(null);
  const [tab, setTab] = useState('orders');

  const loadShops = useCallback(async () => {
    const { data } = await supabase.from('shops').select('*').eq('owner_id', user.id).order('created_at');
    setShops(data || []);
  }, [user]);
  useEffect(() => { if (user) loadShops(); }, [user, loadShops]);

  if (ready && !user) return <p><Link href="/login?next=/dashboard" className="underline">Log in</Link> to manage your shop.</p>;
  if (ready && profile && profile.role !== 'shop') return <p>This page is for shop accounts. Sign up again with “I run a shop”.</p>;
  if (shops === undefined) return <p>Loading…</p>;
  if (shops.length === 0) return <CreateShop user={user} onDone={loadShops} />;

  const shop = shops.find((s) => s.id === shopId) || shops[0];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{shop.name}</h1>
          <p className="text-sm text-ink/60">{shop.verified ? '✓ Verified shop' : 'Not verified yet. An admin will review your shop.'}</p>
        </div>
        <Link href={`/shop/${shop.id}`} className="btn btn-ghost">See my public page</Link>
      </div>
      {shops.length > 1 && (
        <label className="mt-4 block text-sm font-semibold">Managing shop
          <select className="field mt-1" value={shop.id} onChange={(e) => { setShopId(e.target.value); setTab('orders'); }}>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
          </select>
        </label>
      )}
      <div className="mt-5 flex gap-2">
        {['orders', 'products', 'requests'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-5 py-2 text-sm font-semibold capitalize ring-1 ${tab === t ? 'bg-ink text-white ring-ink' : 'bg-white ring-line'}`}>{t === 'products' ? 'Items & services' : t === 'requests' ? 'Requests' : 'Orders'}</button>
        ))}
      </div>
      <div key={shop.id} className="mt-5">{tab === 'orders' ? <Orders shop={shop} /> : tab === 'products' ? <Products shop={shop} /> : <Requests shop={shop} />}</div>
    </>
  );
}

function CreateShop({ user, onDone }) {
  const [f, setF] = useState({ name: '', category: 'bakery', description: '', address: '', phone: '', whatsapp: '' });
  const [file, setFile] = useState(null);
  const [geo, setGeo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const locate = async () => { try { setGeo(await here()); } catch (x) { setErr(x.message); } };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const image_url = file ? await uploadImage(file) : null;
      const { error } = await supabase.from('shops').insert({ ...f, owner_id: user.id, image_url, lat: geo?.lat ?? null, lng: geo?.lng ?? null });
      if (error) throw error;
      onDone();
    } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <form onSubmit={save} className="mx-auto max-w-xl rounded-[32px] bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold">Open your shop</h1>
      <p className="mt-1 text-ink/70">Takes two minutes. You can add items next.</p>
      <div className="mt-5 space-y-3">
        <input required className="field" placeholder="Shop name" value={f.name} onChange={set('name')} />
        <select className="field" value={f.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <textarea className="field" rows={3} placeholder="What do you sell or offer?" value={f.description} onChange={set('description')} />
        <input className="field" placeholder="Area or address" value={f.address} onChange={set('address')} />
        <input className="field" placeholder="Phone, e.g. 90000 00001" value={f.phone} onChange={set('phone')} />
        <input className="field" placeholder="WhatsApp with country code, e.g. 919000000001" value={f.whatsapp} onChange={set('whatsapp')} />
        <button type="button" className="btn btn-ghost w-full" onClick={locate}>{geo ? 'Location saved ✓' : 'Use my location so people find me on the map'}</button>
        <label className="block text-sm font-semibold">Shop photo or logo
          <input type="file" accept="image/*" className="mt-1 block text-sm" onChange={(e) => setFile(e.target.files[0])} />
        </label>
      </div>
      {err && <p className="mt-3 text-sm text-tomato">{err}</p>}
      <button className="btn btn-accent mt-5 w-full" disabled={busy}>{busy ? 'Opening…' : 'Open my shop'}</button>
    </form>
  );
}

function Orders({ shop }) {
  const [orders, setOrders] = useState(null);
  const load = useCallback(() =>
    supabase.from('orders').select('*, order_items(*)').eq('shop_id', shop.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || [])), [shop.id]);
  useEffect(() => {
    load();
    const ch = supabase.channel('shop-orders-' + shop.id).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shop.id}` }, load).subscribe();
    const t = setInterval(load, 15000);
    return () => { clearInterval(t); supabase.removeChannel(ch); };
  }, [load, shop.id]);

  const setStatus = async (id, status) => { await supabase.from('orders').update({ status }).eq('id', id); load(); };
  if (!orders) return <p>Loading…</p>;
  if (!orders.length) return <p className="rounded-2xl bg-white p-8 text-center">No orders yet. Share your shop page link to get your first one.</p>;
  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <article key={o.id} className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold">{o.customer_name} · <a className="underline" href={`tel:${o.customer_phone}`}>{o.customer_phone}</a></p>
              <p className="text-xs text-ink/50">{new Date(o.created_at).toLocaleString()}</p>
            </div>
            <select className="rounded-full border border-line bg-paper px-3 py-1 text-sm font-semibold capitalize" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <ul className="mt-3 text-sm">{o.order_items.map((i) => <li key={i.id}>{i.qty} × {i.name}</li>)}</ul>
          {o.note && <p className="mt-2 rounded-lg bg-paper p-2 text-sm">“{o.note}”</p>}
          <p className="mt-2 font-extrabold">{rupee(o.total)}</p>
        </article>
      ))}
    </div>
  );
}

function Products({ shop }) {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ name: '', price: '', description: '' });
  const [file, setFile] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(() => supabase.from('products').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }).then(({ data }) => setList(data || [])), [shop.id]);
  useEffect(() => { load(); }, [load]);

  const pick = async (e) => {
    const file = e.target.files[0]; setFile(file); setImgUrl(null);
  };
  const fillAI = async () => {
    setErr(''); setAi(true);
    try {
      const url = imgUrl || (await uploadImage(file));
      setImgUrl(url);
      const r = await fetch('/api/ai-listing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl: url, category: shop.category }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'AI could not read the photo');
      setF({ name: j.name, description: j.description, price: String(j.price) });
    } catch (x) { setErr(x.message); }
    setAi(false);
  };
  const add = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const image_url = imgUrl || (file ? await uploadImage(file) : null);
      const { error } = await supabase.from('products').insert({ shop_id: shop.id, name: f.name, description: f.description, price: Number(f.price), image_url });
      if (error) throw error;
      setF({ name: '', price: '', description: '' }); setFile(null); setImgUrl(null); e.target.reset(); load();
    } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  const toggle = async (p) => { await supabase.from('products').update({ in_stock: !p.in_stock }).eq('id', p.id); load(); };
  const remove = async (p) => { await supabase.from('products').delete().eq('id', p.id); load(); };

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <form onSubmit={add} className="h-fit rounded-[28px] bg-white p-5 shadow-sm md:col-span-2">
        <h2 className="text-xl font-bold">Add an item or service</h2>
        <label className="mt-3 block text-sm font-semibold">Photo
          <input type="file" accept="image/*" className="mt-1 block text-sm" onChange={pick} />
        </label>
        <button type="button" className="btn btn-ghost mt-2 w-full" disabled={!file || ai} onClick={fillAI}>{ai ? 'Reading photo…' : 'Fill name, price and description with AI'}</button>
        <div className="mt-3 space-y-3">
          <input required className="field" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input required type="number" min="0" className="field" placeholder="Price in ₹" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          <textarea className="field" rows={3} placeholder="Short description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
        {err && <p className="mt-2 text-sm text-tomato">{err}</p>}
        <button className="btn btn-accent mt-4 w-full" disabled={busy}>{busy ? 'Adding…' : 'Add to my shop'}</button>
      </form>
      <div className="space-y-3 md:col-span-3">
        {list.length === 0 && <p className="rounded-2xl bg-white p-8 text-center">Nothing listed yet. Add your first item on the left.</p>}
        {list.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-paper">{p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}</div>
            <div className="flex-1"><p className="font-semibold">{p.name}</p><p className="text-sm text-ink/60">{rupee(p.price)}</p></div>
            <button className="btn btn-ghost" onClick={() => toggle(p)}>{p.in_stock ? 'Mark out of stock' : 'Mark in stock'}</button>
            <button className="text-sm text-tomato underline" onClick={() => remove(p)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Requests({ shop }) {
  const [needs, setNeeds] = useState(null);
  const [form, setForm] = useState({});
  const [err, setErr] = useState('');
  const load = useCallback(() => supabase.from('needs').select('*, need_responses(shop_id)').eq('status', 'open').eq('category', shop.category)
    .order('created_at', { ascending: false }).then(({ data }) => setNeeds(data || [])), [shop.category]);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const reply = async (id) => {
    setErr('');
    const f = form[id] || {};
    const { error } = await supabase.from('need_responses').insert({ need_id: id, shop_id: shop.id, message: f.message || null, price: f.price ? Number(f.price) : null });
    if (error) return setErr(error.message);
    load();
  };
  if (!needs) return <p>Loading…</p>;
  if (!needs.length) return <p className="rounded-[28px] bg-white p-8 text-center">No open requests in your category right now. New ones show up here by themselves.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {needs.map((n) => {
        const done = n.need_responses.some((r) => r.shop_id === shop.id);
        const f = form[n.id] || {};
        return (
          <article key={n.id} className="rounded-[28px] bg-white p-5 shadow-sm">
            <p className="text-sm text-ink/60">{n.when_text}{n.budget ? ` · budget ${rupee(n.budget)}` : ''}</p>
            <p className="mt-1 text-lg font-semibold leading-snug">{n.description}</p>
            {done ? <p className="hand mt-3 text-xl text-moss">reply sent</p> : (
              <div className="mt-3 space-y-2">
                <input className="field" type="number" min="0" placeholder="Your price in ₹" value={f.price || ''} onChange={(e) => setForm({ ...form, [n.id]: { ...f, price: e.target.value } })} />
                <input className="field" placeholder="Short message, e.g. I can come at 6 pm" value={f.message || ''} onChange={(e) => setForm({ ...form, [n.id]: { ...f, message: e.target.value } })} />
                <button className="btn btn-accent w-full" onClick={() => reply(n.id)}>I can help</button>
              </div>
            )}
          </article>
        );
      })}
      {err && <p className="text-sm text-tomato" role="alert">{err}</p>}
    </div>
  );
}
