'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function Form() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('customer');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setInfo(''); setBusy(true);
    const res = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
      : await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name, role } } });
    setBusy(false);
    if (res.error) return setErr(res.error.message);
    if (!res.data.session) return setInfo('Account created. Check your email to confirm, then log in.');
    router.push(role === 'shop' && mode === 'signup' ? '/dashboard' : next);
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-md rounded-[32px] bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold">{mode === 'login' ? 'Welcome back' : 'Join Local Connect'}</h1>
      {mode === 'signup' && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          {[['customer', 'I want to buy'], ['shop', 'I run a shop']].map(([k, l]) => (
            <button type="button" key={k} onClick={() => setRole(k)}
              className={`rounded-xl p-3 text-sm font-semibold ring-1 ${role === k ? 'bg-marigold ring-marigold' : 'ring-line'}`}>{l}</button>
          ))}
        </div>
      )}
      <div className="mt-4 space-y-3">
        {mode === 'signup' && <input required className="field" placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}
        <input required type="email" className="field" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input required minLength={6} type="password" className="field" placeholder="Password (6+ characters)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      </div>
      {err && <p className="mt-3 text-sm text-tomato" role="alert">{err}</p>}
      {info && <p className="mt-3 text-sm text-moss">{info}</p>}
      <button className="btn mt-5 w-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
      <button type="button" className="mt-4 w-full text-sm underline" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
      </button>
    </form>
  );
}
export default function LoginPage() { return <Suspense><Form /></Suspense>; }
