import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { FREQUENTLY_ASKED_QUESTIONS } from '../data/bookData.ts';
import { Reveal } from './motion/Reveal.tsx';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First FAQ open by default

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-slate-900/60 border-t border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-4">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Frequently Asked Questions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Common Questions &amp; Clear Answers
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Honest details about file delivery, compatibility, technical prerequisites, and contents.
            </p>
          </div>
        </Reveal>

        {/* FAQs Accordion */}
        <div className="space-y-3.5">
          {FREQUENTLY_ASKED_QUESTIONS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <Reveal key={idx} staggerIndex={idx}>
                <div
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <span className="font-bold text-white text-sm sm:text-base pr-4">
                      {item.question}
                    </span>
                    <div className="p-1 rounded-lg bg-slate-800 shrink-0">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/30">
                        {item.answer}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

      </div>
    </section>
  );
};
