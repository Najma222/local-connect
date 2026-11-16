'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, uploadImage } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { CATEGORIES, STATUSES, catOf, rupee } from '@/lib/constants';
import { here } from '@/lib/geo';
import Dialog from '@/components/Dialog';
import ItemDoodle from '@/components/ItemDoodle';
import { useToast } from '@/components/Toast';
import { Loading, Empty, ErrorState, Spinner } from '@/components/States';

const FILE = 'mt-1 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-soft file:px-4 file:font-semibold file:text-ink';

export default function Dashboard() {
  const { user, profile, ready } = useApp();
  const [shops, setShops] = useState(undefined);
  const [shopId, setShopId] = useState(null);
  const [tab, setTab] = useState('orders');
  const [loadErr, setLoadErr] = useState('');

  const loadShops = useCallback(async () => {
    const { data, error } = await supabase.from('shops').select('*').eq('owner_id', user.id).order('created_at');
    if (error) { setLoadErr(error.message || 'Could not load your shop.'); return setShops((x) => x || null); }
    setLoadErr('');
    setShops(data || []);
  }, [user]);
  useEffect(() => { if (user) loadShops(); }, [user, loadShops]);

  if (ready && !user) return <Empty action={<Link href="/login?next=/dashboard" className="btn">Log in</Link>}>Log in to manage your shop.</Empty>;
  if (ready && profile && profile.role !== 'shop') return <Empty action={<Link href="/profile" className="btn btn-sm">Go to profile</Link>}>This page is for shop accounts. Switch to seller mode from your profile to open a shop.</Empty>;
  if (loadErr && !shops) return <ErrorState message={`We could not load your shop. ${loadErr}`} onRetry={loadShops} />;
  if (!shops) return <Loading label="Loading your shop…" rows={2} />;
  if (shops.length === 0) return <CreateShop user={user} onDone={loadShops} />;

  const shop = shops.find((s) => s.id === shopId) || shops[0];
  const TABS = [['orders', 'Orders'], ['products', 'Items & services'], ['requests', 'Requests']];

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <h1 className="break-words text-3xl font-bold">{shop.name}</h1>
          <p className="text-sm text-ink/70">{shop.verified ? '✓ Verified shop' : 'Not verified yet. An admin will review your shop.'}</p>
        </div>
        <Link href={`/shop/${shop.id}`} className="btn btn-ghost btn-sm">See my public page</Link>
      </div>
      {shops.length > 1 && (
        <label className="mt-4 block max-w-md text-sm font-semibold">Managing shop
          <select className="field mt-1" value={shop.id} onChange={(e) => { setShopId(e.target.value); setTab('orders'); }}>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
          </select>
        </label>
      )}
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Dashboard sections">
        {TABS.map(([t, label]) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)} className={`tap rounded-full px-4 text-sm font-semibold ring-1 sm:px-5 ${tab === t ? 'bg-ink text-white ring-ink' : 'bg-white ring-line'}`}>{label}</button>
        ))}
      </div>
      <div key={shop.id} className="mt-5">{tab === 'orders' ? <Orders shop={shop} /> : tab === 'products' ? <Products shop={shop} /> : <Requests shop={shop} />}</div>
    </>
  );
}

function CreateShop({ user, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', category: 'bakery', description: '', address: '', phone: '', whatsapp: '' });
  const [file, setFile] = useState(null);
  const [geo, setGeo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState('');
  const locate = async () => {
    if (locating) return;
    setLocating(true);
    try { setGeo(await here()); toast('Location saved'); } catch (x) { setErr(x.message); toast(x.message, 'error'); }
    setLocating(false);
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr('');
    try {
      const image_url = file ? await uploadImage(file) : null;
      const { error } = await supabase.from('shops').insert({ ...f, owner_id: user.id, image_url, lat: geo?.lat ?? null, lng: geo?.lng ?? null });
      if (error) throw error;
      toast('Your shop is open!');
      onDone();
    } catch (x) { setErr(x.message); toast('Could not open your shop. Your details are still here.', 'error'); setBusy(false); }
  };
  return (
    <form onSubmit={save} className="mx-auto mt-4 max-w-xl rounded-[32px] bg-white p-5 shadow-sm sm:p-8">
      <h1 className="text-3xl font-bold">Open your shop</h1>
      <p className="mt-1 text-ink/70">Takes two minutes. You can add items next.</p>
      <div className="mt-5 space-y-3">
        <input required className="field" placeholder="Shop name" aria-label="Shop name" autoComplete="organization" value={f.name} onChange={set('name')} />
        <select className="field" aria-label="Category" value={f.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <textarea className="field" rows={3} placeholder="What do you sell or offer?" aria-label="Description" value={f.description} onChange={set('description')} />
        <input className="field" placeholder="Area or address" aria-label="Area or address" autoComplete="street-address" value={f.address} onChange={set('address')} />
        <input className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone, e.g. 90000 00001" aria-label="Phone" value={f.phone} onChange={set('phone')} />
        <input className="field" type="tel" inputMode="numeric" autoComplete="off" placeholder="WhatsApp with country code, e.g. 919000000001" aria-label="WhatsApp number with country code" value={f.whatsapp} onChange={set('whatsapp')} />
        <button type="button" className="btn btn-ghost h-auto min-h-12 w-full whitespace-normal py-2 text-center" disabled={locating} onClick={locate}>{locating && <Spinner />}{geo ? 'Location saved ✓' : 'Use my location so people find me on the map'}</button>
        <label className="block text-sm font-semibold">Shop photo or logo
          <input type="file" accept="image/*" className={FILE} onChange={(e) => setFile(e.target.files[0])} />
        </label>
      </div>
      {err && <p className="mt-3 break-words text-sm text-tomato" role="alert">{err}</p>}
      <button className="btn btn-accent mt-5 w-full" disabled={busy}>{busy && <Spinner />}{busy ? 'Opening…' : 'Open my shop'}</button>
    </form>
  );
}

function Orders({ shop }) {
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [pending, setPending] = useState(null);
  const load = useCallback(() =>
    supabase.from('orders').select('*, order_items(*)').eq('shop_id', shop.id).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { setLoadErr(error.message || 'Could not load orders.'); return setOrders((x) => x || []); }
        setLoadErr(''); setOrders(data || []);
      }), [shop.id]);
  useEffect(() => {
    load();
    const ch = supabase.channel('shop-orders-' + shop.id).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shop.id}` }, load).subscribe();
    const t = setInterval(load, 15000);
    return () => { clearInterval(t); supabase.removeChannel(ch); };
  }, [load, shop.id]);

  const setStatus = async (id, status) => {
    if (pending) return;
    setPending(id);
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    setPending(null);
    if (error) toast('Could not update the order. Please try again.', 'error'); else toast(`Order marked ${status}`);
    load();
  };
  if (!orders) return <Loading label="Loading orders…" rows={2} />;
  if (loadErr && !orders.length) return <ErrorState message={`We could not load orders. ${loadErr}`} onRetry={load} />;
  if (!orders.length) return <Empty>No orders yet. Share your shop page link to get your first one.</Empty>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {orders.map((o) => (
        <article key={o.id} className="min-w-0 rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 basis-44">
              <p className="break-words font-bold">{o.customer_name}</p>
              <a className="tap -ml-1 justify-start px-1 underline" href={`tel:${o.customer_phone}`}>{o.customer_phone}</a>
              <p className="text-xs text-ink/70">{new Date(o.created_at).toLocaleString()}</p>
            </div>
            <select aria-label={`Status for order from ${o.customer_name}`} disabled={pending === o.id} className="h-11 rounded-full border border-line bg-paper px-3 text-sm font-semibold capitalize" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <ul className="mt-3 space-y-1 text-sm">{o.order_items.map((i) => <li key={i.id} className="break-words">{i.qty} × {i.name}</li>)}</ul>
          {o.note && <p className="mt-2 break-words rounded-lg bg-paper p-2 text-sm">“{o.note}”</p>}
          <p className="mt-2 font-extrabold">{rupee(o.total)}</p>
        </article>
      ))}
    </div>
  );
}

function Products({ shop }) {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [f, setF] = useState({ name: '', price: '', description: '' });
  const [file, setFile] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(false);
  const [err, setErr] = useState('');
  const [pending, setPending] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => supabase.from('products').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (error) { setLoadErr(error.message || 'Could not load items.'); return setList((x) => x || []); }
      setLoadErr(''); setList(data || []);
    }), [shop.id]);
  useEffect(() => { load(); }, [load]);

  const pick = async (e) => {
    const file = e.target.files[0]; setFile(file); setImgUrl(null);
  };
  const fillAI = async () => {
    if (ai) return;
    setErr(''); setAi(true);
    try {
      const url = imgUrl || (await uploadImage(file));
      setImgUrl(url);
      const r = await fetch('/api/ai-listing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl: url, category: shop.category }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'AI could not read the photo');
      setF((prev) => ({ name: j.name ?? prev.name, description: j.description ?? prev.description, price: j.price != null ? String(j.price) : prev.price }));
      toast('Filled in from your photo. Check it before adding.');
    } catch (x) { setErr(x.message); toast('AI could not fill this in. You can type it yourself.', 'error'); }
    setAi(false);
  };
  const add = async (e) => {
    e.preventDefault();
    if (busy) return;
    const form = e.target;
    setBusy(true); setErr('');
    try {
      const image_url = imgUrl || (file ? await uploadImage(file) : null);
      const { error } = await supabase.from('products').insert({ shop_id: shop.id, name: f.name, description: f.description, price: Number(f.price), image_url });
      if (error) throw error;
      setF({ name: '', price: '', description: '' }); setFile(null); setImgUrl(null); form.reset(); load();
      toast('Item added to your shop');
    } catch (x) { setErr(x.message); toast('Could not add the item. Your details are still here.', 'error'); }
    setBusy(false);
  };
  const toggle = async (p) => {
    if (pending) return;
    setPending(p.id);
    const { error } = await supabase.from('products').update({ in_stock: !p.in_stock }).eq('id', p.id);
    setPending(null);
    if (error) toast('Could not update stock. Please try again.', 'error'); else toast(`${p.name} is now ${p.in_stock ? 'out of stock' : 'in stock'}`);
    load();
  };
  const remove = async () => {
    const p = confirm;
    if (!p || pending) return;
    setPending(p.id);
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    setPending(null); setConfirm(null);
    if (error) toast('Could not delete the item. Please try again.', 'error'); else toast(`Deleted ${p.name}`);
    load();
  };

  return (
    <div className="grid gap-6 md:grid-cols-5 lg:gap-8">
      <form onSubmit={add} className="h-fit min-w-0 rounded-[28px] bg-white p-5 shadow-sm md:sticky md:top-4 md:col-span-2">
        <h2 className="text-xl font-bold">Add an item or service</h2>
        <label className="mt-3 block text-sm font-semibold">Photo
          <input type="file" accept="image/*" className={FILE} onChange={pick} />
        </label>
        <button type="button" className="btn btn-ghost mt-2 h-auto min-h-12 w-full whitespace-normal py-2 text-center" disabled={!file || ai} onClick={fillAI}>{ai && <Spinner />}{ai ? 'Reading photo…' : 'Fill name, price and description with AI'}</button>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-paper p-2">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">{imgUrl ? <img src={imgUrl} alt="" width="56" height="56" className="h-full w-full object-cover" /> : <ItemDoodle name={f.name} description={f.description} fallback={catOf(shop.category).doodle} blob={catOf(shop.category).blob} size="100%" />}</div>
          <p className="min-w-0 text-sm text-ink/70">{imgUrl ? 'Your photo will be shown.' : 'No photo? We draw a little doodle from the name.'}</p>
        </div>
        <div className="mt-3 space-y-3">
          <input required className="field" placeholder="Name" aria-label="Name" autoComplete="off" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input required type="number" min="0" inputMode="decimal" className="field" placeholder="Price in ₹" aria-label="Price in rupees" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          <textarea className="field" rows={3} placeholder="Short description" aria-label="Short description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
        {err && <p className="mt-2 break-words text-sm text-tomato" role="alert">{err}</p>}
        <button className="btn btn-accent mt-4 w-full" disabled={busy}>{busy && <Spinner />}{busy ? 'Adding…' : 'Add to my shop'}</button>
      </form>
      <div className="min-w-0 space-y-3 md:col-span-3">
        {list === null && <Loading label="Loading items…" />}
        {loadErr && <ErrorState message={`We could not load items. ${loadErr}`} onRetry={load} />}
        {list && list.length === 0 && !loadErr && <Empty>Nothing listed yet. Add your first item above.</Empty>}
        {(list || []).map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-paper">{p.image_url ? <img src={p.image_url} alt="" width="56" height="56" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <ItemDoodle name={p.name} description={p.description} fallback={catOf(shop.category).doodle} blob={catOf(shop.category).blob} size="100%" />}</div>
            <div className="min-w-0 flex-1 basis-32"><p className="line-clamp-2 break-words font-semibold">{p.name}</p><p className="text-sm text-ink/70">{rupee(p.price)}{p.in_stock ? '' : ' · out of stock'}</p></div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <button className="btn btn-ghost btn-sm" disabled={pending === p.id} onClick={() => toggle(p)}>{p.in_stock ? 'Mark out of stock' : 'Mark in stock'}</button>
              <button className="tap px-2 text-sm text-tomato underline" disabled={pending === p.id} onClick={() => setConfirm(p)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {confirm && (
        <Dialog title="Delete this item?" onClose={() => setConfirm(null)}>
          <p className="mt-2 break-words text-sm">“{confirm.name}” will be removed from your shop. This cannot be undone.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button className="btn btn-ghost flex-1" data-autofocus onClick={() => setConfirm(null)}>Keep it</button>
            <button className="btn flex-1 bg-tomato" disabled={!!pending} onClick={remove}>{pending && <Spinner />}Delete</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Requests({ shop }) {
  const toast = useToast();
  const [needs, setNeeds] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [form, setForm] = useState({});
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(null);
  const load = useCallback(() => supabase.from('needs').select('*, need_responses(shop_id)').eq('status', 'open').eq('category', shop.category)
    .order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) { setLoadErr(error.message || 'Could not load requests.'); return setNeeds((x) => x || []); }
      setLoadErr(''); setNeeds(data || []);
    }), [shop.category]);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const reply = async (id) => {
    if (sending) return;
    setErr(''); setSending(id);
    const f = form[id] || {};
    const { error } = await supabase.from('need_responses').insert({ need_id: id, shop_id: shop.id, message: f.message || null, price: f.price ? Number(f.price) : null });
    setSending(null);
    if (error) { toast('Could not send your reply. Please try again.', 'error'); return setErr(error.message); }
    toast('Reply sent');
    load();
  };
  if (!needs) return <Loading label="Loading requests…" rows={2} />;
  if (loadErr && !needs.length) return <ErrorState message={`We could not load requests. ${loadErr}`} onRetry={load} />;
  if (!needs.length) return <Empty>No open requests in your category right now. New ones show up here by themselves.</Empty>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {needs.map((n) => {
        const done = n.need_responses.some((r) => r.shop_id === shop.id);
        const f = form[n.id] || {};
        return (
          <article key={n.id} className="min-w-0 rounded-[28px] bg-white p-5 shadow-sm">
            <p className="break-words text-sm text-ink/70">{n.when_text}{n.budget ? ` · budget ${rupee(n.budget)}` : ''}</p>
            <p className="mt-1 break-words text-lg font-semibold leading-snug">{n.description}</p>
            {done ? <p className="hand mt-3 text-xl text-moss">reply sent</p> : (
              <div className="mt-3 space-y-2">
                <input className="field" type="number" min="0" inputMode="decimal" placeholder="Your price in ₹" aria-label="Your price in rupees" value={f.price || ''} onChange={(e) => setForm({ ...form, [n.id]: { ...f, price: e.target.value } })} />
                <input className="field" placeholder="Short message, e.g. I can come at 6 pm" aria-label="Short message" autoComplete="off" value={f.message || ''} onChange={(e) => setForm({ ...form, [n.id]: { ...f, message: e.target.value } })} />
                <button className="btn btn-accent w-full" disabled={sending === n.id} onClick={() => reply(n.id)}>{sending === n.id && <Spinner />}I can help</button>
              </div>
            )}
          </article>
        );
      })}
      {err && <p className="break-words text-sm text-tomato md:col-span-2" role="alert">{err}</p>}
    </div>
  );
}
