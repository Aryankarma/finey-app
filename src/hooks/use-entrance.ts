import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Milliseconds since the screen mounted, counted up to `untilMs` on each frame.
// Jumps straight to the end when the system asks for reduced motion.
export function useEntrance(untilMs: number): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    let start: number | null = null;

    const step = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(now - start, untilMs);
      setElapsed(t);
      if (t < untilMs) raf = requestAnimationFrame(step);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) setElapsed(untilMs);
        else raf = requestAnimationFrame(step);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [untilMs]);

  return elapsed;
}

// 0 to 1 progress of one animation that starts at `delay` and lasts `duration`.
export function progress(elapsed: number, delay: number, duration: number): number {
  return Math.min(Math.max((elapsed - delay) / duration, 0), 1);
}

export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
