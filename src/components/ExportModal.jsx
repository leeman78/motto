import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Loader2 } from 'lucide-react';
import { exportAllSections, exportCustomPDF, parseRange } from '@/report/exportUtils';

export default function ExportModal({ open, onClose, totalPages }) {
  const [mode, setMode] = useState('all');
  const [range, setRange] = useState(`1-${totalPages}`);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  const run = async () => {
    if (busy) return; setBusy(true);
    try {
      const onProgress = (i, n) => setProgress(`${i}/${n} 페이지 렌더링 중…`);
      if (mode === 'all') await exportAllSections('ARTBOX-USA-Insurance-Advisory-Report', onProgress);
      else await exportCustomPDF(parseRange(range, totalPages), 'ARTBOX-USA-Insurance-Advisory-Selected', onProgress);
    } catch (e) { console.error(e); } finally { setBusy(false); setProgress(''); onClose(); }
  };

  const Radio = ({ on }) => <span className="w-4 h-4 rounded-full shrink-0" style={{ border: on ? '5px solid #007AFF' : '1.5px solid #888', background: '#2b2b2b' }} />;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md mx-4 rounded-2xl overflow-hidden text-white" style={{ background: '#2b2b2b', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
            <div className="relative px-6 pt-6 pb-4"><h2 className="text-lg font-semibold">리포트 내보내기</h2><button onClick={onClose} className="absolute top-5 right-5 text-white/60 hover:text-white"><X size={18} /></button></div>
            <div className="h-px bg-white/10" />
            <div className="px-6 py-6 space-y-6">
              <div>
                <p className="text-sm mb-3">형식</p>
                <div className="flex items-center gap-3 rounded-lg py-4 px-4" style={{ background: '#3b3b3b', border: '1.5px solid #007AFF' }}>
                  <FileText size={26} className="text-accent" /><span className="text-sm font-medium text-blue">PDF</span><span className="ml-auto text-white/40 text-xs">화면 그대로 페이지별 캡처</span>
                </div>
              </div>
              <div>
                <p className="text-sm mb-3">페이지 범위</p>
                <div className="space-y-3">
                  <button onClick={() => setMode('all')} className="flex items-center gap-3 w-full text-left"><Radio on={mode === 'all'} /><span className="text-sm">전체 (1–{totalPages})</span></button>
                  <button onClick={() => setMode('custom')} className="flex items-center gap-3 w-full text-left"><Radio on={mode === 'custom'} /><span className="text-sm">선택 범위</span></button>
                  <AnimatePresence>
                    {mode === 'custom' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pl-7">
                        <input value={range} onChange={(e) => setRange(e.target.value)} placeholder="예: 1-5, 8, 12-15" className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: '#1d1d1d', border: '1.5px solid #444' }} />
                        <p className="text-white/40 text-xs mt-2">콤마로 구분 · 예: 1-5, 8, 12-15</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={run} disabled={busy} className="w-full rounded-lg py-3 font-semibold text-sm bg-blue hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2">
                {busy ? <><Loader2 size={16} className="animate-spin" />{progress || '내보내는 중…'}</> : 'PDF 내보내기'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
