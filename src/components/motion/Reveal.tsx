import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number; // Base delay in ms
  staggerIndex?: number; // Stagger multiplier (80ms per index)
  className?: string;
  as?: React.ElementType;
}

/**
 * Senior Motion Component: Viewport Scroll Reveal
 * - Fades up (opacity 0->1, translateY 24px->0, 700ms)
 * - Strict cubic-bezier(0.22, 1, 0.36, 1) easing
 * - Fires only ONCE when element crosses 0.15 threshold
 * - Respects prefers-reduced-motion
 * - Animate only transform and opacity (60fps on mobile)
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  staggerIndex = 0,
  className = '',
  as: Component = 'div',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const currentRef = domRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
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
  }, []);

  const totalDelay = delay + staggerIndex * 80;

  return (
    <Component
      ref={domRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0px)' : 'translateY(24px)',
        transition: `opacity 700ms cubic-bezier(0.22, 1, 0.36, 1) ${totalDelay}ms, transform 700ms cubic-bezier(0.22, 1, 0.36, 1) ${totalDelay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </Component>
  );
};
