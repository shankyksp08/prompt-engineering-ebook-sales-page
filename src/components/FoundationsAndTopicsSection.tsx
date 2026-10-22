import React, { useState } from 'react';
import { Layers, Terminal, Sparkles, ChevronDown, ChevronUp, Copy, Check, CheckCircle2 } from 'lucide-react';
import { BOOK_PARTS, CURATED_TOPICS } from '../data/bookData.ts';

export const FoundationsAndTopicsSection: React.FC = () => {
  const [selectedPart, setSelectedPart] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentPart = BOOK_PARTS.find((p) => p.partNumber === selectedPart) || BOOK_PARTS[0];

  // Curated prompts that match this part
  const partCuratedTopics = CURATED_TOPICS.filter((t) => t.part === selectedPart);

  return (
    <section id="foundations-and-topics" className="py-16 sm:py-24 bg-slate-950/80 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>Complete Curriculum</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Foundations &amp; 100 Topics
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            From essential mental models in Part 1 (tokens, temperature, and hallucinations) to the complete 100-topic syllabus across all 9 organized parts.
          </p>
        </div>

        {/* 9 Parts Navigation Bar */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            {BOOK_PARTS.map((part) => {
              const isSelected = selectedPart === part.partNumber;
              return (
                <button
                  key={part.partNumber}
                  onClick={() => setSelectedPart(part.partNumber)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 font-bold'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className={`font-mono text-[10px] uppercase ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}>
                    Part {part.partNumber}
                  </span>
                  <span>{part.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Part Overview & Content Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
          
          {/* Part Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full uppercase">
                  {currentPart.partNumberText}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {currentPart.topicsRange} · Page {currentPart.page}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                {currentPart.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
                {currentPart.description}
              </p>
            </div>

            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 shrink-0 text-center">
              <span className="text-xs font-mono text-cyan-400 font-bold block">
                {currentPart.topics.length} Topics
              </span>
              <span className="text-[10px] text-slate-400 block">
                in this part
              </span>
            </div>
          </div>

          {/* Curated "Try This Prompt" Sample for This Part (if available) */}
          {partCuratedTopics.length > 0 && (
            <div className="mb-8 space-y-4">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Featured Topic &amp; Practical Prompt From This Part:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partCuratedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] font-bold text-cyan-400">
                          Topic #{topic.id}: {topic.title}
                        </span>
                        <button
                          onClick={() => handleCopy(topic.id, topic.tryPrompt.text)}
                          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-[11px] flex items-center gap-1"
                          title="Copy prompt text"
                        >
                          {copiedId === topic.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {topic.summary}
                      </p>

                      <pre className="text-xs font-mono text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap leading-relaxed">
                        {topic.tryPrompt.text}
                      </pre>
                    </div>

                    {topic.proTip && (
                      <div className="mt-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Tip:</strong> {topic.proTip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Chapter List in This Part */}
          <div>
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>All Topics in Part {currentPart.partNumber}:</span>
              <span className="text-[11px] text-slate-500">From the official table of contents</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {currentPart.topics.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className="font-mono text-[11px] text-cyan-400 font-bold w-7 shrink-0">
                      #{t.id}
                    </span>
                    <span className="truncate font-medium">{t.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0">
                    p. {t.page}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Syllabus Footer Summary */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full syllabus contains 100 chapters across 81 pages</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-400">
              <span>Includes Appendices A to E (Cheat Sheet, 10 Templates, Glossary)</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
