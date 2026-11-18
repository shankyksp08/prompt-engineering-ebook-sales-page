import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
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
  ZoomIn,
  ZoomOut,
  FileText,
  Layers,
  Loader2,
} from 'lucide-react';
import { BOOK_PARTS, CURATED_TOPICS, BOOK_SAMPLE_PAGES } from '../data/bookData.ts';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';
import {
  CustomerLicense,
  getActiveLicense,
  clearActiveLicense,
  isServerSignedLicense,
  getReadingProgress,
  toggleTopicCompletion,
  toggleTopicBookmark,
  saveReadingProgress,
  generateWatermarkText,
  revokeDeviceSession,
} from '../utils/security.ts';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface ReaderPageProps {
  onNavigateHome: () => void;
  onNavigateLogin?: () => void;
}

export const ReaderPage: React.FC<ReaderPageProps> = ({ onNavigateHome, onNavigateLogin }) => {
  const [license, setLicense] = useState<CustomerLicense | null>(() => {
    const active = getActiveLicense();
    return isServerSignedLicense(active) ? active : null;
  });
  const [isVerifyingLicense, setIsVerifyingLicense] = useState<boolean>(() => {
    const active = getActiveLicense();
    return isServerSignedLicense(active);
  });
  const [serverVerified, setServerVerified] = useState<boolean>(false);
  const [progress, setProgress] = useState(() => getReadingProgress());
  const [currentTopicId, setCurrentTopicId] = useState<number>(() => progress.lastReadTopicId || 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [theme, setTheme] = useState<'slate' | 'oled' | 'sepia'>('slate');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  const [viewMode, setViewMode] = useState<'pdf' | 'notes'>('pdf');
  const [currentPage, setCurrentPage] = useState<number>(() => progress.lastReadPage || 1);
  const [totalPages, setTotalPages] = useState<number>(81);
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  // Canvas-based secure PDF document state (no <iframe src>, no internal PDF sidebar, no download controls)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfRendering, setPdfRendering] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(820);

  const readerRootRef = useRef<HTMLDivElement | null>(null);
  const watermarkOverlayRef = useRef<HTMLDivElement | null>(null);
  const pdfViewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nativeFullscreenRef = useRef<boolean>(false);

  // Verify active license cryptographically with the server before unlocking reader UI
  useEffect(() => {
    const active = getActiveLicense();
    if (!isServerSignedLicense(active)) {
      if (active) {
        clearActiveLicense();
      }
      setLicense(null);
      setServerVerified(false);
      setIsVerifyingLicense(false);
      return;
    }

    setLicense(active);
    let cancelled = false;
    setIsVerifyingLicense(true);

    fetch('/api/stream-pdf', {
      method: 'HEAD',
      headers: {
        Authorization: `Bearer ${active.token}`,
        'X-Order-Id': active.orderId,
        'X-Reader-Session': 'dg-online-reader-v1',
      },
      cache: 'no-store',
    })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setServerVerified(true);
        } else {
          clearActiveLicense();
          setLicense(null);
          setServerVerified(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setServerVerified(false);
      })
      .finally(() => {
        if (!cancelled) {
          setIsVerifyingLicense(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Watermark text generator (includes Digital Govind branding + verified customer email)
  const watermark = useMemo(() => {
    if (!license) return null;
    return generateWatermarkText(license);
  }, [license]);

  // Fetch authenticated PDF stream into memory (never exposed via URL, iframe, or download link)
  useEffect(() => {
    if (!license || !serverVerified) {
      setPdfDoc(null);
      return;
    }

    let cancelled = false;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;
    let loadedDoc: pdfjsLib.PDFDocumentProxy | null = null;

    setPdfLoading(true);
    setPdfError(null);

    fetch('/api/reader/stream-pdf', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${license.token}`,
        'X-Order-Id': license.orderId,
        'X-Reader-Session': 'dg-online-reader-v1',
      },
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || `Reader authentication error (HTTP ${res.status}).`);
        }
        return res.arrayBuffer();
      })
      .then(async (buffer) => {
        if (cancelled) return;
        loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          disableAutoFetch: true,
          disableStream: true,
        });
        loadedDoc = await loadingTask.promise;
        if (cancelled) {
          await loadingTask.destroy();
          return;
        }
        setTotalPages(loadedDoc.numPages || 81);
        setPdfDoc(loadedDoc);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setPdfError(err?.message || 'Unable to load protected handbook pages. Please sign in again.');
      })
      .finally(() => {
        if (!cancelled) {
          setPdfLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (loadingTask) {
        loadingTask.destroy().catch(() => {});
      }
    };
  }, [license, serverVerified]);

  // Track PDF viewport container width for crisp responsive canvas sizing across phones, tablets & desktops
  useEffect(() => {
    const el = pdfViewportRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const updateWidth = () => {
      const nextWidth = el.clientWidth;
      if (nextWidth > 200) {
        setContainerWidth(nextWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewMode, fullScreen, sidebarOpen, serverVerified]);

  // Render active PDF page onto protected HTML5 <canvas> and composite pixel-level Digital Govind watermark
  useEffect(() => {
    if (viewMode !== 'pdf' || !pdfDoc || !canvasRef.current || !watermark) return;

    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;
    const safePage = Math.min(Math.max(1, currentPage), pdfDoc.numPages || 81);

    setPdfRendering(true);

    pdfDoc
      .getPage(safePage)
      .then(async (page) => {
        if (cancelled || !canvasRef.current) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const horizontalPadding = containerWidth < 520 ? 16 : 48;
        const availableWidth = Math.max(containerWidth - horizontalPadding, 280);
        const fitScale = Math.min(Math.max(availableWidth / baseViewport.width, 0.45), 1.55);
        const effectiveScale = fitScale * (zoomPercent / 100);
        const viewport = page.getViewport({ scale: effectiveScale });
        const dpr = Math.min(window.devicePixelRatio || 1, 2.25);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
        canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        renderTask = page.render({
          canvas,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });

        await renderTask.promise;
        if (cancelled) return;

        // Composite repeating Digital Govind + Verified Customer Email watermark directly onto rendered canvas pixels
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const stepX = 280;
        const stepY = 170;
        ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = -60; y < viewport.height + 120; y += stepY) {
          for (let x = -60; x < viewport.width + 120; x += stepX) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((-24 * Math.PI) / 180);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.085)';
            ctx.fillText(watermark.canvasLabel, 0, -7);
            ctx.fillStyle = 'rgba(2, 132, 199, 0.09)';
            ctx.fillText(`DIGITAL GOVIND · ${license?.orderId || ''}`, 0, 8);
            ctx.restore();
          }
        }
        ctx.restore();
      })
      .catch((err: any) => {
        if (cancelled || err?.name === 'RenderingCancelledException') return;
        console.warn('[Reader] PDF page render error:', err?.message);
      })
      .finally(() => {
        if (!cancelled) {
          setPdfRendering(false);
        }
      });

    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // Ignore cancel errors
        }
      }
    };
  }, [viewMode, pdfDoc, currentPage, zoomPercent, containerWidth, watermark, license?.orderId]);

  // Update last read topic in progress
  useEffect(() => {
    const updated = saveReadingProgress({ lastReadTopicId: currentTopicId, lastReadPage: currentPage });
    setProgress(updated);
  }, [currentTopicId, currentPage]);

  // Sync fullscreen exit and quietly block print/save shortcuts without interrupting reading
  useEffect(() => {
    if (!serverVerified) return;

    const handleFullscreenChange = () => {
      const fsEl =
        document.fullscreenElement || (document as any).webkitFullscreenElement || null;
      if (!fsEl && nativeFullscreenRef.current) {
        nativeFullscreenRef.current = false;
        setFullScreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === 'p' || key === 's')) {
        e.preventDefault();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [serverVerified]);

  const handleToggleFullscreen = async () => {
    const nextState = !fullScreen;
    setFullScreen(nextState);

    const targetEl = pdfViewportRef.current as any;
    try {
      if (nextState && targetEl) {
        if (targetEl.requestFullscreen) {
          nativeFullscreenRef.current = true;
          await targetEl.requestFullscreen();
        } else if (targetEl.webkitRequestFullscreen) {
          nativeFullscreenRef.current = true;
          await targetEl.webkitRequestFullscreen();
        }
      } else if (!nextState) {
        nativeFullscreenRef.current = false;
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch {
      // Fallback to CSS fixed fullscreen gracefully (e.g. iPhone Safari)
      nativeFullscreenRef.current = false;
    }
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
  const sampleExcerpt = BOOK_SAMPLE_PAGES.find(
    (s) => s.title.toLowerCase() === currentTopic.title.toLowerCase()
  );

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

  // Show verification spinner while checking server license signature
  if (isVerifyingLicense) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Verifying License Access...</h2>
          <p className="text-xs text-slate-400">
            Validating your cryptographic Digital Govind eBook license with the server.
          </p>
        </div>
      </div>
    );
  }

  // If unauthenticated, unverified, or license revoked
  if (!license || !serverVerified) {
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
    <div
      id="protected-reader-root"
      ref={readerRootRef}
      onContextMenu={(e) => {
        const target = e.target as HTMLElement | null;
        if (target?.tagName === 'INPUT') return;
        e.preventDefault();
      }}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('[data-allow-copy="true"]')) return;
        e.preventDefault();
      }}
      onCut={(e) => e.preventDefault()}
      className={`min-h-screen ${themeClasses} flex flex-col font-sans select-none protected-reader-surface relative overflow-x-hidden`}
    >
      {/* Dynamic Anti-Leak Customer Watermark Overlay (Repeated Grid across all reader pages) */}
      {watermark && (
        <div
          ref={watermarkOverlayRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none opacity-[0.075] flex flex-wrap gap-20 sm:gap-24 p-6 sm:p-8 items-center justify-around transform -rotate-12"
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="text-[11px] font-mono leading-tight tracking-wider text-slate-300 text-center"
            >
              <div>{watermark.primary}</div>
              <div>{watermark.secondary}</div>
            </div>
          ))}
        </div>
      )}

      {/* Top Navigation & Reader Controls */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 py-3 px-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Left: Home & Topic Navigator Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={onNavigateHome}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Return to Sales Page"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden lg:inline">Table of Contents</span>
              <span className="font-mono text-amber-400 text-[11px] bg-slate-900 px-1.5 py-0.5 rounded">
                <span className="hidden sm:inline">Topic </span>{currentTopicId}/100
              </span>
            </button>
          </div>

          {/* Center: Mode Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('pdf')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'pdf'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">eBook Reader ({totalPages} Pages)</span>
                <span className="lg:hidden">Reader</span>
              </button>
              <button
                onClick={() => setViewMode('notes')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'notes'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">Topic Notes (100)</span>
                <span className="lg:hidden">Notes</span>
              </button>
            </div>
          </div>

          {/* Right: Display Settings & Customer Session */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono transition-colors"
              title={`Switch Theme (Current: ${theme.toUpperCase()})`}
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Customer Session & DRM Details Trigger */}
            <button
              onClick={() => setSessionModalOpen(true)}
              className="flex items-center gap-1.5 py-1.5 px-2 sm:px-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/40 text-xs transition-colors cursor-pointer"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 select-text"
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
                    if ((topic as { page?: number }).page) {
                      setCurrentPage((topic as { page?: number }).page || 1);
                    }
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
            <span>Digital Govind · Online Only</span>
            <span className="font-mono text-cyan-400">{totalPages} Pages</span>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          />
        )}

        {/* Active Reader Content Pane */}
        <main className="flex-1 px-2.5 py-3 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          {viewMode === 'pdf' ? (
            /* Clean Canvas-Rendered Online Handbook Reader (No internal PDF sidebar, no download/print buttons) */
            <div className="space-y-4">
              {/* Simplified Single-Row Reader Toolbar */}
              <div className="p-2.5 sm:px-4 sm:py-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between gap-1.5 sm:gap-3 text-xs">
                {/* Previous / Page Number / Next */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 transition-colors cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1 sm:gap-1.5 font-mono bg-slate-950 px-2 sm:px-3 py-1 rounded-xl border border-slate-800 text-white">
                    <span className="hidden sm:inline text-slate-400">Page</span>
                    <input
                      type="number"
                      aria-label="Current page number"
                      min={1}
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1 && val <= totalPages) {
                          setCurrentPage(val);
                        }
                      }}
                      className="w-9 sm:w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-cyan-400 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400 select-text"
                    />
                    <span className="text-slate-400">/ {totalPages}</span>
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 transition-colors cursor-pointer"
                    title="Next Page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Simple Zoom & Fullscreen Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setZoomPercent((z) => Math.max(60, z - 15))}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <span className="px-1 sm:px-2 font-mono text-[11px] text-cyan-400 font-semibold min-w-[38px] sm:min-w-[44px] text-center">
                      {zoomPercent}%
                    </span>
                    <button
                      onClick={() => setZoomPercent((z) => Math.min(200, z + 15))}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleToggleFullscreen}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
                    title={fullScreen ? 'Exit Fullscreen' : 'Fullscreen View'}
                  >
                    {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Spacious Canvas PDF Viewport Container */}
              <div
                ref={pdfViewportRef}
                className={`relative rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl transition-all ${
                  fullScreen ? 'fixed inset-2 sm:inset-4 z-50 bg-slate-950 flex flex-col' : ''
                }`}
              >
                {fullScreen && (
                  <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs shrink-0">
                    <span className="font-mono text-cyan-400">
                      Digital Govind – Online Reader (Page {currentPage} of {totalPages})
                    </span>
                    <button
                      onClick={handleToggleFullscreen}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-white cursor-pointer"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Close Fullscreen</span>
                    </button>
                  </div>
                )}

                <div
                  className={`w-full flex justify-center items-start p-2 sm:p-6 md:p-8 bg-slate-900/95 relative ${
                    fullScreen ? 'flex-1 h-full overflow-auto' : 'overflow-x-auto min-h-[520px]'
                  }`}
                  style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
                >
                  {pdfLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                      <p className="text-xs font-mono text-slate-300">
                        Loading Digital Govind handbook pages...
                      </p>
                    </div>
                  ) : pdfError ? (
                    <div className="max-w-md my-16 p-6 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-3">
                      <AlertTriangle className="w-7 h-7 text-rose-400 mx-auto" />
                      <h3 className="text-sm font-bold text-white">Reader Stream Unavailable</h3>
                      <p className="text-xs text-rose-200">{pdfError}</p>
                    </div>
                  ) : (
                    <div className="relative inline-block shadow-2xl rounded-xl overflow-hidden">
                      <canvas
                        ref={canvasRef}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        className="block rounded-xl bg-white max-w-none"
                      />
                      {pdfRendering && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/85 border border-slate-700 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Rendering...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Licensed Customer & Order Info Footer (No Download Controls) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">
                    Licensed to <strong className="text-white">{license.customerEmail}</strong> · Order #{license.orderId}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] font-mono">
                  <span className="text-cyan-400">Digital Govind Watermark</span>
                  <span>·</span>
                  <span>Progress auto-saved</span>
                </div>
              </div>
            </div>
          ) : (
            /* Interactive Curated Topic Notes View */
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
                  <div
                    data-allow-copy="true"
                    className="mt-8 p-5 rounded-2xl bg-slate-950/90 border border-amber-500/30 relative"
                  >
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
          )}
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
                <p className="text-xs text-slate-400">Digital Govind Online-Only Protection</p>
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
                  <span className="text-slate-500">Access Mode:</span>
                  <span className="text-emerald-400 font-bold uppercase">Online Reader Only</span>
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
