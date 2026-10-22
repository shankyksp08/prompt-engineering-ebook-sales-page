import React from 'react';
import { BookOpen, FileCheck2, LayoutGrid, Terminal, BookmarkCheck, Calendar, BookMarked, Search, ArrowRight } from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';
import { BookMockup } from './BookMockup.tsx';

interface WhatsIncludedProps {
  onBuyClick: () => void;
  onPreviewClick: () => void;
}

export const WhatsIncluded: React.FC<WhatsIncludedProps> = ({ onBuyClick, onPreviewClick }) => {
  const deliverables = [
    {
      icon: BookOpen,
      title: "The Complete 81-Page Handbook",
      desc: "Comprehensive First Edition (October 2026) digital PDF eBook with clean vector typography and zero filler.",
      detail: "81 pages · 100 topics",
    },
    {
      icon: LayoutGrid,
      title: "Nine Organized Parts",
      desc: "A progressive path from core foundations and anatomy to reasoning models, JSON structured outputs, and agentic workflows.",
      detail: "Parts 1 to 9",
    },
    {
      icon: Terminal,
      title: "Practical 'Try This Prompt' Snippets",
      desc: "Every topic ends with an actionable prompt snippet showing exact input wording, constraints, and before/after comparisons.",
      detail: "Dozens of examples",
    },
    {
      icon: BookmarkCheck,
      title: "Appendix A: One-Page Cheat Sheet",
      desc: "The 10-point checklist (Goal, Context, Task, Format, Tone, Constraints, Examples, Success, Safety, Test) plus 5 core rules.",
      detail: "Page 73 printable",
    },
    {
      icon: FileCheck2,
      title: "Appendix B: 10 Ready-to-Use Templates",
      desc: "Reusable skeletons for universal starters, beginner explanations, evidence summarization, rewriting, JSON extraction, and prompt debugging.",
      detail: "Templates B1 to B10",
    },
    {
      icon: BookMarked,
      title: "Appendix C: AI Terminology Glossary",
      desc: "Clear, plain-English definitions for ReAct, RAG, Chain-of-thought, hallucination, LLM-as-judge, prompt injection, and context engineering.",
      detail: "Pages 77-78",
    },
    {
      icon: Calendar,
      title: "Appendix D: Four-Week Learning Plan",
      desc: "A structured 20-30 minutes per day study roadmap guiding you from basic prompts to testing and production evaluation.",
      detail: "Page 79 roadmap",
    },
    {
      icon: Search,
      title: "Appendix E: Academic Sources & References",
      desc: "Direct citations to seminal papers (The Prompt Report, Anthropic context engineering, OpenAI best practices, Greshake et al.).",
      detail: "Curated bibliography",
    },
  ];

  return (
    <section id="whats-included" className="py-16 sm:py-24 bg-slate-950/80 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Complete Deliverable Package</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            What&apos;s Included in Your Purchase
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Everything listed below is included in the actual PDF eBook file. No hidden extras, no separate subscriptions, and no fabricated bonus packs.
          </p>
        </div>

        {/* Deliverables Grid with Central Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          
          {/* Left Column (4 items) */}
          <div className="lg:col-span-4 space-y-4">
            {deliverables.slice(0, 4).map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {item.detail}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Center Column (Book Mockup) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center py-6">
            <BookMockup size="md" interactive={false} />
            <div className="mt-4 text-center">
              <span className="text-xs font-mono text-slate-400 block">
                Instant delivery via PDF link
              </span>
              <span className="text-sm font-bold text-cyan-400 mt-1 block">
                Instant one-time digital access
              </span>
            </div>
          </div>

          {/* Right Column (4 items) */}
          <div className="lg:col-span-4 space-y-4">
            {deliverables.slice(4, 8).map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {item.detail}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onBuyClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <span>Get This eBook</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onPreviewClick}
            className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Inspect Sample Excerpts
          </button>
        </div>

      </div>
    </section>
  );
};
