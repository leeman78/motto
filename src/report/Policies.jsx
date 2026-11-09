import React from 'react';
import SectionWrapper, { Label, H2, Sub, Card, Footer } from '@/components/SectionWrapper';

function PolicyPage({ index, label, when, whenTone = 'now', title, en, protects, scenarios, design, limit, dark = false, children }) {
  const tone = { now: 'bg-accent text-white', later: 'bg-blue text-white', opt: dark ? 'bg-white/15 text-white' : 'bg-ink/10 text-ink' }[whenTone];
  return (
    <SectionWrapper dark={dark}>
      <Label number={index} text={label} dark={dark} />
      <div className="flex flex-wrap items-start gap-4 mb-2"><H2 dark={dark} className="mb-0">{title}</H2><span className={`mt-2 md:mt-4 text-[11px] font-bold tracking-wide px-3 py-1 rounded-full ${tone}`}>{when}</span></div>
      <Sub dark={dark} className="mb-10">{en}</Sub>
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-accent uppercase mb-3">무엇을 막아주나</p>
          <p className={`text-base md:text-lg leading-relaxed ${dark ? 'text-white/80' : 'text-ink/80'}`}>{protects}</p>
          <div className="mt-6 space-y-3">
            {scenarios.map((s, i) => (
              <div key={i} className={`rounded-xl px-4 py-3 text-sm ${dark ? 'bg-white/5 border border-white/10 text-white/80' : 'bg-white border border-ink/[0.08] text-ink'}`}><span className="text-accent text-[11px] font-bold mr-2">ARTBOX 예시</span>{s}</div>
            ))}
          </div>
        </div>
        <div>
          <p className={`text-[10px] tracking-[0.25em] uppercase mb-3 ${dark ? 'text-white/40' : 'text-ink/40'}`}>귀사에 맞는 설계</p>
          <p className={`text-sm md:text-base leading-relaxed ${dark ? 'text-white/70' : 'text-ink/70'}`}>{design}</p>
          {limit && (
            <Card dark={dark} hover={false} className="mt-6"><p className={`text-[10px] tracking-[0.25em] uppercase mb-2 ${dark ? 'text-white/40' : 'text-ink/40'}`}>권고 한도 · 출발점</p><p className={`text-xl md:text-2xl font-bold ${dark ? 'text-white' : 'text-ink'}`}>{limit[0]}</p><p className={`text-xs mt-2 ${dark ? 'text-white/45' : 'text-ink/45'}`}>{limit[1]}</p></Card>
          )}
          {children}
        </div>
      </div>
      <Footer dark={dark} page={index} />
    </SectionWrapper>
  );
}

export const PolicyGL = ({ index }) => (
  <PolicyPage index={index} label="Why · General Liability" when="지금" title="General Liability + 제품 책임 + 비소유 차량" en="Commercial General Liability · Products-Completed Operations · Hired & Non-Owned Auto"
    protects="고객이 매장에서 다치거나, 판매한 제품 때문에 피해를 입었을 때의 손해배상과 변호사 비용. 직원이 개인 차량으로 업무 중 사고를 냈을 때 회사에 오는 청구."
    scenarios={['아이가 키링 부품을 삼켜 부모가 소송 → 제품 책임 담보가 방어·배상', 'Irvine Spectrum 매장에서 고객이 진열대 모서리에 다침 → 신체상해 담보', '대표님이 렌터카로 창고 이동 중 접촉사고 → HNOA가 회사 측 책임 부담']}
    design="수입·자체 IP·아동용 제품을 보험사에 정확히 알리고 제품 담보에 면책이 붙지 않도록 합니다. 화장품·식품·캔들·배터리는 품목을 확정해 사전 승인을 받습니다. 리콜 비용 담보는 별도 견적으로 검토하고, HNOA는 GL 배서로 함께 넣습니다."
    limit={['$1M 사고당 / $2M 연간 총액', '몰 임대차 표준 한도 · HNOA $1M · 임대인 요구 시 상향']} />
);

export const PolicyWC = ({ index }) => (
  <PolicyPage index={index} label="Why · Workers’ Compensation" when="지금 · 법정 의무" title="Workers’ Compensation" en="산재보험 + Employers Liability" dark
    protects="직원이 일하다 다치거나 병이 났을 때의 치료비·휴업급여. 캘리포니아에서 직원 1명만 있어도 법정 의무이며, 미가입 시 벌금과 영업정지 사유가 됩니다."
    scenarios={['파견 MD가 창고에서 박스를 옮기다 허리를 다침 → 치료비·급여 보상', '오픈 후 매장 직원이 사다리에서 낙상 → 장기 휴업급여까지 보상']}
    design="지금은 대표님과 파견 MD 2인 기준으로 시작하고, 매장 채용이 시작되면 직무·급여를 추가합니다. 대표님 본인 포함 여부를 결정하고, 한국 파견 직원의 CA 산재 적용과 출장 중 보장을 확인합니다. 워싱턴 진출 시에는 주 기금(L&I) 체계라 별도 등록이 필요합니다."
    limit={['법정 급여 + Employers Liability $1M / $1M / $1M', '보험료 = 직무별 급여 ÷ 100 × 요율 · 연말 급여 기준 정산']} />
);

export const PolicyDO = ({ index }) => (
  <PolicyPage index={index} label="Why · Directors & Officers" when="지금" title="D&O 임원배상책임" en="Directors & Officers Liability · Management Liability 패키지"
    protects="대표님과 이사진이 경영 판단(계약, 채용, 자회사 설립, 자금 집행)과 관련해 거래처·규제기관·모회사로부터 청구를 받았을 때의 방어 비용과 배상. 회사가 대신 보상하지 못하는 경우 개인 재산을 지켜줍니다."
    scenarios={['프랜차이즈 후보가 계약 결렬 후 경영진의 허위 설명을 주장하며 소송', '자회사 설립·자금 이동 과정에서 채권자가 이사의 선관의무 위반을 주장']}
    design="이사 1인, 총자산 약 $1M, 외부 투자 없음 — 소규모 비상장 프로필이라 D&O와 EPLI를 하나의 ‘Management Liability’ 패키지로 묶으면 효율적입니다. 모회사가 한국에서 D&O를 보유했다면 미국 자회사 확장 여부를 먼저 확인합니다."
    limit={['$1,000,000 · Side A / B / C', '모회사 보험 범위 확인 후 조정 · Claims-made 소급일 설정']} />
);

export const PolicyProperty = ({ index }) => (
  <PolicyPage index={index} label="Why · Property" when="지금 창고 → 2027 매장" whenTone="later" title="재산 · 영업중단 보험" en="Commercial Property · Business Income · Tenant Improvements" dark
    protects="재고·집기·인테리어가 화재, 누수, 도난으로 손상됐을 때의 복구 비용. 매장이 문을 닫는 동안의 영업이익과 임대료 등 고정비(Business Income)."
    scenarios={['ACI LA 창고 스프링클러 오작동으로 입고 재고 침수 → 재고 대체비용 보상', 'Del Amo 매장 윗층 누수로 3주 휴업 → 재고·집기 복구 + 휴업 기간 영업이익']}
    design="지금은 ACI LA 창고 재고만 부보합니다. 매장은 인테리어 공사 시작 시 공사 자산을, 오픈 시 재고 피크·집기·12개월 영업이익을 가액으로 확정합니다. 임대인 건물은 부보 대상이 아니며, 귀사 인테리어(TI)와 집기만 대상입니다."
    limit={['대체비용(Replacement Cost) 기준', '재고는 피크 시즌 기준 · Business Income 12개월 · 창고는 지금, 매장은 인도 시점']} />
);

export const PolicyUmbrella = ({ index }) => (
  <PolicyPage index={index} label="Why · Umbrella" when="임대차 시" whenTone="later" title="Umbrella / Excess" en="초과 배상책임 — 대형 몰 임대차의 사실상 필수 조건"
    protects="GL·차량·고용주 책임 한도를 넘는 큰 사고. 한 건의 중상 사고가 $1M을 넘기는 일은 드물지 않습니다."
    scenarios={['몰 공용 통로와 매장 경계에서 고객 중상 → GL $1M 초과분을 Umbrella가 부담']}
    design="대형 몰 임대차는 대부분 Umbrella를 요구하므로 ‘선택’이 아니라 ‘임대차 요건’으로 보시는 것이 맞습니다. LOI의 보험 조항을 받는 즉시 요구 한도에 맞춰 견적합니다. 요구가 없더라도 3개 매장 규모에서는 권합니다."
    limit={['$5,000,000', '몰 요구 조건 확인 후 확정 · GL·HNOA·EL 위에 얹는 구조']} />
);

export const PolicyEPLI = ({ index }) => (
  <PolicyPage index={index} label="Why · EPLI" when="CA 채용 시" whenTone="later" title="EPLI 고용관행배상책임" en="Employment Practices Liability — 캘리포니아는 미국에서 고용 소송이 가장 많은 주" dark
    protects="직원 또는 지원자가 부당해고, 차별, 괴롭힘, 보복, 임금 관련 주장으로 회사와 경영진을 상대로 청구할 때의 방어 비용과 합의금."
    scenarios={['파트타임 직원이 휴게시간 미보장과 해고 보복을 주장하며 노동청 진정', '고객이 매장 직원에게 차별적 대우를 받았다고 주장 → 제3자 EPL 담보']}
    design="매장 채용 시작에 효력을 맞춥니다. 고객이 직원을 상대로 제기하는 주장도 보장하는 제3자 담보(Third-Party EPL)를 포함 권고합니다. 채용 전에 괴롭힘 방지 정책, CA 예방 교육, 신고 절차, At-will 문구를 갖추면 자기부담금과 보험료가 낮아집니다."
    limit={['$1,000,000', '자기부담금(Retention) $10,000~25,000 수준에서 비교 · Wage/Hour 방어비용 Sublimit 확인']} />
);

export const PolicyOptional = ({ index }) => (
  <PolicyPage index={index} label="Why · Optional" when="필요 시" whenTone="opt" title="선택 검토 항목" en="Cyber · Crime · Equipment Breakdown · Commercial Auto"
    protects="지금 단계에서 반드시 필요한 항목은 아닙니다. 오픈 전 재검토 시점에 결제 규모·현금 운영 방식·차량 구매 여부를 보고 결정하시면 됩니다."
    scenarios={['Cyber — 매장 POS 결제 데이터가 쌓이면 소액 한도로 검토', 'Crime — 현금 취급 정책에 따라 직원 부정·현금 도난 대비', 'Equipment Breakdown — POS·HVAC 등 설비 고장', 'Commercial Auto — CA 사무실 차량을 구매하는 시점']}
    design="네 가지 모두 사업 운영 방식이 확정된 뒤 결정하는 것이 비용 면에서 유리합니다. 미국 이커머스가 없고 배송 서비스도 없어 현재 사이버·운송 노출은 낮습니다. 다만 매장 오픈 전 재검토 리스트에 올려 두고, 견적 시점에 보험사 패키지에 저렴하게 포함되는지 함께 확인합니다."
    limit={null} />
);
