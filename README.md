# ARTBOX USA — Insurance Advisory Report (Web App)

KTO K-Roadshow 리포트와 같은 구조의 페이지형 리포트 앱입니다.
Vite + React + Tailwind + framer-motion. 백엔드 없음(패스워드 검증은 Vercel 서버리스 함수 1개).

## 버전 올리기
내용을 바꿀 때마다 `package.json`의 `"version"`을 올리고 `CHANGELOG.md`에 한 줄 적으세요. 빌드 시 자동으로 화면 네 곳(패스워드 화면·페이지 패널·표지·푸터)에 표시됩니다.

## 기능
- 19개 페이지(풀스크린 섹션), 우측 레일 목차(호버 시 확장 · 진행 점), 우하단 페이지 이동(이전/다음), 키보드 ↑↓/PageUp·Down 이동
- 패스워드 게이트 — `/api/verify` 서버 검증(환경변수 `REPORT_PASSWORD`), 세션 동안 유지
- Export PDF — 전체/선택 범위/페이지별(html2canvas + jsPDF, 화면 그대로 캡처)
- 자료 다운로드 — `public/downloads/` 의 PPT·정보 요청서
- 모바일 대응(햄버거 목차, 하단 페이지 바)

## 로컬 실행
```bash
npm install
cp .env.example .env     # VITE_REPORT_PASSWORD 로컬용 패스워드
npm run dev
```
로컬에서는 /api 가 없으므로 `.env` 의 VITE_REPORT_PASSWORD 로 검증합니다(없으면 게이트 통과).

## 배포 (GitHub → Vercel)
```bash
git init && git add . && git commit -m "ARTBOX USA insurance advisory report app"
gh repo create artbox-insurance-report --private --source=. --push
```
Vercel → Add New Project → repo 선택 → Framework **Vite** (자동 감지) → Deploy.
Settings → Environment Variables → `REPORT_PASSWORD` = 고객에게 전달할 패스워드 → Redeploy.
Settings → Domains → 예: `artbox.yourkorea.app` (CNAME `cname.vercel-dns.com`).

## 내용 수정
- 페이지 순서·제목: `src/report/sections.js`
- 본문: `src/report/Sections1.jsx` (표지·목차·결론·상황), `Policies.jsx` (보험별 7페이지), `Sections3.jsx` (프로그램·보험료·절차·준비·FAQ·다운로드·마무리)
- 다운로드 파일 교체: `public/downloads/`
- 색상: `tailwind.config.js` (ink / paper / accent / blue)

## Supabase
현재 불필요. 열람 로그, 고객 코멘트 수집, 견적 수치 실시간 반영이 필요해지면 추가합니다.

## 미리보기 단일 파일
`npm run build:single` → `dist-single/index.html` 하나로 전체 앱이 묶입니다(다운로드 링크 제외).
