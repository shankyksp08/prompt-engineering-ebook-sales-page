import React, { useState } from 'react';
import { X, BookOpen, ChevronRight, CheckCircle2, Download, ExternalLink } from 'lucide-react';
import { BOOK_SAMPLE_PAGES } from '../data/bookData.ts';

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetBook: () => void;
}

export const ProductPreviewModal: React.FC<ProductPreviewModalProps> = ({
  isOpen,
  onClose,
  onGetBook,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!isOpen) return null;

  const currentSample = BOOK_SAMPLE_PAGES[selectedIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 id="preview-modal-title" className="text-lg font-bold text-white tracking-tight">
                Product Preview: Look Inside the Handbook
              </h3>
              <p className="text-xs text-slate-400">
                Genuine page excerpts from the 81-page First Edition PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview modal"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left page selector + Right preview pane */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar / Page selector */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1 hidden md:block">
              Sample Pages
            </span>
            {BOOK_SAMPLE_PAGES.map((page, idx) => (
              <button
                key={page.pageNumber}
                onClick={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all whitespace-nowrap md:whitespace-normal shrink-0 md:shrink ${
                  selectedIndex === idx
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div>
                  <div className="font-mono text-[10px] text-amber-400 uppercase">
                    {page.label} · Page {page.pageNumber}
                  </div>
                  <div className="text-xs truncate max-w-[150px]">{page.title}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 hidden md:block text-slate-400" />
              </button>
            ))}
          </div>

          {/* Main Excerpt Viewer (Styled like the book's clean pages) */}
          <div className="flex-1 p-5 sm:p-7 overflow-y-auto bg-slate-900/90 flex flex-col justify-between">
            <div>
              {/* Breadcrumb / Page marker */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4 pb-2 border-b border-slate-800">
                <span className="text-amber-400 font-semibold">{currentSample.label}</span>
                <span>Page {currentSample.pageNumber} of 81</span>
              </div>

              {/* Page Title */}
              <h4 className="text-xl sm:text-2xl font-bold text-white mb-4 tracking-tight">
                {currentSample.title}
              </h4>

              {/* Page Text Excerpt */}
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line space-y-3 font-sans">
                {currentSample.excerpt}
              </div>

              {/* Try This Prompt callout if present */}
              {currentSample.tryPromptSnippet && (
                <div className="mt-5 p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 shadow-inner">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    TRY THIS PROMPT
                  </div>
                  <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    {currentSample.tryPromptSnippet}
                  </pre>
                </div>
              )}

              {/* Key Takeaway */}
              <div className="mt-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Key Takeaway:</strong> {currentSample.takeaway}
                </span>
              </div>
            </div>

            {/* Bottom Bar within Preview */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                Want all 100 topics, 10 templates, and full cheat sheets?
              </span>
              <button
                onClick={() => {
                  onClose();
                  onGetBook();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <span>Get This eBook</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
