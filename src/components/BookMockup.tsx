import React, { useState, useRef, useEffect } from 'react';

interface BookMockupProps {
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const BookMockup: React.FC<BookMockupProps> = ({ size = 'md', interactive = true }) => {
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPointerFine, setIsPointerFine] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsPointerFine(window.matchMedia('(pointer: fine)').matches);
    }
  }, []);

  const sizeClasses = {
    sm: 'w-52 h-[300px] text-[10px]',
    md: 'w-64 sm:w-72 h-[380px] sm:h-[420px] text-xs',
    lg: 'w-72 sm:w-80 md:w-88 h-[440px] sm:h-[490px] md:h-[530px] text-sm',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !isPointerFine || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) / (rect.width / 2);
    const offsetY = (e.clientY - centerY) / (rect.height / 2);
    // Limit to max 6 degrees tilt
    const tiltX = Math.max(-6, Math.min(6, -offsetY * 6));
    const tiltY = Math.max(-6, Math.min(6, offsetX * 6));
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const baseRotateY = -18;
  const baseRotateX = 6;
  const currentRotateY = baseRotateY + tilt.y;
  const currentRotateX = baseRotateX + tilt.x;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative group perspective-1000 flex items-center justify-center py-4 select-none"
    >
      {/* Soft Ambient Glow & Synchronized Scaling Shadow under book */}
      <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-blue-600/20 blur-2xl rounded-full opacity-60 group-hover:opacity-85 transition-opacity duration-500 pointer-events-none animate-float-shadow" />

      {/* Floating Loop Wrapper */}
      <div className="animate-float-book">
        {/* Book Container with 3D Transform */}
        <div
          className={`relative ${sizeClasses[size]} rounded-r-lg rounded-l-sm shadow-2xl transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]`}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${currentRotateY}deg) rotateX(${currentRotateX}deg)`,
          }}
        >
        {/* Book Spine (left side thickness) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 rounded-l-sm origin-left border-r border-slate-700/40"
          style={{
            transform: 'rotateY(-90deg) translateX(-32px)',
          }}
        >
          <div className="h-full flex flex-col justify-between py-6 px-1 text-center text-slate-400 font-mono text-[9px] uppercase tracking-widest writing-mode-vertical">
            <span className="text-amber-400 font-bold">&gt;_</span>
            <span className="truncate">Prompt Engineering Handbook</span>
            <span>2026</span>
          </div>
        </div>

        {/* Book Cover Face */}
        <div className={`relative w-full h-full bg-[#0d1629] border border-slate-700/60 rounded-r-lg rounded-l-sm overflow-hidden flex flex-col justify-between ${
          size === 'sm' ? 'p-4 sm:p-5' : 'p-6 sm:p-7'
        } shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]`}>
          {/* Subtle Top Lighting Gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/5 pointer-events-none" />

          {/* Left Spine Shadow Crease Effect */}
          <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-black/60 via-black/25 to-transparent pointer-events-none" />

          {/* Cover Header / Terminal Icon */}
          <div className="relative z-10 pt-1">
            <div className={`inline-flex items-center justify-center ${
              size === 'sm' ? 'w-9 h-8 border' : 'w-12 h-10 border-2'
            } rounded-md border-amber-500/90 bg-slate-900/90 shadow-inner px-2 py-0.5`}>
              <span className={`font-mono text-amber-400 ${size === 'sm' ? 'text-sm' : 'text-lg'} font-bold tracking-tight`}>&gt;_</span>
            </div>
          </div>

          {/* Book Titles */}
          <div className="relative z-10 my-auto py-2">
            <h1 className={`${
              size === 'sm' ? 'text-lg leading-tight' : 'text-2xl sm:text-3xl leading-tight'
            } font-extrabold text-white tracking-tight uppercase font-sans`}>
              Prompt
              <br />
              <span className="text-white">Engineering</span>
              <br />
              <span className="text-white">Handbook</span>
            </h1>

            {/* Amber accent divider rule matching the actual book cover */}
            <div className={`${size === 'sm' ? 'w-10 h-0.5 my-2.5' : 'w-14 h-1 my-4'} bg-amber-500 rounded-full`} />

            <p className={`text-slate-300 font-medium ${size === 'sm' ? 'text-[11px]' : 'text-xs sm:text-sm'} leading-relaxed max-w-[240px]`}>
              100 Essential Topics, from Your First Prompt to Production
            </p>
          </div>

          {/* Cover Footer */}
          <div className="relative z-10 pt-2 border-t border-slate-800/80">
            <div className={`${size === 'sm' ? 'text-[8px]' : 'text-[10px] sm:text-xs'} font-mono font-semibold tracking-wider text-amber-400 uppercase`}>
              First Edition · October 2026
            </div>
            <div className={`${size === 'sm' ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'} text-slate-400 font-sans mt-0.5`}>
              Researched guide for beginners and builders
            </div>
          </div>

          {/* Diagonal sheen shine */}
          <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 pointer-events-none" />
        </div>

        {/* Page Edge Thickness (Right Side) */}
        <div
          className="absolute right-0 top-1 bottom-1 w-6 bg-gradient-to-r from-slate-200 via-amber-50 to-slate-300 rounded-r-xs shadow-md border-y border-r border-slate-400/40"
          style={{
            transform: 'rotateY(90deg) translateZ(12px) translateX(12px)',
          }}
        >
          {/* Subtle horizontal page lines */}
          <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(0deg,#94a3b8,#94a3b8_1px,transparent_1px,transparent_3px)]" />
        </div>
        </div>
      </div>
    </div>
  );
};
