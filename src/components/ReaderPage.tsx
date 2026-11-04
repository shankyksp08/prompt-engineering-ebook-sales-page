import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Bookmark,
  Search,
  Shield,
  Smartphone,
  Laptop,
  LogOut,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sparkles,
  Sliders,
  X,
  AlertTriangle,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { BOOK_PARTS, CURATED_TOPICS, BOOK_SAMPLE_PAGES } from '../data/bookData.ts';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';
import {
  CustomerLicense,
  getActiveLicense,
  clearActiveLicense,
  getReadingProgress,
  toggleTopicCompletion,
  toggleTopicBookmark,
  saveReadingProgress,
  generateWatermarkText,
  revokeDeviceSession,
} from '../utils/security.ts';

interface ReaderPageProps {
  onNavigateHome: () => void;
  onNavigateLogin?: () => void;
}

export const ReaderPage: React.FC<ReaderPageProps> = ({ onNavigateHome, onNavigateLogin }) => {
  const [license, setLicense] = useState<CustomerLicense | null>(() => getActiveLicense());
  const [progress, setProgress] = useState(() => getReadingProgress());
  const [currentTopicId, setCurrentTopicId] = useState<number>(() => progress.lastReadTopicId || 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [theme, setTheme] = useState<'slate' | 'oled' | 'sepia'>('slate');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [isWindowObscured, setIsWindowObscured] = useState(false);
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useState(false);

  // Sync active license
  useEffect(() => {
    setLicense(getActiveLicense());
  }, []);

  // Update last read topic in progress
  useEffect(() => {
    const updated = saveReadingProgress({ lastReadTopicId: currentTopicId });
    setProgress(updated);
  }, [currentTopicId]);

  // Anti-Screenshot & Screen Capture Deterrence Listeners
  useEffect(() => {
    const handleBlur = () => {
      // Obscure reader canvas when window loses focus (e.g. screen snipping tools or switching apps)
      setIsWindowObscured(true);
    };

    const handleFocus = () => {
      setIsWindowObscured(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Print (Ctrl+P / Cmd+P)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        showSecurityAlert('Printing is disabled to protect copyrighted eBook content.');
      }
      // Block Save Page (Ctrl+S / Cmd+S)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        showSecurityAlert('Saving offline copies is disabled. Content is protected by DRM.');
      }
      // Warn on PrintScreen
      if (e.key === 'PrintScreen') {
        showSecurityAlert('Screen capture attempted. Dynamic customer watermark is embedded.');
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showSecurityAlert = (msg: string) => {
    setSecurityToast(msg);
    setTimeout(() => setSecurityToast(null), 4000);
  };

  // Build flattened topic index (all 100 topics)
  const allTopics = useMemo(() => {
    return BOOK_PARTS.flatMap((p) =>
      p.topics.map((t) => ({
        ...t,
        partNumber: p.partNumber,
        partTitle: p.title,
      }))
    );
  }, []);

  // Filter topics by search
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return allTopics;
    const q = searchQuery.toLowerCase();
    return allTopics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.partTitle.toLowerCase().includes(q) ||
        t.id.toString() === q
    );
  }, [allTopics, searchQuery]);

  const currentTopic = allTopics.find((t) => t.id === currentTopicId) || allTopics[0];
  const curatedDetail = CURATED_TOPICS.find((c) => c.id === currentTopicId);
  const sampleExcerpt = BOOK_SAMPLE_PAGES.find((s) => s.title.toLowerCase() === currentTopic.title.toLowerCase());

  const isCompleted = progress.completedTopicIds.includes(currentTopicId);
  const isBookmarked = progress.bookmarkedTopicIds.includes(currentTopicId);

  const handleToggleComplete = () => {
    const updated = toggleTopicCompletion(currentTopicId);
    setProgress(updated);
  };

  const handleToggleBookmark = () => {
    const updated = toggleTopicBookmark(currentTopicId);
    setProgress(updated);
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleNext = () => {
    if (currentTopicId < allTopics.length) {
      setCurrentTopicId(currentTopicId + 1);
    }
  };

  const handlePrev = () => {
    if (currentTopicId > 1) {
      setCurrentTopicId(currentTopicId - 1);
    }
  };

  // Watermark text generator
  const watermark = useMemo(() => {
    if (!license) return null;
    return generateWatermarkText(license);
  }, [license]);

  // Overall reading progress calculation
  const progressPercent = Math.round((progress.completedTopicIds.length / allTopics.length) * 100);

  // If unauthenticated or license revoked
  if (!license) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>Back to Sales Page</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Protected Reader Portal</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Authentication Required
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                The online handbook reader is protected and available only to verified customers. Please authenticate your purchase to unlock your access.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={onNavigateLogin}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-98 cursor-pointer"
              >
                Sign In with Customer Email
              </button>

              <button
                onClick={onNavigateHome}
                className="w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Return to Sales Page
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Need assistance? Email support at{' '}
              <a href={`mailto:${FUNNEL_CONFIG.supportEmail}`} className="text-cyan-400 hover:underline">
                {FUNNEL_CONFIG.supportEmail}
              </a>
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Theme styling helpers
  const themeClasses = {
    slate: 'bg-slate-950 text-slate-100',
    oled: 'bg-black text-slate-200',
    sepia: 'bg-[#181614] text-[#d6cdb5]',
  }[theme];

  const contentBg = {
    slate: 'bg-slate-900/90 border-slate-800',
    oled: 'bg-zinc-950 border-zinc-900',
    sepia: 'bg-[#221f1c] border-[#38332c]',
  }[theme];

  return (
    <div className={`min-h-screen ${themeClasses} flex flex-col font-sans select-none relative overflow-x-hidden`}>
      
      {/* Dynamic Anti-Leak Customer Watermark Overlay (Repeated Grid) */}
      {watermark && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none opacity-[0.06] flex flex-wrap gap-24 p-8 items-center justify-around transform -rotate-12"
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="text-[11px] font-mono leading-tight tracking-wider text-slate-400 text-center">
              <div>{watermark.primary}</div>
              <div>{watermark.secondary}</div>
            </div>
          ))}
        </div>
      )}

      {/* Security Toast Notification */}
      {securityToast && (
        <div className="fixed top-16 right-4 z-50 p-4 rounded-xl bg-amber-950/90 border border-amber-500 text-amber-200 text-xs flex items-center gap-3 shadow-2xl animate-fade-in max-w-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{securityToast}</span>
        </div>
      )}

      {/* Screen Capture / Inactive Window Obscurity Overlay */}
      {isWindowObscured && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Content Hidden While Window Is Inactive</h3>
          <p className="text-xs text-slate-400 max-w-md">
            The handbook text is protected against unauthorized background recording. Click back into the window to resume reading.
          </p>
        </div>
      )}

      {/* Top Navigation & Reader Controls */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Home & Topic Navigator Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Return to Sales Page"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Table of Contents</span>
              <span className="font-mono text-amber-400 text-[11px] bg-slate-900 px-1.5 py-0.5 rounded">
                Topic {currentTopicId}/100
              </span>
            </button>
          </div>

          {/* Center: Reading Progress Pill */}
          <div className="hidden md:flex items-center gap-3 bg-slate-950 px-3.5 py-1.5 rounded-full border border-slate-800 text-xs">
            <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-300">
              {progress.completedTopicIds.length}/100 Completed ({progressPercent}%)
            </span>
          </div>

          {/* Right: Display Settings & Customer Session */}
          <div className="flex items-center gap-2">
            
            {/* Font Size Selector */}
            <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setFontSize('sm')}
                className={`px-2 py-0.5 rounded ${fontSize === 'sm' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-2 py-0.5 rounded ${fontSize === 'base' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-2 py-0.5 rounded ${fontSize === 'lg' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
              >
                A+
              </button>
            </div>

            {/* Reading Theme Toggle */}
            <button
              onClick={() => {
                if (theme === 'slate') setTheme('oled');
                else if (theme === 'oled') setTheme('sepia');
                else setTheme('slate');
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono transition-colors"
              title={`Switch Theme (Current: ${theme.toUpperCase()})`}
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Customer Session & DRM Details Trigger */}
            <button
              onClick={() => setSessionModalOpen(true)}
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/40 text-xs transition-colors cursor-pointer"
              title="Customer Account & DRM Status"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline text-[11px] font-mono truncate max-w-[120px]">
                {license.customerEmail}
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Reader Viewport */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full relative">
        
        {/* Collapsible Table of Contents Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-80 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Sidebar Search Bar */}
          <div className="p-3.5 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 100 topics..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Topics List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTopics.map((topic) => {
              const active = topic.id === currentTopicId;
              const completed = progress.completedTopicIds.includes(topic.id);
              const bookmarked = progress.bookmarkedTopicIds.includes(topic.id);

              return (
                <button
                  key={topic.id}
                  onClick={() => {
                    setCurrentTopicId(topic.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className="font-mono text-[10px] text-amber-400 shrink-0 w-6">
                      #{topic.id}
                    </span>
                    <span className="truncate">{topic.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {bookmarked && <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    {completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>First Edition (October 2026)</span>
            <span className="font-mono text-cyan-400">81 Pages</span>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          />
        )}

        {/* Active Topic Content Pane */}
        <main className="flex-1 p-4 sm:p-8 lg:p-12 max-w-4xl mx-auto w-full">
          
          <div className={`rounded-3xl border ${contentBg} p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all`}>
            
            {/* Header: Part info & Topic page */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-6 text-xs font-mono">
              <span className="text-amber-400 uppercase tracking-wider font-semibold">
                PART {currentTopic.partNumber}: {currentTopic.partTitle}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleBookmark}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isBookmarked
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  title={isBookmarked ? 'Bookmarked' : 'Add Bookmark'}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                </button>

                <button
                  onClick={handleToggleComplete}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
                </button>
              </div>
            </div>

            {/* Topic Title */}
            <div className="mb-6">
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-1">
                TOPIC {currentTopic.id} OF 100
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {currentTopic.title}
              </h1>
            </div>

            {/* Topic Content Body */}
            <div
              className={`space-y-4 leading-relaxed font-sans text-slate-300 ${
                fontSize === 'sm' ? 'text-xs leading-6' : fontSize === 'lg' ? 'text-base leading-8' : 'text-sm leading-7'
              }`}
            >
              {curatedDetail?.summary ? (
                <p>{curatedDetail.summary}</p>
              ) : sampleExcerpt?.excerpt ? (
                <p className="whitespace-pre-line">{sampleExcerpt.excerpt}</p>
              ) : (
                <p>
                  In this topic from Part {currentTopic.partNumber}, the Prompt Engineering Handbook explores{' '}
                  <strong className="text-white">{currentTopic.title}</strong>. This section covers core mental models, common failure modes when communicating with frontier language models, and practical boundary constraints designed to produce dependable results.
                </p>
              )}

              {/* Try This Prompt Interactive Snippet Block */}
              {(curatedDetail?.tryPrompt || sampleExcerpt?.tryPromptSnippet) && (
                <div className="mt-8 p-5 rounded-2xl bg-slate-950/90 border border-amber-500/30 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      TRY THIS PROMPT
                    </span>
                    <button
                      onClick={() =>
                        handleCopyPrompt(
                          curatedDetail?.tryPrompt?.text || sampleExcerpt?.tryPromptSnippet || ''
                        )
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    {curatedDetail?.tryPrompt?.text || sampleExcerpt?.tryPromptSnippet}
                  </pre>
                </div>
              )}

              {/* Pro Tip Callout */}
              {curatedDetail?.proTip && (
                <div className="mt-5 p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-semibold">Pro Tip: </strong>
                    {curatedDetail.proTip}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Navigation Bar within Reader Content */}
            <div className="mt-10 pt-6 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={handlePrev}
                disabled={currentTopicId <= 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Topic</span>
              </button>

              <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">
                Topic {currentTopicId} of 100
              </span>

              <button
                onClick={handleNext}
                disabled={currentTopicId >= allTopics.length}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold transition-colors cursor-pointer"
              >
                <span>Next Topic</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </main>
      </div>

      {/* Customer Session & DRM Management Modal */}
      {sessionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl text-white">
            <button
              onClick={() => setSessionModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  License &amp; Device Management
                </h3>
                <p className="text-xs text-slate-400">Security &amp; Concurrent Sessions</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* License Details */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Email:</span>
                  <span className="text-white font-semibold">{license.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="text-cyan-300">{license.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">Verified &amp; Active</span>
                </div>
              </div>

              {/* Active Devices */}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>Registered Devices ({license.activeDevices.length}/{license.maxDevices})</span>
                  <span className="text-slate-500">Max 2 Concurrent</span>
                </div>

                <div className="space-y-2">
                  {license.activeDevices.map((dev) => (
                    <div
                      key={dev.deviceId}
                      className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {dev.os === 'Windows' || dev.os === 'macOS' || dev.os === 'Linux' ? (
                          <Laptop className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Smartphone className="w-4 h-4 text-cyan-400" />
                        )}
                        <div>
                          <div className="font-semibold text-white">
                            {dev.browser} on {dev.os} {dev.isCurrent && '(This Device)'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ID: {dev.deviceId.slice(0, 16)}...
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const updated = revokeDeviceSession(dev.deviceId);
                          if (!updated) {
                            setSessionModalOpen(false);
                            setLicense(null);
                          } else {
                            setLicense(updated);
                          }
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-medium p-1 cursor-pointer"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign out */}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => {
                    clearActiveLicense();
                    setLicense(null);
                    setSessionModalOpen(false);
                  }}
                  className="flex items-center gap-2 text-rose-400 hover:text-rose-300 text-xs font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Reader</span>
                </button>

                <button
                  onClick={() => setSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
