import React from 'react';
import { AlertCircle, HelpCircle, Repeat, FileSpreadsheet, XCircle } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const problems = [
    {
      icon: AlertCircle,
      title: "Vague Prompts Lead to Generic Answers",
      description: "Asking 'Write a blog post about marketing' produces generic clichés. Models are literal: ask for something vague and you get something shallow and unusable.",
      highlight: "Topic 1 & 10",
    },
    {
      icon: HelpCircle,
      title: "Missing Context and Unclear Boundaries",
      description: "The model has no idea who your audience is, what constraints you have, or what success looks like unless you specify it clearly up front.",
      highlight: "Topic 13 & 14",
    },
    {
      icon: Repeat,
      title: "Blind Guesswork Instead of Systematic Iteration",
      description: "When a prompt fails, most people re-roll or rewrite the entire thing at random instead of isolating variables, tuning temperature, or using delimiters.",
      highlight: "Topic 34 & 94",
    },
    {
      icon: FileSpreadsheet,
      title: "Unpredictable Output Shapes and Broken Formats",
      description: "Trying to get clean JSON, structured markdown tables, or specific schemas often results in broken syntax and hallucinated markdown wrappers.",
      highlight: "Topic 56 & 57",
    },
    {
      icon: XCircle,
      title: "Blindly Trusting Plausible-Sounding Hallucinations",
      description: "Language models generate likely-sounding text rather than verifying factual databases. Without grounding and test sets, errors silently creep into production.",
      highlight: "Topic 9 & 98",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-slate-900/60 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono uppercase tracking-wider mb-4">
            <span>Common AI Frustrations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Why Most People Struggle to Get Reliable Answers from AI
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            AI language models are more capable than ever, but prompt quality still determines output quality. These are the five most frequent obstacles readers face before mastering structured prompting.
          </p>
        </div>

        {/* Problem Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((prob, i) => {
            const Icon = prob.icon;
            return (
              <div
                key={i}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 text-rose-400 border border-slate-700/60 group-hover:bg-rose-500/10 group-hover:border-rose-500/30 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                      Addressed in {prob.highlight}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">
                    {prob.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {prob.description}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Solution Teaser Card */}
          <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/40 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block mb-2">
                The Core Shift
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">
                From Casual Chatting to Disciplined Prompt Engineering
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                You do not need arcane &ldquo;magic keywords.&rdquo; You need a clear mental model of how language models interpret instructions, structured delimiters, and systematic evaluation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-cyan-300 font-medium">
              Every chapter in the handbook turns vague requests into precise instructions.
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
