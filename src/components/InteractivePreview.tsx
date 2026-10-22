import React, { useState } from 'react';
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { BOOK_SAMPLE_PAGES } from '../data/bookData.ts';

interface InteractivePreviewProps {
  onOpenFullModal: () => void;
  onBuyClick: () => void;
}

export const InteractivePreview: React.FC<InteractivePreviewProps> = ({
  onOpenFullModal,
  onBuyClick,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const prevPage = () => {
    setCurrentPageIndex((prev) => (prev > 0 ? prev - 1 : BOOK_SAMPLE_PAGES.length - 1));
  };

  const nextPage = () => {
    setCurrentPageIndex((prev) => (prev < BOOK_SAMPLE_PAGES.length - 1 ? prev + 1 : 0));
  };

  const current = BOOK_SAMPLE_PAGES[currentPageIndex];

  return (
    <section id="preview" className="py-16 sm:py-24 bg-slate-900/50 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive Sample Reader</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Look Inside the Handbook
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Read selected genuine excerpts directly below. Experience the crisp explanations, practical examples, and clear layout before purchasing.
          </p>
        </div>

        {/* Reader Frame */}
        <div className="max-w-4xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Top reader control bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-mono text-xs text-slate-300">
                {current.label} · Page {current.pageNumber} of 81
              </span>
            </div>

            {/* Quick tab pills */}
            <div className="hidden sm:flex items-center gap-1 overflow-x-auto">
              {BOOK_SAMPLE_PAGES.map((p, idx) => (
                <button
                  key={p.pageNumber}
                  onClick={() => setCurrentPageIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                    currentPageIndex === idx
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={onOpenFullModal}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expanded View</span>
            </button>
          </div>

          {/* Book Page Content Simulation */}
          <div className="p-6 sm:p-10 min-h-[380px] sm:min-h-[420px] flex flex-col justify-between bg-gradient-to-b from-slate-950 to-slate-900/90 text-white">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-6 text-xs font-mono text-slate-400">
                <span className="uppercase tracking-widest text-amber-400 font-semibold">
                  PROMPT ENGINEERING HANDBOOK
                </span>
                <span>Page {current.pageNumber}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 tracking-tight">
                {current.title}
              </h3>

              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line space-y-3 font-sans">
                {current.excerpt}
              </div>

              {current.tryPromptSnippet && (
                <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-amber-500/30">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 mb-2">
                    TRY THIS PROMPT
                  </div>
                  <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {current.tryPromptSnippet}
                  </pre>
                </div>
              )}
            </div>

            {/* Bottom page bar */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  aria-label="Previous sample page"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <button
                  onClick={nextPage}
                  aria-label="Next sample page"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-slate-400 text-center hidden md:block">
                Sample {currentPageIndex + 1} of {BOOK_SAMPLE_PAGES.length}
              </div>

              <button
                onClick={onBuyClick}
                className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors shadow-sm"
              >
                Get Full 81-Page eBook
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
