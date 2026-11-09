import React, { useEffect, useRef, useState } from 'react';
import { SECTIONS } from '@/report/sections';
import PasswordGate from '@/components/PasswordGate';
import ReportNav from '@/components/ReportNav';
import PageNav from '@/components/PageNav';
import { LogOut } from 'lucide-react';

export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('artbox-report-unlocked') === '1');
  const [active, setActive] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    if (!unlocked) return;
    const observers = refs.current.map((el, idx) => {
      if (!el) return null;
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(idx); }, { threshold: 0.35 });
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o && o.disconnect());
  }, [unlocked]);

  useEffect(() => {
    if (!unlocked) return;
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight') { e.preventDefault(); scrollTo(active + 1); }
      if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') { e.preventDefault(); scrollTo(active - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const scrollTo = (idx) => {
    const i = Math.max(0, Math.min(SECTIONS.length - 1, idx));
    refs.current[i]?.scrollIntoView({ behavior: 'smooth' });
  };

  const lock = () => { sessionStorage.removeItem('artbox-report-unlocked'); setUnlocked(false); window.scrollTo(0, 0); };

  if (!unlocked) return <PasswordGate onUnlock={() => { sessionStorage.setItem('artbox-report-unlocked', '1'); setUnlocked(true); }} />;

  return (
    <div className="bg-paper min-h-screen">
      <ReportNav sections={SECTIONS} active={active} onNavigate={scrollTo} onLock={lock} />
      <PageNav current={active} total={SECTIONS.length} onPrev={() => scrollTo(active - 1)} onNext={() => scrollTo(active + 1)} />
      <button onClick={lock} className="fixed bottom-6 md:bottom-8 left-4 md:left-8 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white/80 hover:text-white no-export" style={{ background: 'rgba(29,29,31,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }} aria-label="로그아웃">
        <LogOut size={14} /> 로그아웃
      </button>
      <div className="md:pr-6">
        {SECTIONS.map((s, idx) => {
          const Comp = s.component;
          return (
            <div key={s.id} id={s.id} ref={(el) => { refs.current[idx] = el; }}>
              <Comp index={idx + 1} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
