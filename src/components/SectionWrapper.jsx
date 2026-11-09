import React from 'react';
import { motion } from 'framer-motion';

export default function SectionWrapper({ children, dark = false, className = '' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`min-h-screen flex flex-col ${dark ? 'bg-ink text-white' : 'bg-paper text-ink'} ${className}`}
    >
      <div className="w-full max-w-6xl mx-auto px-6 md:px-16 py-20 md:py-24 flex-1 flex flex-col">{children}</div>
    </motion.section>
  );
}

export function Label({ number, text, dark = false, accent = false }) {
  return (
    <p className={`text-[11px] tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${accent ? 'text-accent' : dark ? 'text-white/40' : 'text-ink/40'}`}>
      <span className="font-mono font-semibold">{String(number).padStart(2, '0')}</span>
      <span className="opacity-50">·</span>
      <span>{text}</span>
    </p>
  );
}

export function H2({ children, dark = false, className = '' }) {
  return <h2 className={`text-4xl md:text-6xl font-bold tracking-[-0.02em] leading-[1.05] mb-3 ${dark ? 'text-white' : 'text-ink'} ${className}`}>{children}</h2>;
}

export function Sub({ children, dark = false, className = '' }) {
  return <p className={`text-sm md:text-base max-w-3xl ${dark ? 'text-white/50' : 'text-ink/50'} ${className}`}>{children}</p>;
}

export function Divider({ dark = false }) {
  return <div className={`w-full h-px ${dark ? 'bg-white/10' : 'bg-ink/10'} my-8 md:my-10`} />;
}

export function Card({ children, dark = false, className = '', hover = true }) {
  const M = hover ? motion.div : 'div';
  return (
    <M
      {...(hover ? { whileHover: { y: -4 }, transition: { type: 'spring', stiffness: 300, damping: 22 } } : {})}
      className={`rounded-2xl p-6 md:p-7 ${dark ? 'bg-white/5 border border-white/10' : 'bg-white border border-ink/[0.08]'} ${className}`}
      style={dark ? {} : { boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
    >
      {children}
    </M>
  );
}

export function Footer({ dark = false, page }) {
  return (
    <div className={`mt-auto pt-10 flex justify-between items-end text-[11px] ${dark ? 'text-white/30' : 'text-ink/30'}`}>
      <p>ARTBOX USA, Inc. · 보험 자문 리포트 · eStyle Insurance Solutions Team · working with WTW · 2026. 11. 9 · v{__APP_VERSION__}</p>
      <p className="font-mono">{String(page).padStart(2, '0')}</p>
    </div>
  );
}
