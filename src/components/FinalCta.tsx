import React from 'react';
import { ArrowRight, CheckCircle2, Download, Sparkles } from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';
import { BookMockup } from './BookMockup.tsx';

interface FinalCtaProps {
  onBuyClick: () => void;
  onPreviewClick: () => void;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ onBuyClick, onPreviewClick }) => {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden border-t border-slate-800/80">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-8 sm:p-12 lg:p-14 shadow-2xl backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Digital Access</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Start Writing Clearer, More Reliable AI Prompts Today
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Get immediate access to the complete 81-page handbook, 100 focused topics, practical before-and-after prompt snippets, printable cheat sheet, 10 reusable templates, and 4-week study plan.
              </p>

              {/* Inclusions summary list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200 py-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>81-Page Digital PDF Handbook</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>100 Practical Focused Topics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>One-Page Prompt Cheat Sheet</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>10 Ready-to-Use Templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>AI Terminology Glossary</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Four-Week Learning Plan</span>
                </div>
              </div>

              {/* Price & CTA Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={onBuyClick}
                  className="flex items-center justify-center gap-3 py-4 px-8 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-base transition-all shadow-xl shadow-cyan-500/25 active:scale-98 focus:outline-none focus:ring-2 focus:ring-cyan-300 cursor-pointer"
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
                  className="py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs sm:text-sm transition-colors text-center cursor-pointer"
                >
                  Inspect Sample Pages First
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  Immediate Post-Checkout Access
                </span>
              </div>
            </div>

            {/* Right Mini Book Visual */}
            <div className="lg:col-span-5 hidden lg:flex items-center justify-center">
              <BookMockup size="md" interactive={true} />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
