import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Menu, X, LogOut } from 'lucide-react';
import { exportSectionAsPDF } from '@/report/exportUtils';
import ExportModal from '@/components/ExportModal';

export default function ReportNav({ sections, active, onNavigate, onLock }) {
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const list = (close) => (
    <div className="flex flex-col h-full py-8 px-4 min-w-[260px]">
      <div className="mb-6 px-2 flex items-center justify-between">
        <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase">Report Sections</p>
        {close && <button onClick={close} className="text-white/50 hover:text-white" aria-label="닫기"><X size={16} /></button>}
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar">
        {sections.map((s, idx) => (
          <div key={s.id} role="button" tabIndex={0} onClick={() => { onNavigate(idx); close && close(); }} onKeyDown={(e) => e.key === 'Enter' && onNavigate(idx)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group flex items-center justify-between cursor-pointer ${active === idx ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[10px] shrink-0 font-mono ${active === idx ? 'text-accent' : 'text-white/20'}`}>{String(idx + 1).padStart(2, '0')}</span>
              <span className="text-xs truncate">{s.ko}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); exportSectionAsPDF(s.id, s.label); }} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0" title="이 페이지 PDF 다운로드">
              <Download size={11} className="text-white/50 hover:text-blue" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
        <button onClick={() => { setExportOpen(true); close && close(); }} className="w-full bg-blue text-white rounded-lg py-2.5 text-xs font-semibold tracking-wide hover:bg-blue/90 transition-all flex items-center justify-center gap-2">
          <Download size={12} /> Export PDF
        </button>
        <p className="text-white/20 text-[10px] text-center">전체 또는 선택 페이지</p>
        <button onClick={() => { close && close(); onLock && onLock(); }} className="w-full mt-2 rounded-lg py-2 text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
          <LogOut size={12} /> 로그아웃 (잠금)
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <div className="hidden md:flex fixed right-0 top-0 h-full z-50 items-center" onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
        <motion.div animate={{ width: expanded ? 260 : 24 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full bg-ink/95 overflow-hidden flex flex-col" style={{ backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <AnimatePresence>
            {expanded && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">{list()}</motion.div>}
          </AnimatePresence>
          {!expanded && (
            <div className="flex flex-col items-center h-full py-8">
              <p className="text-accent text-[10px] tracking-[0.35em] uppercase mb-6 mt-1" style={{ writingMode: 'vertical-rl' }}>Sections</p>
              <div className="flex flex-col items-center justify-center gap-1 flex-1">
                {sections.map((_, idx) => (
                  <div key={idx} onClick={() => onNavigate(idx)} className={`rounded-full cursor-pointer transition-all ${active === idx ? 'w-1 h-4 bg-accent' : 'w-1 h-1 bg-white/20 hover:bg-white/40'}`} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
      {/* Mobile */}
      <button onClick={() => setMobileOpen(true)} className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-ink/90 text-white flex items-center justify-center" aria-label="목차 열기"><Menu size={18} /></button>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="md:hidden fixed inset-y-0 right-0 w-[85vw] max-w-sm z-[60] bg-ink text-white">
            {list(() => setMobileOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} totalPages={sections.length} />
    </>
  );
}
