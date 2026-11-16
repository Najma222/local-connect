'use client';
import { useEffect, useState } from 'react';

const KEY = 'lc-a2hs-dismissed';

export default function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const ua = navigator.userAgent;
      const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(ua);
      const standalone = navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
      if (ios && safari && !standalone && !localStorage.getItem(KEY)) setShow(true);
    } catch {}
  }, []);

  if (!show) return null;
  const dismiss = () => {
    try { localStorage.setItem(KEY, '1'); } catch {}
    setShow(false);
  };

  return (
    <div className="bottom-above-nav fixed inset-x-0 z-fab flex justify-center px-4" role="region" aria-label="Install Local Connect">
      <div className="flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm card-shadow">
        <p className="min-w-0 flex-1 leading-snug">
          Install Local Connect: tap{' '}
          <svg aria-label="Share" role="img" className="inline-block h-4 w-4 align-[-3px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12M8 7l4-4 4 4M5 11v9h14v-9" />
          </svg>{' '}
          then <b>Add to Home Screen</b>.
        </p>
        <button type="button" onClick={dismiss} aria-label="Dismiss install hint" className="tap -my-2 -mr-3 rounded-full text-lg">×</button>
      </div>
    </div>
  );
}
