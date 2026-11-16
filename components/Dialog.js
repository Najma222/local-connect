'use client';
import { useEffect, useId, useRef } from 'react';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function Dialog({ title, children, onClose, labelId }) {
  const auto = useId();
  const tid = labelId || auto;
  const box = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement;
    const first = box.current?.querySelector('[data-autofocus]') || box.current?.querySelector(FOCUSABLE);
    first?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const els = [...box.current.querySelectorAll(FOCUSABLE)];
      if (!els.length) return;
      const a = els[0], z = els[els.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, []);

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-ink/50 p-4 pb-[calc(var(--safe-b)+1rem)] sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby={tid} className="sheet-scroll w-full max-w-sm rounded-3xl bg-white p-6">
        <h3 id={tid} className="text-lg font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}
