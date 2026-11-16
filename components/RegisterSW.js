'use client';
import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') {
      // Dev: make sure no stale worker or cache interferes.
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
      if (window.caches) caches.keys().then((ks) => ks.filter((k) => k.startsWith('lc-')).forEach((k) => caches.delete(k))).catch(() => {});
      return;
    }
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);
  return null;
}
