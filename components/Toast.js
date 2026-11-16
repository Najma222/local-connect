'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const timers = useRef({});
  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setItems((x) => x.filter((t) => t.id !== id));
  }, []);
  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-2), { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3200);
  }, [dismiss]);
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-t)+0.75rem)] z-toast flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl ${t.type === 'error' ? 'bg-tomato text-white' : 'bg-ink text-white'}`} role={t.type === 'error' ? 'alert' : undefined}>
            <span className="min-w-0 flex-1 break-words">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss message" className="-my-2 -mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg">×</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
