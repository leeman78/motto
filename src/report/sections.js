import { Cover, Contents, Summary, Situation } from './Sections1';
import { PolicyGL, PolicyWC, PolicyDO, PolicyProperty, PolicyUmbrella, PolicyEPLI, PolicyOptional } from './Policies';
import { Program, Cost, Process, Prepare, Save, FAQ, Downloads, End } from './Sections3';

export const SECTIONS = [
  { id: 'cover', label: 'Cover', ko: '표지', component: Cover },
  { id: 'contents', label: 'Contents', ko: '목차', component: Contents },
  { id: 'summary', label: 'Executive Summary', ko: '한눈에 보는 결론', component: Summary },
  { id: 'situation', label: 'Your Situation', ko: '귀사의 상황', component: Situation },
  { id: 'gl', label: 'General Liability', ko: '배상책임 · 제품 · 비소유차량', component: PolicyGL },
  { id: 'wc', label: 'Workers Compensation', ko: '산재보험', component: PolicyWC },
  { id: 'do', label: 'Directors and Officers', ko: '임원배상책임 D&O', component: PolicyDO },
  { id: 'property', label: 'Property', ko: '재산 · 영업중단', component: PolicyProperty },
  { id: 'umbrella', label: 'Umbrella', ko: '초과배상 Umbrella', component: PolicyUmbrella },
  { id: 'epli', label: 'EPLI', ko: '고용관행배상 EPLI', component: PolicyEPLI },
  { id: 'optional', label: 'Optional Coverages', ko: '선택 검토 항목', component: PolicyOptional },
  { id: 'program', label: 'Recommended Program', ko: '추천 보험 프로그램', component: Program },
  { id: 'cost', label: 'How Premiums Work', ko: '보험료 산정 방식', component: Cost },
  { id: 'process', label: 'Process and Timeline', ko: '진행 절차와 일정', component: Process },
  { id: 'prepare', label: 'What to Prepare', ko: '귀사가 준비하실 것', component: Prepare },
  { id: 'save', label: 'Lower Your Premium', ko: '보험료를 낮추는 준비', component: Save },
  { id: 'faq', label: 'FAQ', ko: '자주 묻는 질문', component: FAQ },
  { id: 'downloads', label: 'Downloads', ko: '자료 다운로드', component: Downloads },
  { id: 'end', label: 'Next Steps', ko: '다음 단계', component: End },
];
