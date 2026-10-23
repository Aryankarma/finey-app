import { Easing } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { progress, useEntrance } from '@/hooks/use-entrance';
import { colors } from '@/ui/theme';

const R = 34;
const CIRCLE = 2 * Math.PI * R;
// "M25 39l9 9 17-19": two strokes, √(9²+9²) + √(17²+19²)
const TICK = Math.hypot(9, 9) + Math.hypot(17, 19);
const draw = Easing.bezier(0.4, 0, 0.2, 1);

// The success mark from the boards: the circle draws round, then the tick draws in.
// Plays from the start each time it mounts.
export function DrawnCheck({ size = 76, color = colors.mint }: { size?: number; color?: string }) {
  const elapsed = useEntrance(900);
  const ring = draw(progress(elapsed, 200, 500));
  const tick = draw(progress(elapsed, 550, 320));

  return (
    <Svg width={size} height={size} viewBox="0 0 76 76" aria-hidden>
      <Circle
        cx={38}
        cy={38}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={`${CIRCLE} ${CIRCLE}`}
        strokeDashoffset={CIRCLE * (1 - ring)}
        transform="rotate(-90 38 38)"
      />
      <Path
        d="M25 39l9 9 17-19"
        fill="none"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${TICK} ${TICK}`}
        strokeDashoffset={TICK * (1 - tick)}
        opacity={tick > 0 ? 1 : 0}
      />
    </Svg>
  );
}
