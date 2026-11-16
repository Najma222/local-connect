'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { CATEGORIES } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import { Empty, Spinner } from '@/components/States';

const WHEN = ['Right now', 'Today', 'This week', 'Flexible'];

export default function NeedPage() {
  const { user, ready } = useApp();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [cat, setCat] = useState('');
  const [desc, setDesc] = useState('');
  const [budget, setBudget] = useState('');
  const [when, setWhen] = useState('Today');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [canDictate, setCanDictate] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef(null);

  useEffect(() => { setCanDictate(!!(window.SpeechRecognition || window.webkitSpeechRecognition)); }, []);
  const dictate = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (listening) return rec.current?.stop();
    const r = new SR(); r.lang = 'en-IN'; r.interimResults = false;
    r.onresult = (e) => setDesc((d) => (d ? d + ' ' : '') + e.results[0][0].transcript);
    r.onend = () => setListening(false); r.onerror = () => setListening(false);
    rec.current = r; setListening(true); r.start();
  };

  if (ready && !user) return <Empty action={<Link href="/login?next=/need" className="btn">Log in</Link>}>Log in to post a need.</Empty>;

  const next = () => {
    setErr('');
    if (step === 1 && !cat) return setErr('Pick a category first.');
    if (step === 2 && desc.trim().length < 10) return setErr('Describe the need in a few words (10 characters or more).');
    setStep(step + 1);
  };
  const send = async () => {
    if (busy) return;
    setBusy(true); setErr('');
    const { error } = await supabase.from('needs').insert({ customer_id: user.id, category: cat, description: desc.trim(), budget: budget ? Number(budget) : null, when_text: when });
    setBusy(false);
    if (error) { toast('Could not send your need. Your details are still here.', 'error'); return setErr(error.message); }
    router.push('/needs?posted=1');
  };

  return (
    <div className="mx-auto mt-3 max-w-xl rounded-[36px] bg-[#F4E4DB] p-5 sm:p-6">
      <div className="flex items-center justify-between"><p className="text-sm text-ink/70">Step {step} of 3</p><Link href="/" aria-label="Close" className="go bg-white text-xl">×</Link></div>
      <div className="-mt-1 flex gap-1.5" aria-hidden="true">{[1, 2, 3].map((i) => <i key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-ink' : 'bg-white'}`} />)}</div>
      {step === 1 && (<>
        <h1 className="mt-5">What kind of <b>help</b>?</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => <button key={c.key} aria-pressed={cat === c.key} onClick={() => setCat(c.key)} className="tap rounded-full px-4 text-sm font-semibold" style={{ background: c.bg, color: c.fg, boxShadow: cat === c.key ? 'inset 0 0 0 3px #15141A' : 'none' }}>{c.label}</button>)}
        </div>
      </>)}
      {step === 2 && (<>
        <h1 className="mt-5">Tell us what's <b>needed</b></h1>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} placeholder="Kitchen tap is leaking under the sink. Need someone this evening." className="mt-5 w-full rounded-3xl bg-[#EAD3C6] p-4 text-base outline-none focus:ring-2 focus:ring-ink" autoComplete="off" aria-label="Describe your need" />
        {canDictate && <button type="button" onClick={dictate} className="btn btn-ghost mt-3 h-auto min-h-12 w-full whitespace-normal py-2">{listening ? 'Listening… tap to stop' : 'Speak instead (voice to text)'}</button>}
      </>)}
      {step === 3 && (<>
        <h1 className="mt-5">Budget and <b>time</b></h1>
        <label className="mt-5 block text-sm font-semibold">Budget in ₹ (optional)
          <input type="number" min="0" inputMode="numeric" autoComplete="off" value={budget} onChange={(e) => setBudget(e.target.value)} className="field mt-1" placeholder="500" />
        </label>
        <p className="mt-4 text-sm font-semibold">When?</p>
        <div className="mt-2 flex flex-wrap gap-2">{WHEN.map((w) => <button key={w} aria-pressed={when === w} onClick={() => setWhen(w)} className={`tap rounded-full px-4 text-sm font-semibold ${when === w ? 'bg-ink text-white' : 'bg-white'}`}>{w}</button>)}</div>
      </>)}
      {err && <p className="mt-3 text-sm font-semibold text-tomato" role="alert">{err}</p>}
      <p className="hand mt-5 -rotate-1 text-xl leading-snug">We'll ping verified neighbours nearby</p>
      <div className="mt-4 flex gap-2">
        {step > 1 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
        {step < 3 ? <button className="btn flex-1" onClick={next}>Continue</button> : <button className="btn min-w-0 flex-1 px-4" disabled={busy} onClick={send}>{busy && <Spinner />}{busy ? 'Sending…' : 'Send to nearby shops'}</button>}
      </div>
    </div>
  );
}
