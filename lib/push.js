'use client';
import { supabase } from './supabase';

// Web Push for Android (Chrome, installed or not) and iPhone (iOS 16.4+, only when added to the Home Screen).
const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function toKey(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// The worker is only registered in production builds, so do not wait forever in dev.
const worker = () => Promise.race([
  navigator.serviceWorker.ready,
  new Promise((_, rej) => setTimeout(() => rej(new Error('Notifications work in the deployed app, not in dev mode.')), 6000)),
]);

// Non-blocking lookup for checks (returns nothing in dev, where no worker is registered).
const existing = async () => (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription() ?? null;

async function save(sub) {
  const j = sub.toJSON();
  const { error } = await supabase.rpc('save_push_subscription', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
  if (error) throw error;
}

// 'off' (not configured) | 'unsupported' | 'install' (iPhone, not on Home Screen) | 'denied' | 'ask' | 'on'
export async function pushState() {
  if (!KEY) return 'off';
  if (isIOS() && !isStandalone()) return 'install';
  if (!supported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission !== 'granted') return 'ask';
  try { return (await existing()) ? 'on' : 'ask'; } catch { return 'ask'; }
}

// Must be called straight from a tap: iPhone only shows the permission prompt for a user gesture.
export async function enablePush() {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error(perm === 'denied' ? 'Notifications are blocked. Allow them in your phone settings.' : 'Notifications were not turned on.');
  const reg = await worker();
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(KEY) }));
  await save(sub);
}

// Re-link this device to whoever is logged in now (cheap; safe to call on every visit).
export async function syncPush() {
  try {
    if (!KEY || !supported() || Notification.permission !== 'granted') return;
    const sub = await existing();
    if (sub) await save(sub);
  } catch {}
}

// On log out: stop sending this account's notifications to this device.
export async function forgetPush() {
  try {
    if (!KEY || !supported()) return;
    const sub = await existing();
    if (sub) await supabase.rpc('remove_push_subscription', { p_endpoint: sub.endpoint });
  } catch {}
}
