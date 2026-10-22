import React, { useState } from 'react';
import { BookOpen, Compass, Zap, Wrench, Hammer, CheckCircle2, ArrowRight } from 'lucide-react';
import { READING_PATHS } from '../utils/funnel.ts';

export const PrefaceSection: React.FC = () => {
  const [activePathId, setActivePathId] = useState<'30-minute' | 'practical' | 'builder'>('30-minute');

  const pathIcons = {
    '30-minute': Zap,
    practical: Wrench,
    builder: Hammer,
  };

  const activePath = READING_PATHS.find((p) => p.id === activePathId) || READING_PATHS[0];
  const PathIcon = pathIcons[activePath.id];

  return (
    <section id="preface" className="py-16 sm:py-24 bg-slate-900/80 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Preface · Page 9 of the Handbook</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Preface: Start Here
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Written for people new to prompt engineering. Nothing here assumes technical training. Where a topic becomes technical, it says so plainly.
          </p>
        </div>

        {/* 2-Column Preface Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          {/* Left Column: Author's Opening & Research Foundation */}
          <div className="lg:col-span-6 bg-slate-950/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 text-slate-300 text-sm leading-relaxed">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <span>How This Book Was Researched &amp; Organised</span>
            </h3>

            <p>
              Prompt engineering is the practice of writing, testing and improving the instructions you give to AI models. It started as a collection of tricks and has matured into a real discipline with research, official vendor guidance and professional practice.
            </p>

            <p>
              A large academic survey called <em>The Prompt Report</em> reviewed more than <strong>1,500 papers</strong> and mapped <strong>58 text-based prompting techniques</strong>; this handbook distils the ideas that matter most in practice into <strong>100 focused topics</strong>.
            </p>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-white">Direct Guidance Synthesized From:</div>
              <ul className="grid grid-cols-2 gap-1.5 text-slate-400 font-mono text-[11px]">
                <li>• OpenAI Best Practices</li>
                <li>• Anthropic Context Engineering</li>
                <li>• 1,500+ Academic Surveys</li>
                <li>• 2026 Production Guides</li>
              </ul>
            </div>

            <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl italic">
              &ldquo;Reading teaches you what prompting is; running prompts teaches you how to do it. Each topic ends with a box labelled Try this prompt. Copy it, replace the brackets, and run it.&rdquo;
            </p>
          </div>

          {/* Right Column: The Three Ways to Read */}
          <div className="lg:col-span-6 bg-slate-950/70 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Three Ways to Read</h3>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  Choose your pace
                </span>
              </div>

              {/* Path Switcher Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 mb-6">
                {READING_PATHS.map((p) => {
                  const Icon = pathIcons[p.id];
                  const isActive = activePathId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActivePathId(p.id)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{p.title.replace('The ', '')}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Path Card */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800/90 text-left space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <PathIcon className="w-4 h-4 text-amber-400" />
                    <span>{activePath.title}</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {activePath.recommendedTopics.length} sections
                  </span>
                </div>

                <div className="text-xs text-amber-300/90 font-mono">
                  Audience: {activePath.targetAudience}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {activePath.description}
                </p>

                {/* Topics list */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Recommended Reading Checklist:
                  </div>
                  <div className="space-y-1 text-xs">
                    {activePath.recommendedTopics.map((topic, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-1.5 rounded bg-slate-950 border border-slate-800/80 text-slate-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Ready to dive into the lessons?</span>
              <a
                href="#foundations-and-topics"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold underline"
              >
                <span>View Foundations &amp; Topics below</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
