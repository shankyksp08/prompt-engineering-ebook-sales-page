import React from 'react';
import { Target, Layers, RefreshCw, Briefcase, FileCode2, ShieldAlert } from 'lucide-react';

export const KeyBenefits: React.FC = () => {
  const benefits = [
    {
      icon: Target,
      title: "Write Clearer, Direct Instructions",
      description: "Replace vague adjectives with explicit requirements. Master the 4-question checklist (goal, audience, format, failure modes) so the model delivers precisely what you need on the first turn.",
    },
    {
      icon: Layers,
      title: "Master Structural Delimiters & XML Tags",
      description: "Learn how Claude, ChatGPT, and Gemini use XML tags and triple delimiters to prevent models from confusing source material with system instructions.",
    },
    {
      icon: RefreshCw,
      title: "Iterate and Refine Systematically",
      description: "Stop throwing random rewrites at chat windows. Learn how to diagnose prompt failures, isolate parameters like temperature, and run self-critique loops.",
    },
    {
      icon: Briefcase,
      title: "Workflows for 16 Real Job Tasks",
      description: "Jump straight into practical starter templates for copywriting, summarization, research, spreadsheet formulas, Python debugging, customer support, and strategy.",
    },
    {
      icon: FileCode2,
      title: "Enforce Valid JSON & Structured Output",
      description: "Guarantee that downstream systems, web apps, and databases receive valid, uncorrupted data using JSON schemas and clear field constraints without markdown noise.",
    },
    {
      icon: ShieldAlert,
      title: "Identify Prompt Injection & Hallucinations",
      description: "Understand the security vulnerabilities of untrusted user input, indirect prompt injection, and how to implement defense-in-depth for production applications.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-4">
            <span>Practical Learning Outcomes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Built for Real-World Competence, Not Hype
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            The handbook does not promise overnight fortunes or artificial certifications. It provides durable principles and tested recipes that make your everyday AI workflows faster, cleaner, and more reliable.
          </p>
        </div>

        {/* Benefit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 rounded-2xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-cyan-500/5"
              >
                <div>
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-fit mb-5 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2.5">
                    {b.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {b.description}
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
