/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: '#1D1D1F', paper: '#FBFBFD', accent: '#FF3B30', blue: '#007AFF' },
      fontFamily: { sans: ['Inter', 'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'system-ui', 'sans-serif'], mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'] },
    },
  },
  plugins: [],
};
