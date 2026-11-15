const D = {
  auto: 'M9 53 Q8 37 22 31 L53 29 Q67 31 70 53 Z M22 31 L27 19 L51 18 L53 29 M16 56 a8 8 0 1 0 .1 0 M56 56 a8 8 0 1 0 .1 0',
  tap: 'M13 31 Q12 17 28 18 L50 17 Q59 18 58 29 L58 35 M30 18 L29 10 M22 10 L38 9 M52 35 L53 45 M50 54 q3 5 5 0 q-2 -6 -5 0 M54 62 q2 3 3 0',
  bag: 'M16 28 L64 27 L67 66 L13 67 Z M28 28 Q28 12 40 13 Q52 12 52 27 M30 44 q10 8 21 0',
  cap: 'M14 22 L40 14 L66 23 L40 33 Z M24 29 L25 45 Q40 54 55 45 L56 29 M66 23 L67 42',
  cake: 'M15 61 L16 40 Q40 33 65 40 L64 61 Z M16 49 Q28 56 40 49 T64 49 M40 39 L40 27 M40 21 q-4 4 0 7 q4 -3 0 -7',
  gift: 'M14 34 L66 33 L65 46 L15 47 Z M18 47 L19 68 L62 67 L63 46 M40 34 L40 68 M40 34 Q28 18 24 28 Q26 36 40 34 Q54 18 58 28 Q54 36 40 34',
  yarn: 'M40 16 a24 24 0 1 0 .1 0 M22 30 Q40 40 60 28 M17 44 Q40 56 64 42 M24 58 Q42 62 58 56 M58 62 Q70 70 74 64',
  bulb: 'M40 14 Q22 16 24 36 Q26 46 33 52 L33 60 L47 60 L47 52 Q55 46 57 36 Q58 16 40 14 M34 66 L46 66 M36 72 L44 72',
  wrench: 'M52 14 Q64 14 66 26 L58 28 L52 22 Z M54 26 L20 60 Q14 66 20 70 Q26 74 32 68 L64 38',
};
export default function Doodle({ k = 'bag', blob = '#ffffff99', size = 80, rotate = 0 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ transform: `rotate(${rotate}deg)` }} aria-hidden="true">
      <path d="M20 40 Q14 18 40 16 Q68 14 66 42 Q64 68 38 66 Q16 64 20 40z" fill={blob} />
      <path d={D[k]} fill="none" stroke="#15141A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
