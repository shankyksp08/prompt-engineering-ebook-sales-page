import React from 'react';
import { BookOpen, Terminal, RefreshCw, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: "STEP 1",
      icon: BookOpen,
      title: "Learn a Concept",
      description: "Read a short, focused topic explaining the exact mechanics in plain language—such as delimiters, few-shot examples, or JSON schemas.",
    },
    {
      step: "STEP 2",
      icon: Terminal,
      title: "Try or Adapt a Prompt",
      description: "Copy the provided 'Try This Prompt' starter snippet into ChatGPT, Claude, or Gemini. Replace the bracketed variables with your own task details.",
    },
    {
      step: "STEP 3",
      icon: RefreshCw,
      title: "Evaluate & Refine Your Approach",
      description: "Compare the output against the success criteria checklist. Diagnose any ambiguity using the 12 common mistakes guide and lock in a permanent template.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-950/70 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-4">
            <span>The 3-Step Feedback Loop</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            How to Master Prompt Engineering with This Handbook
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Reading teaches you what prompting is; running prompts teaches you how to do it. The book is structured around a rapid 3-step practice loop.
          </p>
        </div>

        {/* 3 Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                      {s.step}
                    </span>
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
