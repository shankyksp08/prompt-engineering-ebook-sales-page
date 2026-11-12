import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number; // Duration in ms (~1200ms default)
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Approximate cubic-bezier(0.22, 1, 0.36, 1) ease-out curve
 */
function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

/**
 * Senior Motion Component: Count-up Statistics
 * - Counts up from 0 to target over ~1.2s
 * - Triggers only once when entering viewport
 * - Respects prefers-reduced-motion
 */
export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 1200,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const domRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(end);
      return;
    }

    const currentRef = domRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasStarted(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [end]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const currentVal = Math.round(easedProgress * end);
      setCount(currentVal);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [hasStarted, end, duration]);

  return (
    <span ref={domRef} className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};
