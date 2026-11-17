'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useApp } from './app-context';

const ZERO = { replies: 0, requests: 0, newOrders: 0, loaded: false };
// Call after an action that changes a badge count, so every badge refreshes now instead of waiting.
export const refreshBadges = () => window.dispatchEvent(new Event('lc-badges'));

// Small counters for the navigation: replies waiting for a customer, open requests and new orders for a shop.
export function useBadges() {
  const { user, profile } = useApp();
  const [b, setB] = useState(ZERO);
  const isShop = profile?.role === 'shop';

  const load = useCallback(async () => {
    if (!user) return setB(ZERO);
    const out = { ...ZERO, loaded: true };
    try {
      const { data: mine } = await supabase.from('needs').select('id, need_responses(status)').eq('customer_id', user.id).eq('status', 'open');
      out.replies = (mine || []).filter((n) => (n.need_responses || []).some((r) => r.status === 'pending')).length;
      if (isShop) {
        const { data: shops } = await supabase.from('shops').select('id, category').eq('owner_id', user.id);
        if (shops?.length) {
          const ids = shops.map((s) => s.id);
          const cats = [...new Set([...shops.map((s) => s.category), 'other'])];
          const { data: open } = await supabase.from('needs').select('id, customer_id, need_responses(shop_id)').eq('status', 'open').in('category', cats);
          out.requests = (open || []).filter((n) => n.customer_id !== user.id && !(n.need_responses || []).some((r) => ids.includes(r.shop_id))).length;
          const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true }).in('shop_id', ids).eq('status', 'new');
          out.newOrders = count || 0;
        }
      }
    } catch {}
    setB(out);
  }, [user, isShop]);

  useEffect(() => {
    load();
    // Live: any change we are allowed to see (RLS filters it) refreshes the counts, debounced.
    let soon;
    const kick = () => { clearTimeout(soon); soon = setTimeout(load, 400); };
    const ch = user ? supabase.channel('badges-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'needs' }, kick)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'need_responses' }, kick)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, kick)
      .subscribe() : null;
    const t = setInterval(load, 30000); // fallback if realtime drops
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('lc-badges', load);
    return () => {
      clearTimeout(soon); clearInterval(t);
      if (ch) supabase.removeChannel(ch);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('lc-badges', load);
    };
  }, [load, user]);
  return b;
}
