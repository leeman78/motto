import React from 'react';
import { motion } from 'framer-motion';
import SectionWrapper, { Label, H2, Sub, Card, Footer, Divider } from '@/components/SectionWrapper';

export function Cover({ index }) {
  return (
    <section className="min-h-screen relative flex flex-col overflow-hidden bg-paper">
      <div className="relative z-10 max-w-6xl mx-auto w-full px-6 md:px-16 pt-10 md:pt-12 flex justify-between items-center">
        <div><p className="text-xs tracking-[0.3em] text-ink/60 uppercase font-semibold">ARTBOX USA, Inc.</p><p className="text-[10px] tracking-[0.25em] text-ink/35 uppercase mt-1">Insurance Advisory Report</p></div>
        <p className="text-xs tracking-[0.2em] text-ink/30 uppercase hidden md:block">Confidential · 2026</p>
      </div>
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full px-6 md:px-16 pb-20">
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-xs md:text-sm tracking-[0.3em] text-ink/40 uppercase mb-6">미국 출점을 위한 보험 자문</motion.p>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-[clamp(40px,6vw,88px)] font-bold leading-[0.95] tracking-[-0.03em] text-ink">Protect the Business.</h1>
          <h1 className="text-[clamp(40px,6vw,88px)] font-bold leading-[0.95] tracking-[-0.03em] text-ink">Protect the Leadership.</h1>
          <h1 className="text-[clamp(40px,6vw,88px)] font-bold leading-[0.95] tracking-[-0.03em] text-accent">Protect the Employees.</h1>
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="mt-8 md:mt-10 text-lg md:text-xl text-ink/70 font-medium max-w-3xl">
          2026년 11월 8일 회신해 주신 정보 요청서를 바탕으로, ARTBOX USA에 지금 필요한 보험과 매장 오픈 전까지 추가할 보험, 그리고 진행 순서를 정리했습니다.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }} className="mt-10 md:mt-12 flex flex-wrap gap-4">
          {[
            { label: '캘리포니아 매장', value: '3곳', sub: 'Santa Anita · Irvine Spectrum · Del Amo' },
            { label: '매장 오픈', value: '2027.10', sub: '모두 임차 · 대형 몰 입점' },
            { label: '지금 필요한 보험', value: '4종', sub: 'GL+HNOA · WC · D&O · 창고 재고', accent: true },
            { label: '0단계 가입까지', value: '약 4주', sub: '1순위 자료 회신 기준' },
          ].map((k, i) => (
            <motion.div key={i} whileHover={{ y: -6, scale: 1.03 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="rounded-2xl px-6 py-5 min-w-[160px] bg-white border border-ink/[0.08]" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <p className="text-xs text-ink/50 mb-2 tracking-wide">{k.label}</p>
              <p className={`text-3xl font-bold leading-none ${k.accent ? 'text-accent' : 'text-ink'}`}>{k.value}</p>
              <p className="text-xs text-ink/40 mt-1">{k.sub}</p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-auto pt-12 flex flex-col md:flex-row justify-between md:items-end gap-3 text-xs text-ink/50">
          <div><p>수신 · ARTBOX USA, Inc. Yongwon Lee 대표님 · Jason Choi, CPA</p><p>기준 자료 · 보험 정보 요청서 회신 (2026. 11. 8)</p></div>
          <div className="md:text-right"><p>작성 · eStyle Insurance Solutions Team · working with WTW</p><p>보고일 · 2026. 11. 9</p></div>
        </motion.div>
      </div>
    </section>
  );
}

export function Contents({ index }) {
  const items = [
    { num: '01', ko: '한눈에 보는 결론', en: '지금 · 임대차 시 · 오픈 시' },
    { num: '02', ko: '귀사의 상황', en: '회신 내용과 보험에서의 의미' },
    { num: '03', ko: '왜 이 보험들이 필요한가', en: 'GL · WC · D&O · 재산 · Umbrella · EPLI', hi: true },
    { num: '04', ko: '추천 보험 프로그램', en: '3단계 구성과 권고 한도' },
    { num: '05', ko: '보험료와 진행 절차', en: '산정 방식 · 4주 일정 · 준비 자료' },
    { num: '06', ko: '보험료를 낮추는 준비 · FAQ', en: '가입 전 6가지 · 자주 묻는 질문' },
    { num: '07', ko: '자료 다운로드 · 다음 단계', en: 'PPT · 정보 요청서 · PDF' },
  ];
  return (
    <SectionWrapper>
      <Label number={index} text="Contents" /><H2>리포트 구성</H2>
      <div className="mt-10 divide-y divide-ink/[0.08]">
        {items.map((it) => (
          <div key={it.num} className={`flex items-center py-5 md:py-7 -mx-4 px-4 rounded-lg hover:bg-ink/[0.02] ${it.hi ? 'text-accent' : ''}`}>
            <span className={`text-sm font-mono w-12 shrink-0 ${it.hi ? 'text-accent' : 'text-ink/30'}`}>{it.num}</span>
            <span className={`text-xl md:text-2xl font-semibold flex-1 tracking-[-0.01em] ${it.hi ? 'text-accent' : 'text-ink'}`}>{it.ko}</span>
            <span className={`text-xs md:text-sm text-right ${it.hi ? 'text-accent/70' : 'text-ink/40'}`}>{it.en}</span>
          </div>
        ))}
      </div>
      <Footer page={index} />
    </SectionWrapper>
  );
}

export function Summary({ index }) {
  const cards = [
    { q: '지금 당장 · 2026년 11월~', t: '경영진 · 직원 · 창고 재고 · 일상 운영을 먼저 보호', p: 'D&O, Workers’ Compensation, General Liability + 비소유 차량 담보, ACI LA 창고 재고 보험. 법인은 이미 존재하고 급여·출장·재고가 발생하고 있기 때문입니다.' },
    { q: '임대차 계약 시 · 2027년 상반기~', t: '몰이 요구하는 한도와 Umbrella, 매장 자산 보험 추가', p: '대형 몰은 임대차 서명 시 보험증명서(COI)를 요구합니다. GL 한도 상향, Umbrella, 인테리어 공사 자산 보험이 들어가고, CA 채용이 시작되면 EPLI 효력을 맞춥니다.' },
    { q: '오픈 시 · 2027년 10월', t: '재고·집기·영업중단 가액을 확정하고 프로그램 완성', p: '재고 피크, 집기(FF&E), 인테리어(TI), 12개월 영업이익 기준으로 재산·영업중단 보험 가액을 확정합니다. 12월 법인 구조 결정을 피보험자 명의에 반영합니다.' },
  ];
  return (
    <SectionWrapper dark>
      <Label number={index} text="Executive Summary" dark /><H2 dark>지금 4가지를 먼저,<br />나머지는 임대차를 맺으면서.</H2>
      <Sub dark className="mb-10">매장은 2027년 10월에 열리지만 회사는 2026년 5월부터 운영 중입니다. 지금 필요한 것과 나중에 필요한 것을 나누는 것이 비용과 공백을 모두 줄이는 방법입니다.</Sub>
      <div className="grid md:grid-cols-3 gap-5">
        {cards.map((c, i) => (
          <Card key={i} dark><p className="text-[11px] tracking-[0.2em] text-accent uppercase mb-3">{c.q}</p><p className="text-lg font-semibold text-white leading-snug mb-3">{c.t}</p><p className="text-sm text-white/55 leading-relaxed">{c.p}</p></Card>
        ))}
      </div>
      <div className="mt-8 p-6 rounded-xl bg-white/5 border border-white/10">
        <p className="text-[10px] tracking-[0.2em] text-accent uppercase mb-2">핵심 한 줄</p>
        <p className="text-base md:text-lg font-semibold text-white">작은 문구 매장이라도 ARTBOX USA는 자체 IP 상품을 수입·판매하는 <span className="text-accent">‘제조·수입자’</span>이고, 세 매장 모두 대형 몰 입점입니다. 그래서 일반 소매점보다 제조물 책임과 임대인 요구 한도를 먼저 챙겨야 합니다.</p>
      </div>
      <Footer dark page={index} />
    </SectionWrapper>
  );
}

export function Situation({ index }) {
  const rows = [
    ['델라웨어 법인, 2026년 5월 설립 · 이사 1인', '모회사 100% · 12월 구조 재편 결정 · 신규 자회사 계획', '법인이 존재하는 순간부터 대표님 개인이 경영 판단에 책임을 질 수 있습니다. D&O는 지금 필요합니다. 12월 결정 전까지는 단일 법인 기준으로 가입하고, 결정 후 피보험자만 조정합니다.'],
    ['캘리포니아 3개 몰 매장, 2027년 10월 오픈', 'Santa Anita 1,760 · Irvine Spectrum 1,923 · Del Amo 1,223 sq ft · 모두 임차', '몰 임대차는 거의 예외 없이 GL $1M/$2M, Umbrella, 임대인 추가피보험자, 대위권 포기를 요구합니다. LOI를 받는 즉시 보험 조항을 공유해 주시면 한도를 맞춰 드립니다.'],
    ['자체 IP 상품 40~50%, 한국·중국 수입, 일부 12세 이하 제품', '본사 CPC 인증 · 화장품·식품·캔들·배터리 판매 계획', '미국 소비자에게는 ARTBOX USA가 ‘그 제품을 만든 회사’입니다. 제품 사고 책임이 GL의 핵심이고, 아동용·화장품·식품은 보험사가 가장 꼼꼼히 보는 항목입니다. CPC 인증서와 공급사 보험증명서가 준비되면 조건이 좋아집니다.'],
    ['ACI LA 창고 사용 · 도매·프랜차이즈·SIS·라이선싱 병행', '미국 이커머스 없음 · 배송 서비스 없음', '매장이 열리기 전에도 창고 재고는 화재·도난 위험에 노출됩니다. 창고 재고 보험은 지금 들어가야 합니다. 도매·프랜차이즈가 커지면 소매용 패키지(BOP)보다 맞춤형 패키지(CPP)가 맞을 수 있습니다.'],
    ['President 1인 급여 $150,000 · 본사 파견 MD 1인(비자 진행)', 'PEO 미사용 · 급여는 Gusto · 초기 출장은 대표님만', '캘리포니아에서 급여가 발생하면 산재보험은 법정 의무입니다. 대표님 포함 여부, 파견 MD의 CA 산재 적용을 결정해야 하고, 우편 주소가 오리건이라 OR 근무자가 생기면 OR 등록도 필요합니다.'],
    ['회사 차량 없음 · 개인 차량과 렌터카로 업무 이동', 'MVR 확인 안 함 · 핸드북 있음, 괴롭힘 방지 정책·교육은 아직', '개인 차량 업무 중 사고는 회사도 피소될 수 있어 비소유 차량 담보(HNOA)를 GL에 붙입니다. CA는 직원 5명부터 괴롭힘 예방 교육이 의무라, 채용 전에 HR 문서를 갖추면 EPLI 조건이 좋아집니다.'],
  ];
  return (
    <SectionWrapper>
      <Label number={index} text="Your Situation" /><H2>회신해 주신 내용과,<br />그것이 보험에서 갖는 의미</H2>
      <Sub className="mb-10">왼쪽은 귀사가 알려주신 사실, 오른쪽은 저희가 읽은 의미입니다.</Sub>
      <div className="divide-y divide-ink/[0.08]">
        {rows.map(([a, b, c], i) => (
          <div key={i} className="grid md:grid-cols-[1fr_1.4fr] gap-3 md:gap-10 py-6">
            <div><p className="text-base font-semibold text-ink leading-snug">{a}</p><p className="text-xs text-ink/40 mt-1">{b}</p></div>
            <p className="text-sm text-ink/70 leading-relaxed border-l-2 border-accent pl-4">{c}</p>
          </div>
        ))}
      </div>
      <Footer page={index} />
    </SectionWrapper>
  );
}
