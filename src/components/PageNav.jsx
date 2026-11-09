import React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function PageNav({ current, total, onPrev, onNext }) {
  const atStart = current === 0, atEnd = current === total - 1;
  const btn = (disabled, onClick, Icon, label) => (
    <motion.button whileHover={disabled ? {} : { scale: 1.15 }} whileTap={disabled ? {} : { scale: 0.9 }} onClick={onClick} disabled={disabled}
      className={`transition-colors ${disabled ? 'text-white/20 cursor-not-allowed' : 'text-white/70 hover:text-white'}`} aria-label={label}>
      <Icon size={18} />
    </motion.button>
  );
  return (
    <div className="fixed bottom-6 md:bottom-8 right-4 md:right-10 z-40 flex md:flex-col items-center gap-3 md:gap-2 rounded-xl"
      style={{ padding: '10px 12px', background: 'rgba(29,29,31,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
      <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-semibold font-mono" style={{ border: '1px solid rgba(255,255,255,0.35)' }}>
        {String(current + 1).padStart(2, '0')}
      </div>
      <span className="text-white/40 text-[10px] font-mono leading-none">/ {String(total).padStart(2, '0')}</span>
      <div className="hidden md:block h-px w-6 bg-white/10 my-1" />
      {btn(atStart, onPrev, ChevronUp, '이전 페이지')}
      {btn(atEnd, onNext, ChevronDown, '다음 페이지')}
    </div>
  );
}
