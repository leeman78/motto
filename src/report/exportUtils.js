import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SECTIONS } from '@/report/sections';

const IDS = SECTIONS.map((s) => s.id);

// framer-motion leaves off-screen sections at opacity:0 → force visible during capture
function forceVisible() {
  const style = document.createElement('style');
  style.textContent = '* { opacity: 1 !important; animation: none !important; transition: none !important; } .no-export { display: none !important; }';
  document.head.appendChild(style);
  return () => style.remove();
}

async function capture(ids, filename, onProgress) {
  const restore = forceVisible();
  await new Promise((r) => setTimeout(r, 150));
  let pdf = null; let i = 0;
  for (const id of ids) {
    const el = document.getElementById(id); if (!el) continue;
    i += 1; onProgress && onProgress(i, ids.length);
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#FBFBFD', logging: false, windowWidth: Math.max(1280, document.documentElement.clientWidth) });
      const w = canvas.width, h = canvas.height, o = w > h ? 'landscape' : 'portrait';
      const img = canvas.toDataURL('image/jpeg', 0.92);
      if (!pdf) pdf = new jsPDF({ orientation: o, unit: 'px', format: [w, h], hotfixes: ['px_scaling'] }); else pdf.addPage([w, h], o);
      pdf.addImage(img, 'JPEG', 0, 0, w, h);
    } catch (e) { console.error('capture failed', id, e); }
  }
  restore();
  if (pdf) pdf.save(`${filename}.pdf`);
}

export const exportAllSections = (name, onProgress) => capture(IDS, name, onProgress);
export const exportSectionAsPDF = (id, label) => capture([id], `ARTBOX-USA-${label.replace(/\s+/g, '-')}`);
export const exportCustomPDF = (nums, name, onProgress) => capture(nums.map((n) => IDS[n - 1]).filter(Boolean), name, onProgress);

export function parseRange(str, max) {
  const out = new Set();
  for (const p of str.split(/[,\s]+/).filter(Boolean)) {
    if (p.includes('-')) { const [a, b] = p.split('-').map(Number); if (!isNaN(a) && !isNaN(b)) for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (i >= 1 && i <= max) out.add(i); }
    else { const n = Number(p); if (!isNaN(n) && n >= 1 && n <= max) out.add(n); }
  }
  return [...out].sort((a, b) => a - b);
}
