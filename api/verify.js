// Vercel Serverless Function — 서버 측 패스워드 검증.
// Vercel 프로젝트 Settings → Environment Variables 에 REPORT_PASSWORD 를 설정하세요.
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ valid: false });
  const expected = process.env.REPORT_PASSWORD;
  const given = (req.body && req.body.password) || '';
  if (!expected) return res.status(500).json({ valid: false, error: 'REPORT_PASSWORD not set' });
  const valid = typeof given === 'string' && given === expected;
  return res.status(200).json({ valid });
}
