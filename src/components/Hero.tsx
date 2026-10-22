import React from 'react';
import { ArrowRight, BookOpen, CheckCircle, Sparkles, FileText, Download } from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';
import { BookMockup } from './BookMockup.tsx';

interface HeroProps {
  onBuyClick: () => void;
  onPreviewClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBuyClick, onPreviewClick }) => {
  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28 overflow-hidden">
      {/* Background radial glow & refined grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px]" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Value Proposition & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-mono text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
                Digital PDF eBook · 81 Pages
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">First Edition (October 2026)</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
              Write Better AI Prompts.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                Get More Useful Results.
              </span>
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl font-normal">
              A practical handbook that helps readers understand prompt engineering, write clearer AI instructions, improve prompts through iteration, and master reliable prompting techniques and workflows.
            </p>

            {/* Three concise benefits */}
            <div className="space-y-3 mb-8 w-full">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm text-slate-200">
                  <strong className="text-white">100 Focused Topics across 9 Parts:</strong> From fundamental instructions to JSON Schema, agent planning, and prompt injection defense.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm text-slate-200">
                  <strong className="text-white">Practical &ldquo;Try This Prompt&rdquo; Snippets:</strong> Concrete before-and-after examples tested against leading models.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm text-slate-200">
                  <strong className="text-white">Complete Starter Toolkit:</strong> 1-page prompt cheat sheet, 10 ready-to-use prompt templates, glossary, and a 4-week learning plan.
                </p>
              </div>
            </div>

            {/* Pricing & CTA Button Block */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
              <button
                onClick={onBuyClick}
                className="flex items-center justify-center gap-3 py-4 px-8 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-base transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-98 focus:outline-none focus:ring-2 focus:ring-cyan-300 cursor-pointer"
              >
                <span>Get This eBook</span>
                <span
                  style={{ color: '#FFFFFF' }}
                  className="py-0.5 px-2.5 rounded-lg bg-slate-950/75 border border-white/20 text-[#FFFFFF] font-sans font-bold text-lg leading-none inline-flex items-center shadow-sm"
                >
                  {FUNNEL_CONFIG.productPrice}
                </span>
                <ArrowRight className="w-5 h-5 text-slate-950" />
              </button>

              <button
                onClick={onPreviewClick}
                className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Look Inside (Sample Pages)</span>
              </button>
            </div>

            {/* Format reassurance */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Instant Digital PDF (~305 KB)
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                Direct Download After Checkout
              </span>
            </div>

          </div>

          {/* Right Column: Realistic 3D eBook Cover Presentation */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative flex flex-col items-center">
              <BookMockup size="lg" interactive={true} />

              {/* Quick Feature Pill under book */}
              <div className="mt-4 flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-full py-2 px-4 shadow-xl text-xs">
                <span className="font-mono text-amber-400 font-bold uppercase text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Zero Fluff
                </span>
                <span className="text-slate-300 font-medium">
                  100 topics · 10 templates · 1 cheat sheet
                </span>
              </div>

              {/* Floating Format Badge */}
              <div className="absolute top-2 -right-4 sm:-right-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-xl py-2 px-3 shadow-xl hidden sm:flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">PDF</span>
                <span className="text-[11px] text-slate-300">81 Pages</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
