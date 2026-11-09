import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

async function verify(password) {
  try {
    const r = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    if (r.ok) { const j = await r.json(); return Boolean(j.valid); }
  } catch (_) { /* no serverless function (local dev / static preview) → fall through */ }
  const local = import.meta.env.VITE_REPORT_PASSWORD;
  return local ? password === local : true; // no password configured → open
}

export default function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); if (busy) return; setBusy(true);
    const ok = await verify(value);
    setBusy(false);
    if (ok) return onUnlock();
    setError(true); setShake(true); setValue('');
    setTimeout(() => setShake(false), 600); setTimeout(() => setError(false), 2000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-ink">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #FF3B30 0%, transparent 50%), radial-gradient(circle at 70% 50%, #007AFF 0%, transparent 50%)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 w-full max-w-sm mx-4">
        <div className="rounded-3xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
          <p className="text-xs tracking-[0.3em] text-white/50 uppercase mb-4">ARTBOX USA, Inc.</p>
          <h1 className="text-4xl font-bold text-white leading-tight">Protect</h1>
          <h1 className="text-4xl font-bold text-accent leading-tight">What You Build.</h1>
          <p className="text-white/40 text-sm mt-4 mb-8 tracking-wide">미국 출점 보험 자문 리포트 · 2026. 11</p>
          <form onSubmit={submit}>
            <motion.div animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0], transition: { duration: 0.5 } } : {}}>
              <input type="password" value={value} onChange={(e) => setValue(e.target.value)} placeholder="패스워드를 입력하세요" autoFocus
                className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-white/30 text-center tracking-widest text-lg focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all" />
              <AnimatePresence>{error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-accent text-sm mt-2">패스워드가 올바르지 않습니다</motion.p>}</AnimatePresence>
            </motion.div>
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={busy} className="w-full mt-5 bg-white text-ink rounded-xl py-4 font-semibold tracking-wide text-base hover:bg-white/90 disabled:opacity-60">
              {busy ? '확인 중…' : '열기'}
            </motion.button>
          </form>
          <p className="text-white/25 text-xs mt-6">eStyle Insurance Solutions Team · Confidential</p>
        </div>
      </motion.div>
    </div>
  );
}
