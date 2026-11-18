import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  FileCode2,
  BookA,
  CalendarCheck2,
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BookOpen,
  Play,
  CloudCheck,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  PROMPT_CHEAT_SHEET,
  PROMPT_TEMPLATES,
  GLOSSARY_TERMS,
  FOUR_WEEK_PLAN,
  GlossaryTermItem,
} from '../data/toolkitData.ts';
import {
  ToolkitProgressState,
  getWeekProgressStats,
  getOverallToolkitStats,
  getResumeRecommendation,
} from '../utils/toolkitProgress.ts';

export type ToolkitSubTab = 'plan' | 'cheatsheet' | 'templates' | 'glossary';

interface ToolkitSectionProps {
  customerEmail: string;
  progress: ToolkitProgressState;
  syncStatus: 'idle' | 'loading' | 'saving' | 'synced' | 'error';
  onRetrySync: () => void;
  onToggleTask: (taskId: string) => void;
  onToggleWeekComplete: (weekNumber: 1 | 2 | 3 | 4) => void;
  onOpenPdfPage: (pageNumber: number) => void;
}

function renderTemplateWithHighlights(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span
          key={index}
          className="px-1 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold"
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export const ToolkitSection: React.FC<ToolkitSectionProps> = ({
  customerEmail,
  progress,
  syncStatus,
  onRetrySync,
  onToggleTask,
  onToggleWeekComplete,
  onOpenPdfPage,
}) => {
  const [activeTab, setActiveTab] = useState<ToolkitSubTab>('plan');
  const [templateQuery, setTemplateQuery] = useState('');
  const [templateCategory, setTemplateCategory] = useState<string>('All');
  const [glossaryQuery, setGlossaryQuery] = useState('');
  const [glossaryCategory, setGlossaryCategory] = useState<'All' | GlossaryTermItem['category']>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  const overallStats = useMemo(() => getOverallToolkitStats(progress), [progress]);
  const resumeInfo = useMemo(() => getResumeRecommendation(progress), [progress]);

  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>(() => ({
    1: resumeInfo.nextWeekNumber === 1,
    2: resumeInfo.nextWeekNumber === 2,
    3: resumeInfo.nextWeekNumber === 3,
    4: resumeInfo.nextWeekNumber === 4,
  }));

  const templateCategories = useMemo(
    () => ['All', ...Array.from(new Set(PROMPT_TEMPLATES.map((t) => t.category)))],
    []
  );

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    return PROMPT_TEMPLATES.filter((t) => {
      const matchesCat = templateCategory === 'All' || t.category === templateCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.template.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [templateQuery, templateCategory]);

  const filteredGlossary = useMemo(() => {
    const q = glossaryQuery.trim().toLowerCase();
    return GLOSSARY_TERMS.filter((g) => {
      const matchesCat = glossaryCategory === 'All' || g.category === glossaryCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        g.term.toLowerCase().includes(q) ||
        g.definition.toLowerCase().includes(q)
      );
    });
  }, [glossaryQuery, glossaryCategory]);

  const handleCopyText = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const toggleWeekExpanded = (weekNumber: number) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNumber]: !prev[weekNumber],
    }));
  };

  const handleResumeClick = () => {
    setActiveTab('plan');
    const targetWeek = resumeInfo.nextWeekNumber;
    setExpandedWeeks((prev) => ({
      ...prev,
      [targetWeek]: true,
    }));
    if (resumeInfo.nextTask) {
      setHighlightedTaskId(resumeInfo.nextTask.id);
      setTimeout(() => {
        const el = document.getElementById(`toolkit-task-${resumeInfo.nextTask?.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
      setTimeout(() => {
        setHighlightedTaskId((prev) => (prev === resumeInfo.nextTask?.id ? null : prev));
      }, 2600);
    } else {
      const weekEl = document.getElementById(`toolkit-week-${targetWeek}`);
      weekEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const cheatSheetCopyText = useMemo(() => {
    const rows = PROMPT_CHEAT_SHEET.checklist.map((c) => `- ${c.key}: ${c.question}`).join('\n');
    const rules = PROMPT_CHEAT_SHEET.fiveRules.map((r, idx) => `${idx + 1}. ${r}`).join('\n');
    return `DIGITAL GOVIND — ONE-PAGE PROMPT CHEAT SHEET\n\nCHECKLIST:\n${rows}\n\nFIVE RULES TO REMEMBER:\n${rules}`;
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-8 py-6 sm:py-10 space-y-6">
      {/* Header & Account Sync Summary Card */}
      <div className="rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1.5">
              Official Handbook Companion · Appendices A–D
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Complete Starter Toolkit
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
              Your interactive 4-week study tracker, 1-page cheat sheet, 10 ready-to-use prompt templates, and 30-term glossary from the handbook.
            </p>
          </div>

          {/* Account Sync Pill */}
          <div className="shrink-0 self-start">
            {syncStatus === 'loading' || syncStatus === 'saving' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 text-[11px] font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>{syncStatus === 'loading' ? 'Restoring account...' : 'Saving to account...'}</span>
              </div>
            ) : syncStatus === 'error' ? (
              <button
                onClick={onRetrySync}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/50 border border-amber-700/60 text-amber-300 hover:bg-amber-900/50 text-[11px] font-mono cursor-pointer transition-colors"
                title="Progress cached locally — click to retry syncing to your account"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Sync pending · Retry</span>
                <RotateCcw className="w-3 h-3" />
              </button>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-[11px] font-mono"
                title={`Progress synced to verified account ${customerEmail}`}
              >
                <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate max-w-[200px]">Synced · {customerEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Overall 4-Week Progress + Resume Bar */}
        <div className="mt-5 pt-5 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Overall 4-Week Progress
              </span>
              <span className="font-mono text-cyan-300">
                {overallStats.completedTasks}/{overallStats.totalTasks} tasks ({overallStats.percentage}%) · {overallStats.completedWeeksCount}/4 weeks
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                style={{ width: `${overallStats.percentage}%` }}
              />
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 p-3">
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {resumeInfo.lastCompletedActivity ? 'Last Completed Activity' : 'Next Recommended Step'}
              </div>
              <div className="text-xs font-medium text-slate-200 truncate">
                {resumeInfo.lastCompletedActivity
                  ? `W${resumeInfo.lastCompletedActivity.weekNumber}: ${resumeInfo.lastCompletedActivity.taskTitle}`
                  : resumeInfo.statusLabel}
              </div>
            </div>
            <button
              onClick={handleResumeClick}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {resumeInfo.isAllComplete
                  ? 'Review Plan'
                  : resumeInfo.hasStarted
                  ? `Resume Week ${resumeInfo.nextWeekNumber}`
                  : 'Start Week 1'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Resource Sub-Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Starter Toolkit Resources"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'plan'}
          onClick={() => setActiveTab('plan')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'plan'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4 shrink-0" />
          <span className="truncate">4-Week Plan</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'cheatsheet'}
          onClick={() => setActiveTab('cheatsheet')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'cheatsheet'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
        >
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span className="truncate">Cheat Sheet</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'templates'}
          onClick={() => setActiveTab('templates')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
        >
          <FileCode2 className="w-4 h-4 shrink-0" />
          <span className="truncate">10 Templates</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'glossary'}
          onClick={() => setActiveTab('glossary')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'glossary'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
        >
          <BookA className="w-4 h-4 shrink-0" />
          <span className="truncate">Glossary (30)</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: INTERACTIVE 4-WEEK LEARNING PLAN TRACKER                       */}
      {/* ===================================================================== */}
      {activeTab === 'plan' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Your Four-Week Learning Plan
              </h2>
              <p className="text-xs text-slate-400">
                Appendix D (Page 79) · Twenty to thirty minutes a day is enough — practise on real tasks from your own life or work.
              </p>
            </div>
            <button
              onClick={() => onOpenPdfPage(79)}
              className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs text-cyan-300 transition-colors cursor-pointer shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open Page 79 in Reader</span>
            </button>
          </div>

          {FOUR_WEEK_PLAN.map((week) => {
            const stats = getWeekProgressStats(progress, week.weekNumber);
            const isExpanded = !!expandedWeeks[week.weekNumber];

            return (
              <section
                key={week.weekNumber}
                id={`toolkit-week-${week.weekNumber}`}
                className={`rounded-2xl sm:rounded-3xl border transition-colors ${
                  stats.isCompleted
                    ? 'bg-emerald-950/15 border-emerald-500/35'
                    : 'bg-slate-900/85 border-slate-800'
                }`}
              >
                {/* Week Header */}
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleWeekExpanded(week.weekNumber)}
                      aria-expanded={isExpanded}
                      className="flex items-start gap-3 text-left cursor-pointer group flex-1 min-w-0"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 border ${
                          stats.isCompleted
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                        }`}
                      >
                        W{week.weekNumber}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                          <span className="text-cyan-400 uppercase tracking-wider">
                            Week {week.weekNumber} of 4
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400">{week.dailyCommitment}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-amber-300">{week.handbookReading}</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 group-hover:text-cyan-300 transition-colors">
                          {week.title}
                        </h3>
                      </div>

                      <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-white shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </button>

                    {/* Weekly Progress & Mark Week Completed Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-white">
                          {stats.percentage}%
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {stats.completedCount}/{stats.totalCount} tasks
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleWeekComplete(week.weekNumber)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                          stats.isCompleted
                            ? 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300'
                        }`}
                      >
                        {stats.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500" />
                        )}
                        <span>{stats.isCompleted ? 'Week Completed' : 'Mark Week Complete'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Week Progress Bar */}
                  <div className="mt-3.5 h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        stats.isCompleted
                          ? 'bg-emerald-400'
                          : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                      }`}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Objectives, Reading & Task Checklist */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-2 border-t border-slate-800/70 space-y-5">
                    {/* Learning Objectives */}
                    <div className="rounded-2xl bg-slate-950/70 border border-slate-800/80 p-4">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 mb-2">
                        Learning Objectives
                      </div>
                      <ul className="space-y-1.5">
                        {week.objectives.map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                            <span className="text-cyan-400 font-mono mt-0.5">•</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Quick Reading Links into Handbook PDF */}
                      <div className="mt-3 pt-3 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">Assigned Reading:</span>
                        {week.recommendedPages.map((rp) => (
                          <button
                            key={rp.page}
                            type="button"
                            onClick={() => onOpenPdfPage(rp.page)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-[11px] font-medium text-cyan-300 transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>{rp.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Assigned Activities Checklist */}
                    <div className="space-y-2.5">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Assigned Activities Checklist
                      </div>
                      {week.tasks.map((task) => {
                        const checked = progress.completedTaskIds.includes(task.id);
                        const isNextUp = !checked && resumeInfo.nextTask?.id === task.id;
                        const isHighlighted = highlightedTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            id={`toolkit-task-${task.id}`}
                            className={`rounded-2xl border p-3.5 sm:p-4 transition-all flex items-start gap-3 ${
                              isHighlighted
                                ? 'bg-cyan-950/50 border-cyan-400 ring-2 ring-cyan-400/40'
                                : checked
                                ? 'bg-emerald-950/20 border-emerald-500/35'
                                : isNextUp
                                ? 'bg-slate-950/90 border-cyan-500/40'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={checked}
                              aria-label={`Mark "${task.title}" as ${checked ? 'incomplete' : 'completed'}`}
                              onClick={() => onToggleTask(task.id)}
                              className="mt-0.5 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-full"
                            >
                              {checked ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-500 hover:text-cyan-400 transition-colors" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onToggleTask(task.id)}
                                  className={`text-left text-xs sm:text-sm font-semibold cursor-pointer ${
                                    checked ? 'text-emerald-200 line-through decoration-emerald-500/50' : 'text-white'
                                  }`}
                                >
                                  {task.title}
                                </button>
                                {isNextUp && (
                                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/35 text-[10px] font-mono font-bold text-cyan-300 uppercase">
                                    Next Up
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                {task.description}
                              </p>
                            </div>

                            {task.relatedPage && (
                              <button
                                type="button"
                                onClick={() => onOpenPdfPage(task.relatedPage!)}
                                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-mono text-cyan-300 transition-colors cursor-pointer"
                                title={`Open Page ${task.relatedPage} in eBook Reader`}
                              >
                                <span>p. {task.relatedPage}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Weekly Goal Deliverable */}
                    <div className="rounded-xl bg-blue-950/25 border border-blue-800/40 px-4 py-2.5 text-xs text-blue-200 flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300 uppercase text-[10px] shrink-0">
                        Week {week.weekNumber} Goal:
                      </span>
                      <span>{week.deliverable}</span>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: 1-PAGE PROMPT CHEAT SHEET (APPENDIX A)                         */}
      {/* ===================================================================== */}
      {activeTab === 'cheatsheet' && (
        <div
          data-allow-copy="true"
          className="rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-8 shadow-2xl space-y-6 select-text"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
            <div>
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1">
                {PROMPT_CHEAT_SHEET.subtitle}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {PROMPT_CHEAT_SHEET.title}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl">
                {PROMPT_CHEAT_SHEET.intro}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyText('cheat-sheet', cheatSheetCopyText)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
              >
                {copiedId === 'cheat-sheet' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Cheat Sheet</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onOpenPdfPage(73)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Page 73</span>
              </button>
            </div>
          </div>

          {/* 10-Point Pre-Send Checklist */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-3">
              10-Point Pre-Send Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PROMPT_CHEAT_SHEET.checklist.map((item, idx) => (
                <div
                  key={item.key}
                  className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-white">{item.key}</div>
                    <div className="text-xs sm:text-sm text-slate-300 mt-0.5">{item.question}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Five Rules to Remember */}
          <div className="rounded-2xl bg-cyan-950/25 border border-cyan-500/30 p-5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 mb-3">
              Five Rules to Remember
            </h3>
            <ol className="space-y-2">
              {PROMPT_CHEAT_SHEET.fiveRules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                  <span className="font-mono font-bold text-cyan-400 shrink-0">{idx + 1}.</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: 10 READY-TO-USE PROMPT TEMPLATES (APPENDIX B)                  */}
      {/* ===================================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">
                  Appendix B · Pages 74–76
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  10 Ready-to-Use Prompt Templates
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Copy any template, replace the <span className="text-cyan-300 font-mono">[bracketed parts]</span>, and run it. Save the versions that work for you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenPdfPage(74)}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-xs text-cyan-300 cursor-pointer shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Page 74 in Reader</span>
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  placeholder="Search templates (e.g., JSON, beginner, summarize, debug)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 select-text"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {templateCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTemplateCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      templateCategory === cat
                        ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-8 text-center text-xs sm:text-sm text-slate-400">
              No templates match your filter. Try clearing the search box.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTemplates.map((item) => (
                <div
                  key={item.id}
                  data-allow-copy="true"
                  className="rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-3 select-text"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold shrink-0">
                        {item.code}
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {item.title}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.category} · Page {item.pageNumber}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyText(item.id, item.template)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Template</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenPdfPage(item.pageNumber)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer"
                        title={`View ${item.code} on Page ${item.pageNumber}`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        <span>p. {item.pageNumber}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300">{item.summary}</p>

                  <pre className="rounded-2xl bg-slate-950 border border-slate-800/90 p-4 text-xs sm:text-sm font-mono text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {renderTemplateWithHighlights(item.template)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PROMPT ENGINEERING GLOSSARY (APPENDIX C)                       */}
      {/* ===================================================================== */}
      {activeTab === 'glossary' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">
                  Appendix C · Pages 77–78
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  Prompt Engineering Glossary
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Plain-English definitions for all {GLOSSARY_TERMS.length} essential terms covered in the handbook.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenPdfPage(77)}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-xs text-cyan-300 cursor-pointer shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Page 77 in Reader</span>
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={glossaryQuery}
                  onChange={(e) => setGlossaryQuery(e.target.value)}
                  placeholder="Search glossary terms or definitions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 select-text"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Core', 'Techniques', 'Engineering', 'Safety'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGlossaryCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      glossaryCategory === cat
                        ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredGlossary.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-8 text-center text-xs sm:text-sm text-slate-400">
              No glossary terms match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredGlossary.map((entry) => (
                <div
                  key={entry.term}
                  className="rounded-2xl bg-slate-900/85 border border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="text-sm sm:text-base font-bold text-white">{entry.term}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-cyan-300 shrink-0">
                        {entry.category}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {entry.definition}
                    </p>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenPdfPage(entry.pageNumber)}
                      className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      Handbook p. {entry.pageNumber} →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
