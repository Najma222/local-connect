'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { pushState, enablePush, syncPush } from '@/lib/push';
import { useToast } from './Toast';
import { Spinner } from './States';

const DISMISS = 'lc-push-dismissed';

// "Turn on notifications" card. `always` (Profile) also shows the on / blocked state and cannot be dismissed.
export default function PushToggle({ always = false, className = '' }) {
  const { user, profile } = useApp();
  const toast = useToast();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!user) return;
    try { if (!always && localStorage.getItem(DISMISS)) setHidden(true); } catch {}
    pushState().then((s) => { setState(s); if (s === 'on') syncPush(); });
  }, [user, always]);

  if (!user || !state || hidden || state === 'off' || state === 'unsupported') return null;
  if (!always && (state === 'on' || state === 'denied')) return null;

  const isShop = profile?.role === 'shop';
  const what = isShop ? 'new orders, requests and when a customer picks you' : 'replies to your needs and order updates';
  const turnOn = async () => {
    if (busy) return;
    setBusy(true);
    try { await enablePush(); setState('on'); toast('Notifications are on'); }
    catch (e) { toast(e.message || 'Could not turn on notifications.', 'error'); setState(await pushState()); }
    setBusy(false);
  };
  const dismiss = () => { try { localStorage.setItem(DISMISS, '1'); } catch {} setHidden(true); };

  return (
    <div className={`flex items-start gap-3 rounded-[24px] bg-white p-4 text-sm card-shadow ${className}`} role="region" aria-label="Notifications">
      <div className="min-w-0 flex-1">
        {state === 'on' && <p className="font-semibold">🔔 Notifications are on for this phone.</p>}
        {state === 'denied' && <p className="leading-snug"><b>Notifications are blocked.</b> Allow them for Local Connect in your phone or browser settings.</p>}
        {state === 'install' && <p className="leading-snug"><b>Get notified on iPhone:</b> tap Share, then <b>Add to Home Screen</b>, then open Local Connect from your Home Screen and turn notifications on there.</p>}
        {state === 'ask' && (<>
          <p className="leading-snug"><b>Get a ping on your phone</b> for {what}, even when the app is closed.</p>
          <button type="button" className="btn btn-accent btn-sm mt-3" disabled={busy} onClick={turnOn}>{busy && <Spinner />}Turn on notifications</button>
        </>)}
      </div>
      {!always && <button type="button" onClick={dismiss} aria-label="Dismiss notifications prompt" className="tap -my-2 -mr-3 rounded-full text-lg">×</button>}
    </div>
  );
}
