import React from 'react';
import { GraduationCap, Users, Sparkles, Code2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const AudienceSection: React.FC = () => {
  const audiences = [
    {
      icon: GraduationCap,
      title: "Students & Beginners",
      desc: "Anyone who wants to understand how large language models think and produce reliable answers without needing a computer science degree or programming background.",
    },
    {
      icon: Users,
      title: "Daily ChatGPT & Claude Users",
      desc: "Knowledge workers who use AI assistants for emails, writing, brainstorming, and research, and want to eliminate repetitive back-and-forth prompts.",
    },
    {
      icon: Sparkles,
      title: "Content Creators & Marketers",
      desc: "Writers, copywriters, and creators who need consistent voice, precise word count control, and structured outputs without generic cliché phrasing.",
    },
    {
      icon: Code2,
      title: "Developers & AI Builders",
      desc: "Software engineers integrating LLMs into apps who require strict JSON schemas, tool calling, context window compaction, test sets, and prompt injection defense.",
    },
  ];

  return (
    <section id="who-its-for" className="py-16 sm:py-24 bg-slate-900/60 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-4">
            <Users className="w-3.5 h-3.5" />
            <span>Target Audience</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Who Should Read This Book?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Written in accessible, plain English with progressive depth. Whether you use AI for occasional writing or are building production AI agents, the principles apply directly.
          </p>
        </div>

        {/* 4 Audience Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {audiences.map((aud, idx) => {
            const Icon = aud.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-fit mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    {aud.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {aud.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transparent Non-Audience & Scope Disclaimer */}
        <div className="max-w-3xl mx-auto p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs sm:text-sm text-slate-300">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-white">An Honest Note on Scope:</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                This is a practical instructional digital eBook. It is <strong>not</strong> an accredited academic diploma, a promise of employment or salary increase, or a full machine learning algorithm textbook. It focuses 100% on actionable prompting, context design, evaluation, and safe AI usage.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
