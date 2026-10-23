import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Line icons from design/boards, drawn on a 24 x 24 grid.
type Shape =
  | { d: string; strokeWidth?: number }
  | { rect: [x: number, y: number, w: number, h: number, r: number] }
  | { circle: [cx: number, cy: number, r: number] };

const icons = {
  chevronDown: [{ d: 'm6 9 6 6 6-6' }],
  eye: [{ d: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z' }, { circle: [12, 12, 3] }],
  eyeOff: [
    {
      d: 'M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.5 4.5-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2',
    },
  ],
  sliders: [{ d: 'M4 7h10M18 7h2M4 17h2M10 17h10' }, { circle: [16, 7, 2] }, { circle: [8, 17, 2] }],
  keypad: [{ d: 'M6 6h.01M12 6h.01M18 6h.01M6 12h.01M12 12h.01M18 12h.01M6 18h.01M12 18h.01M18 18h.01', strokeWidth: 2.6 }],
  mic: [{ rect: [9, 3, 6, 11, 3] }, { d: 'M5 11a7 7 0 0 0 14 0M12 18v3' }],

  home: [{ d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' }],
  spending: [{ d: 'M12 3a9 9 0 1 0 9 9h-9z' }, { d: 'M15 3.5A9 9 0 0 1 20.5 9H15z' }],
  ledger: [{ d: 'M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01' }],
  people: [{ circle: [9, 8, 3.5] }, { d: 'M3 20c.8-3.4 3.2-5 6-5s5.2 1.6 6 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c1.6.6 2.6 2.2 3 5' }],
  wealth: [{ d: 'm3 17 6-6 4 4 8-8M15 7h6v6' }],

  food: [{ d: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1.5-3 4-3 7h3' }],
  transport: [{ d: 'M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM5 11h14' }],
  utilities: [{ d: 'M13 2 4 14h7l-1 8 9-12h-7z' }],
  shopping: [{ d: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2' }],
  entertainment: [{ rect: [3, 5, 18, 14, 2] }, { d: 'M7 5v14M17 5v14M3 12h18' }],
  health: [{ d: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' }],
  education: [{ d: 'm2 9 10-5 10 5-10 5z' }, { d: 'M6 11v5c3 2 9 2 12 0v-5' }],
  other: [{ d: 'M5.5 12h1M11.5 12h1M17.5 12h1' }],
  salary: [{ d: 'M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }, { d: 'M3 7V6a2 2 0 0 1 2-2h11v3M16 14h2' }],
  freelance: [{ rect: [3, 7, 18, 13, 2] }, { d: 'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18' }],
  bonus: [{ d: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3-5-3-5-1s3 1 5 1zM12 7c1.5-3 5-3 5-1s-3 1-5 1z' }],
  investment: [{ d: 'm3 17 6-6 4 4 8-8M15 7h6v6' }],

  close: [{ d: 'M6 6l12 12M18 6 6 18' }],
  back: [{ d: 'M19 12H5M11 6l-6 6 6 6' }],
  chevronLeft: [{ d: 'm15 18-6-6 6-6' }],
  chevronRight: [{ d: 'm9 18 6-6-6-6' }],
  lines: [{ d: 'M4 6h16M4 12h16M4 18h10' }],
  calendar: [{ rect: [3.5, 5, 17, 15, 3] }, { d: 'M8 3v4M16 3v4M3.5 10h17' }],
  backspace: [{ d: 'M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z' }, { d: 'm12 9.5 5 5M17 9.5l-5 5' }],
  clear: [{ circle: [12, 12, 9] }, { d: 'm9 9 6 6M15 9l-6 6' }],
  plus: [{ d: 'M12 5v14M5 12h14' }],
  check: [{ d: 'm5 12.5 4.5 4.5L19 7.5' }],
  search: [{ circle: [11, 11, 7] }, { d: 'm20 20-3.5-3.5' }],
  upload: [{ d: 'M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6' }],
  bookmark: [{ d: 'M6 3h12v18l-6-4-6 4z' }],
  trash: [{ d: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13' }],
  edit: [{ d: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4' }],
  person: [{ circle: [12, 8, 4] }, { d: 'M4 21c1-4 4-6 8-6s7 2 8 6' }],
  arrowIn: [{ d: 'M17 7 7 17M7 9v8h8' }],
  arrowOut: [{ d: 'M7 17 17 7M9 7h8v8' }],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 20,
  color,
  strokeWidth = 1.75,
  fill = 'none',
}: {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
  fill?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {(icons[name] as Shape[]).map((shape, i) => {
        if ('rect' in shape) {
          const [x, y, width, height, r] = shape.rect;
          return <Rect key={i} x={x} y={y} width={width} height={height} rx={r} />;
        }
        if ('circle' in shape) {
          const [cx, cy, r] = shape.circle;
          return <Circle key={i} cx={cx} cy={cy} r={r} />;
        }
        return <Path key={i} d={shape.d} strokeWidth={shape.strokeWidth} />;
      })}
    </Svg>
  );
}
