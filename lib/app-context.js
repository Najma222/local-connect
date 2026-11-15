'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState({ shop: null, items: [] });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lc-cart') || 'null');
      if (saved) setCart(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('lc-cart', JSON.stringify(cart)); } catch {}
  }, [cart]);

  const loadProfile = useCallback(async (u) => {
    if (!u) return setProfile(null);
    const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      loadProfile(data.session?.user).finally(() => setReady(true));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      loadProfile(session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  // Cart belongs to ONE shop at a time. Returns false if the shop differs.
  // Pass force=true to replace the existing cart in the same update (used by
  // the "Start a new cart" dialog, where the old state would be stale).
  const addToCart = (product, shop, force = false) => {
    if (!force && cart.shop && cart.shop.id !== shop.id && cart.items.length) return false;
    setCart((c) => {
      const sameShop = c.shop && c.shop.id === shop.id;
      const items = force || !sameShop ? [] : [...c.items];
      const i = items.findIndex((x) => x.id === product.id);
      if (i >= 0) items[i] = { ...items[i], qty: items[i].qty + 1 };
      else items.push({ id: product.id, name: product.name, price: Number(product.price), qty: 1 });
      return { shop: { id: shop.id, name: shop.name }, items };
    });
    return true;
  };
  const setQty = (id, qty) =>
    setCart((c) => {
      const items = c.items.map((x) => (x.id === id ? { ...x, qty } : x)).filter((x) => x.qty > 0);
      return { shop: items.length ? c.shop : null, items };
    });
  const clearCart = () => setCart({ shop: null, items: [] });
  const count = cart.items.reduce((s, x) => s + x.qty, 0);
  const total = cart.items.reduce((s, x) => s + x.qty * x.price, 0);
  const qtyOf = (id) => cart.items.find((x) => x.id === id)?.qty || 0;

  return (
    <Ctx.Provider value={{ user, profile, ready, refreshProfile: () => loadProfile(user), cart, addToCart, setQty, clearCart, count, total, qtyOf }}>
      {children}
    </Ctx.Provider>
  );
}
