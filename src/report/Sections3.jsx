import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, FileSpreadsheet, Presentation, FileText } from 'lucide-react';
import SectionWrapper, { Label, H2, Sub, Card, Footer, Divider } from '@/components/SectionWrapper';

export function Program({ index }) {
  const stages = [
    { k: '0단계 · 지금 (2026.11~)', t: '법인 운영 보호', s: '효력 개시 ‘ASAP’ 요청에 해당', rows: [['General Liability + 제품 책임 + HNOA', '$1M / $2M'], ['Workers’ Comp (대표 · 파견 MD)', '법정 + EL $1M'], ['D&O', '$1M'], ['창고 재고 (ACI LA)', '재고 가액']], now: true },
    { k: '1단계 · 임대차 · 인테리어 (2027 상반기~)', t: '몰 요구 조건 충족', s: 'LOI 보험 조항 기준 COI 발행', rows: [['Umbrella', '$5M'], ['GL 추가피보험자 · 대위권 포기', '임대인별'], ['공사 중 자산 (TI)', '공사비'], ['EPLI (CA 채용 시작)', '$1M'], ['WC 매장 직원 급여 추가', '직무별']] },
    { k: '2단계 · 오픈 (2027.10)', t: '전체 프로그램 완성', s: '가액 확정 · 피보험자 정리', rows: [['매장 재산 (재고 피크 · FF&E · TI)', '대체비용'], ['Business Income', '12개월'], ['제품 책임 · 리콜 최종 확인', '품목 확정'], ['Cyber · Crime 선택 검토', '필요 시'], ['법인 구조 반영 (12월 결정)', 'Named Insured']] },
  ];
  return (
    <SectionWrapper>
      <Label number={index} text="Recommended Program" /><H2>세 시점으로 나눈<br />ARTBOX USA 보험 프로그램</H2>
      <Sub className="mb-10">한 번에 다 가입하지 않습니다. 각 시점에 필요한 것만 효력을 개시해 보험료 낭비 없이 공백을 없앱니다.</Sub>
      <div className="grid md:grid-cols-3 gap-5">
        {stages.map((st, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`rounded-2xl p-7 ${st.now ? 'bg-ink text-white' : 'bg-white border border-ink/[0.08]'}`} style={st.now ? {} : { boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <p className={`text-[10px] tracking-[0.2em] uppercase mb-2 ${st.now ? 'text-accent' : 'text-accent'}`}>{st.k}</p>
            <h3 className={`text-2xl font-bold ${st.now ? 'text-white' : 'text-ink'}`}>{st.t}</h3>
            <p className={`text-xs mb-5 ${st.now ? 'text-white/45' : 'text-ink/45'}`}>{st.s}</p>
            <div className={`divide-y ${st.now ? 'divide-white/10' : 'divide-ink/[0.08]'}`}>
              {st.rows.map(([a, b], j) => (<div key={j} className="flex justify-between gap-3 py-2.5 text-sm"><span className={st.now ? 'text-white/85' : 'text-ink/85'}>{a}</span><span className={`font-semibold whitespace-nowrap ${st.now ? 'text-white' : 'text-ink'}`}>{b}</span></div>))}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 p-6 rounded-xl bg-ink text-white"><p className="text-[10px] tracking-[0.2em] text-accent uppercase mb-2">패키지 구성</p><p className="text-sm md:text-base leading-relaxed">0단계 GL과 재산 보험은 소매용 패키지(BOP)로 묶을 수 있으나, 도매·프랜차이즈·라이선싱 비중과 창고 소재지에 따라 맞춤형 패키지(CPP)가 더 맞을 수 있습니다. <strong>두 방식을 모두 견적해 비교해 드립니다.</strong> D&O + EPLI는 Management Liability 패키지로 묶는 것을 권합니다.</p></div>
      <Footer page={index} />
    </SectionWrapper>
  );
}

export function Cost({ index }) {
  const rows = [['General Liability', '12개월 매출 전망(소매·도매 분리) · 상품 구성 · 매장 수와 면적'], ['Workers’ Comp', '직무별 연간 급여 ÷ 100 × 직무 요율. 매장 판매직과 사무직은 요율이 다릅니다'], ['D&O', '총자산·매출 규모, 이사 수, 외부 투자·부채, 자회사 계획, 청구 이력'], ['EPLI', '직원 수, 캘리포니아 비중, HR 문서·교육 유무, 청구 이력'], ['재산 · 영업중단', '재고 피크, 집기·인테리어 대체비용, 12개월 영업이익, 건물 구조·스프링클러'], ['Umbrella', '기초 보험 한도와 노출. 요구 한도가 클수록 비례 증가']];
  return (
    <SectionWrapper dark>
      <Label number={index} text="How Premiums Work" dark /><H2 dark>보험료는 매출 하나로<br />정해지지 않습니다</H2>
      <Sub dark className="mb-10">보험마다 보는 숫자가 다릅니다. 요청서의 빈칸 중 어떤 것이 어느 보험료를 결정하는지 아시면 준비 우선순위가 분명해집니다.</Sub>
      <div className="grid md:grid-cols-[1.4fr_1fr] gap-8 items-start">
        <div className="divide-y divide-white/10">
          {rows.map(([a, b]) => (<div key={a} className="grid grid-cols-[150px_1fr] md:grid-cols-[200px_1fr] gap-4 py-4 text-sm"><span className="font-semibold text-white">{a}</span><span className="text-white/60">{b}</span></div>))}
        </div>
        <Card dark hover={false}>
          <span className="text-[11px] font-bold tracking-wide px-3 py-1 rounded-full bg-accent text-white">예시 · ARTBOX 견적 아님</span>
          <p className="text-lg font-semibold text-white mt-4">산재보험료가 계산되는 방식</p>
          <p className="text-sm text-white/50 mb-4">연간 급여 ÷ 100 × 직무 요율 × 경험 계수</p>
          <div className="rounded-xl bg-white/5 p-4 divide-y divide-white/10 text-sm">
            {[['매장 직원 10명 × $40,000', '= $400,000'], ['$400,000 ÷ 100', '= 4,000'], ['4,000 × $1.50 (가정 요율)', '= $6,000'], ['× 1.0 (신규 사업자)', '≈ $6,000 / 년']].map(([l, r]) => (<div key={l} className="flex justify-between py-2"><span className="text-white/60">{l}</span><b className="text-white">{r}</b></div>))}
          </div>
          <p className="text-xs text-white/40 mt-4 leading-relaxed">요율은 보험사와 직무 분류에 따라 다릅니다. 실제 숫자는 급여 자료를 받은 뒤 WTW 견적으로 확인합니다.</p>
        </Card>
      </div>
      <p className="mt-8 text-sm text-white/55 leading-relaxed max-w-4xl">보험료는 보통 연 1회 선납 또는 분납이 가능하고, GL·WC는 연말에 실제 매출·급여로 정산(Audit)됩니다. 공개 자료 기준 소규모 소매점 중앙값은 GL 포함 소매 패키지 연 $1,100 내외, 산재 $1,000 내외, Umbrella $700 내외이지만, 귀사는 제조·수입 성격과 몰 입점으로 <span className="text-white">이보다 높게 형성될 가능성이 큽니다.</span></p>
      <Footer dark page={index} />
    </SectionWrapper>
  );
}

export function Process({ index }) {
  const steps = [['이번 주', '자료 보완 요청 회신', '1순위 항목(매출 전망, 급여, 창고 재고 가액, 사고 이력 ‘없음’ 확인)을 저희와 Jason Choi CPA가 함께 채웁니다.'], ['Week 2', 'WTW 견적 요청', '0단계 4종을 복수 보험사에 제출. BOP와 CPP 두 방식으로 요청합니다.'], ['Week 3', '견적 접수 · 비교', '보험료·한도·자기부담·면책을 한 표로 비교. 제품 책임 면책이 붙는지 반드시 확인합니다.'], ['Week 4', '가입 결정 · 효력 개시', '대표님 승인 후 Bind. 보험증명서(COI) 발급. 분납 여부 결정.'], ['이후', '1단계 준비', 'LOI 보험 조항이 오는 대로 Umbrella·추가피보험자·공사 자산 견적. CA 채용 일정에 EPLI 효력을 맞춥니다.']];
  return (
    <SectionWrapper>
      <Label number={index} text="Process & Timeline" /><H2>자료만 모이면<br />0단계 가입까지 약 4주입니다</H2>
      <div className="mt-10 grid md:grid-cols-5 gap-4">
        {steps.map(([w, t, d], i) => (
          <Card key={i} className="!p-5"><p className={`text-[10px] tracking-[0.2em] uppercase mb-3 font-bold ${i === 0 ? 'text-accent' : 'text-ink/40'}`}>{w}</p><p className="text-base font-semibold text-ink mb-2 leading-snug">{t}</p><p className="text-xs text-ink/60 leading-relaxed">{d}</p></Card>
        ))}
      </div>
      <div className="mt-8 p-5 rounded-xl bg-ink/[0.04] text-sm text-ink/70">12월 법인 구조 결정은 0단계 가입을 기다릴 이유가 되지 않습니다. 결정 후 피보험자 명의와 소재지를 배서(Endorsement)로 수정하면 됩니다.</div>
      <Footer page={index} />
    </SectionWrapper>
  );
}

export function Prepare({ index }) {
  const cols = [
    ['지금 꼭 필요 — 이것 없이는 견적이 안 됩니다', 'bg-accent', [['향후 12개월 매출 전망 (매장별 · 도매/프랜차이즈 분리)', 'Jason Choi'], ['직무별 인원과 연간 급여 · 대표님 산재 포함 여부', 'Jason Choi'], ['ACI LA 창고 재고 가액과 창고 계약서', 'Jason Choi'], ['지난 5년 사고 이력 — 없으면 ‘No losses’로 명시', '본사'], ['모회사 D&O 보유 여부와 미국 자회사 확장 여부', '본사 재무']]],
    ['임대차 시점까지', 'bg-blue', [['매장 3곳 정확한 주소 · 임대인명 · LOI/임대차의 보험 조항', '대표님 / 임대인'], ['인테리어(TI) · 집기(FF&E) · 재고 평균/피크 · 12개월 영업이익', '본사 MD팀'], ['매장 건물 구조 · 스프링클러 · 경보 (몰에서 제공)', '임대인'], ['채용 계획과 HR 문서 (핸드북, 괴롭힘 방지 정책)', 'Jason Choi']]],
    ['있으면 조건이 좋아집니다', 'bg-ink/60', [['상품 카탈로그 · 원산지 · 품목별 매출 비중', '본사'], ['아동용 제품 CPC 인증서 · 공급사 보험증명서', '본사'], ['화장품·식품·캔들·배터리 품목 목록과 리콜 절차', '본사 MD팀'], ['파견 MD 비자 유형 · 급여 지급 주체', '본사 HR'], ['조직도 · 재무제표 · 사업계획', 'Jason Choi']]],
  ];
  return (
    <SectionWrapper dark>
      <Label number={index} text="What to Prepare" dark /><H2 dark>견적을 받기 위해 꼭 필요한 것과,<br />있으면 좋은 것</H2>
      <div className="mt-10 grid md:grid-cols-3 gap-5">
        {cols.map(([h, bg, items], i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
            <p className={`${bg} text-white text-sm font-bold px-5 py-3`}>{h}</p>
            <ul className="p-5 space-y-3">
              {items.map(([t, who]) => (<li key={t} className="flex gap-3 text-sm"><span className="mt-1 w-3.5 h-3.5 rounded-[3px] border-2 border-white/40 shrink-0" /><span><span className="text-white/90">{t}</span><span className="block text-xs text-white/40 mt-0.5">담당 제안 · {who}</span></span></li>))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-white/40">요청서에 ‘n/a’로 적힌 항목 중 ‘해당 없음’과 ‘아직 모름’이 섞여 있습니다. 보완 회신 때 둘을 구분해 주시면 보험사 질의가 줄어듭니다.</p>
      <Footer dark page={index} />
    </SectionWrapper>
  );
}

export function Save({ index }) {
  const acts = [['아동용 제품 CPC 인증서와 공급사 보험증명서를 파일로 정리', '제품 책임 담보에 면책이 붙지 않게 하는 가장 강력한 근거입니다. 공급사에 ARTBOX USA를 추가피보험자로 넣어달라고 요청하세요.'], ['HR 기본 문서 4종 — 채용 시작 전에', '괴롭힘·차별 방지 정책, CA 예방 교육 계획, 신고 절차, At-will 고용 문구. EPLI 자기부담금을 낮춥니다.'], ['업무 운전자 MVR(운전기록) 확인 절차 도입', '개인 차량 업무 사용이 있으면 보험사가 반드시 묻는 항목입니다. 연 1회 확인 규정이면 충분합니다.'], ['매장 바닥 점검 · CCTV 운영 계획 문서화', '소매 GL 사고의 대부분은 미끄러짐·넘어짐입니다. 오픈 전 점검 체크리스트만 있어도 평가가 달라집니다.'], ['화장품·식품·캔들·배터리 품목을 미리 확정', '“판매 생각 중” 상태로 견적을 받으면 면책이 붙거나 보험료가 보수적으로 산정됩니다.'], ['리콜 대응 절차 한 장 작성', '누가, 어떤 기준으로, 어떻게 회수하는지. 아동용·자체 IP 비중이 높은 귀사에는 평판을 지키는 장치이기도 합니다.']];
  return (
    <SectionWrapper>
      <Label number={index} text="Lower Your Premium" /><H2>보험 가입 전에 해두면<br />조건이 좋아지는 6가지</H2>
      <Sub className="mb-10">보험사는 “사고가 날 가능성을 얼마나 관리하는 회사인가”를 봅니다. 비용이 거의 들지 않으면서 언더라이팅 평가를 바꾸는 항목입니다.</Sub>
      <div className="grid md:grid-cols-2 gap-4">
        {acts.map(([t, d], i) => (<Card key={i} className="!p-5 flex gap-4"><span className="w-8 h-8 rounded-full bg-ink text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span><div><p className="font-semibold text-ink leading-snug">{t}</p><p className="text-sm text-ink/60 mt-1.5 leading-relaxed">{d}</p></div></Card>))}
      </div>
      <Footer page={index} />
    </SectionWrapper>
  );
}

export function FAQ({ index }) {
  const qs = [['매장이 2027년 10월에 여는데, 왜 지금 보험이 필요한가요?', '회사는 이미 2026년 5월부터 존재하고, 대표님 급여가 발생하며, 파견 직원이 오고, 창고에 재고가 들어옵니다. 산재보험은 급여가 발생하는 순간 법정 의무이고, D&O는 경영 판단이 시작되는 순간부터 필요합니다. 매장 재산 보험은 반대로 지금 들 필요가 없습니다.'], ['법인 구조를 12월에 바꿀 수도 있는데 기다려야 하나요?', '아닙니다. 지금 ARTBOX USA 명의로 가입하고, 12월 결정 후 자회사가 생기면 피보험자 추가 또는 별도 증권으로 조정합니다. 법인을 나눈다고 보험료가 자동으로 줄거나 책임이 완전히 분리되는 것은 아니므로, 구조 결정은 법무·세무 자문과 함께 하시고 보험 영향은 저희가 비교해 드립니다.'], ['BOP와 CPP 중 무엇으로 해야 하나요?', 'BOP는 소규모 소매에 맞춘 표준 패키지로 초기 비용이 효율적입니다. 다만 귀사는 도매·프랜차이즈·라이선싱과 창고 재고가 있어 BOP 적격 범위를 벗어날 수 있습니다. 두 방식을 모두 견적 받아 비교하는 것이 안전하며, 매장이 늘어난다고 반드시 CPP로 바꿔야 하는 것은 아닙니다.'], ['한국 본사 보험으로 미국을 커버할 수는 없나요?', '본사 D&O가 해외 자회사를 포함하는 경우가 있어 확인이 필요합니다. 다만 산재보험은 반드시 미국 각 주 기준으로 가입해야 하고, 몰 임대인은 미국 보험사가 발행한 증명서를 요구하므로 GL·Umbrella는 미국 현지 가입이 사실상 필수입니다.'], ['보험료가 대략 얼마인가요?', '급여·매출·재고 가액이 아직 없어 책임 있는 숫자를 드릴 수 없습니다. 공개 자료상 소규모 소매점 중앙값은 보험 종류별로 연 수백~천여 달러 수준이지만, 귀사는 제조·수입 성격과 몰 입점 요건으로 그보다 높게 형성될 가능성이 큽니다. 1순위 자료가 오면 2~3주 내 실제 견적을 비교표로 드립니다.'], ['Umbrella는 꼭 필요한가요?', '대형 몰 임대차는 대부분 요구합니다. 요구하지 않더라도 한 건의 중상 사고가 GL 한도 $1M을 넘기는 경우가 있어 권합니다. 정확한 한도는 LOI 보험 조항을 보고 정합니다.']];
  const [open, setOpen] = useState(0);
  return (
    <SectionWrapper dark>
      <Label number={index} text="FAQ" dark /><H2 dark>대표님께서 물어보실 만한 것들</H2>
      <div className="mt-10 space-y-3">
        {qs.map(([q, a], i) => (
          <div key={i} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"><span className="font-semibold text-white">{q}</span><motion.span animate={{ rotate: open === i ? 180 : 0 }}><ChevronDown size={18} className="text-accent" /></motion.span></button>
            <AnimatePresence initial={false}>{open === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><p className="px-6 pb-6 text-sm text-white/65 leading-relaxed">{a}</p></motion.div>}</AnimatePresence>
          </div>
        ))}
      </div>
      <Footer dark page={index} />
    </SectionWrapper>
  );
}

export function Downloads({ index }) {
  const files = [
    { icon: Presentation, title: '보험 자문 리포트 (PowerPoint)', sub: 'ARTBOX_USA_Insurance_Advisory_Report.pptx · 18장 · 16:9 · 이 리포트와 동일 내용', url: '/downloads/ARTBOX_USA_Insurance_Advisory_Report.pptx' },
    { icon: FileSpreadsheet, title: '보험 정보 요청서 (회신본)', sub: 'ARTBOX_USA_Insurance_Information_Request.xlsx · 9개 탭 · 보완 입력용', url: '/downloads/ARTBOX_USA_Insurance_Information_Request.xlsx' },
    { icon: FileText, title: '이 리포트 PDF', sub: '우측 메뉴 › Export PDF 에서 전체 또는 선택 페이지를 내려받을 수 있습니다', url: null },
  ];
  return (
    <SectionWrapper>
      <Label number={index} text="Downloads" /><H2>자료 다운로드</H2>
      <Sub className="mb-10">본 리포트와 함께 전달드리는 자료입니다. 정보 요청서는 노란색 셀만 채워 회신해 주시면 됩니다.</Sub>
      <div className="grid md:grid-cols-3 gap-5">
        {files.map((f, i) => (
          <Card key={i} className="flex flex-col">
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4"><f.icon size={22} className="text-accent" /></div>
            <p className="text-[10px] tracking-[0.2em] text-ink/30 uppercase">{String(i + 1).padStart(2, '0')}</p>
            <p className="text-lg font-semibold text-ink leading-tight mt-1">{f.title}</p>
            <p className="text-xs text-ink/50 mt-2 mb-6 leading-relaxed">{f.sub}</p>
            {f.url ? (
              <a href={f.url} download className="mt-auto w-full rounded-xl py-3 font-semibold text-sm bg-ink text-white flex items-center justify-center gap-2 hover:bg-ink/90 no-export"><Download size={15} /> 다운로드</a>
            ) : (<span className="mt-auto w-full rounded-xl py-3 font-semibold text-sm bg-ink/5 text-ink/40 text-center">Export 메뉴 이용</span>)}
          </Card>
        ))}
      </div>
      <Footer page={index} />
    </SectionWrapper>
  );
}

export function End({ index }) {
  const steps = [['이 리포트 검토 후 0단계 범위 확정', 'GL+HNOA · WC · D&O · 창고 재고 · 대표님 산재 포함 여부'], ['1순위 자료 회신', '매출 전망 · 급여 · 창고 재고 가액 · 사고 이력 · 모회사 D&O'], ['WTW 견적 요청 (BOP/CPP 병행)', '복수 보험사 마케팅 · 2~3주'], ['비교표 검토 · 가입 · COI 발급', 'LOI가 오면 1단계(Umbrella · 임대인 요건) 바로 진행']];
  return (
    <SectionWrapper dark>
      <p className="text-xs tracking-[0.3em] text-white/30 uppercase">Next Steps</p>
      <div className="flex-1 flex flex-col justify-center py-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
          <h1 className="text-[clamp(40px,7vw,104px)] font-bold leading-[0.98] tracking-[-0.03em] text-white">이번 주에 시작하면,</h1>
          <h1 className="text-[clamp(40px,7vw,104px)] font-bold leading-[0.98] tracking-[-0.03em] text-accent">12월 전에 보장이 들어갑니다.</h1>
        </motion.div>
        <div className="mt-12 grid md:grid-cols-[1.2fr_1fr] gap-10">
          <ol className="space-y-4">
            {steps.map(([a, b], i) => (<li key={i} className="flex gap-4"><span className="w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span><div><p className="font-semibold text-white">{a}</p><p className="text-sm text-white/50">{b}</p></div></li>))}
          </ol>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <p className="text-[10px] tracking-[0.2em] text-accent uppercase mb-3">이 리포트에 대해</p>
            <ul className="text-xs text-white/55 space-y-2 leading-relaxed list-disc pl-4">
              <li>eStyle Insurance Solutions Team의 컨설팅 자문 자료이며, 보험사 견적서나 법률 의견이 아닙니다.</li>
              <li>WTW는 보험 배치 파트너로 함께 일하며, 본 리포트의 한도·구성은 WTW의 공식 견적이 아닙니다.</li>
              <li>권고 한도는 몰 입점 소규모 소매의 일반적 출발점이며, 임대차 조항과 견적 결과에 따라 조정됩니다.</li>
              <li>법인 구조·세무는 법무법인과 CPA의 자문 영역이며, 저희는 그 결정이 보험에 미치는 영향을 비교해 드립니다.</li>
              <li>2026년 11월 8일 회신 자료 기준이며, 공란이 채워지면 내용이 갱신됩니다.</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-end text-[11px] text-white/30"><p>eStyle Insurance Solutions Team · working with WTW · 2026. 11. 9</p><p className="font-mono">{String(index).padStart(2, '0')}</p></div>
    </SectionWrapper>
  );
}
