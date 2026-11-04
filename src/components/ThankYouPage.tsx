import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  FileText,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { FUNNEL_CONFIG, isDownloadConfigured } from '../config/funnelConfig.ts';
import { READING_PATHS } from '../utils/funnel.ts';
import { BookMockup } from './BookMockup.tsx';
import {
  parseRazorpayPaymentParams,
  createCustomerLicense,
  getActiveLicense,
  CustomerLicense,
} from '../utils/security.ts';

interface ThankYouPageProps {
  onNavigateHome: () => void;
  onNavigateReader?: () => void;
  onNavigateLogin?: () => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({
  onNavigateHome,
  onNavigateReader,
  onNavigateLogin,
}) => {
  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [activePathTab, setActivePathTab] = useState<'30-minute' | 'practical' | 'builder'>('30-minute');
  const [verifiedLicense, setVerifiedLicense] = useState<CustomerLicense | null>(() => getActiveLicense());
  const [detectedPaymentId, setDetectedPaymentId] = useState<string | null>(null);

  // Check for Razorpay payment callback in query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parsed = parseRazorpayPaymentParams(window.location.search);
      if (parsed.isPaid && parsed.paymentId) {
        setDetectedPaymentId(parsed.paymentId);
        const lic = createCustomerLicense('verified.customer@razorpay.com', parsed.paymentId, 'Handbook Customer');
        setVerifiedLicense(lic);
      }
    }
  }, []);

  const hasConfiguredDownload = isDownloadConfigured(FUNNEL_CONFIG.ebookDownloadUrl);

  const handleDownloadClick = () => {
    setDownloadTriggered(true);
  };

  const selectedPath = READING_PATHS.find((p) => p.id === activePathTab) || READING_PATHS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg p-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Back to Sales Page</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
              {verifiedLicense ? 'Verified Order Fulfillment' : 'Order Fulfillment Portal'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Thank You / Delivery Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        
        {/* Success Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-5 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Thank You for Choosing the
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              Prompt Engineering Handbook
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Your digital copy and online reader access are ready. Start reading immediately in our protected online reader with bookmarking, or download the 81-page vector PDF.
          </p>

          {/* Payment verified pill */}
          {detectedPaymentId && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Razorpay Payment Verified: {detectedPaymentId}</span>
            </div>
          )}
        </div>

        {/* Central Delivery Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl mb-12 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left: Book Cover preview */}
            <div className="md:col-span-5 flex justify-center">
              <BookMockup size="sm" interactive={false} />
            </div>

            {/* Right: Primary Reading & Download Actions */}
            <div className="md:col-span-7 flex flex-col justify-center text-left space-y-5">
              
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                  Deliverable Package
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {FUNNEL_CONFIG.productTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  {FUNNEL_CONFIG.edition} · {FUNNEL_CONFIG.releaseDate} · Vector PDF &amp; Online Reader
                </p>
              </div>

              {/* File Specs Badges */}
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  📄 81 Pages
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  ⚡ 100 Topics
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-400">
                  🔒 Dynamic DRM Watermark
                </span>
              </div>

              {/* Primary Dual Actions: Online Reader & Direct Download */}
              <div className="space-y-3 pt-2">
                {onNavigateReader && (
                  <button
                    onClick={onNavigateReader}
                    className="w-full flex items-center justify-center gap-3 py-4 px-8 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-base transition-all shadow-xl shadow-cyan-500/25 active:scale-98 focus:outline-none focus:ring-2 focus:ring-cyan-300 cursor-pointer"
                  >
                    <BookOpen className="w-5 h-5 text-slate-950" />
                    <span>Open Protected Online Reader</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                )}

                {hasConfiguredDownload && (
                  <div className="space-y-2">
                    <a
                      href={FUNNEL_CONFIG.ebookDownloadUrl}
                      download="Prompt_Engineering_Handbook_2026.pdf"
                      onClick={handleDownloadClick}
                      className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>Download Offline Vector PDF (~305 KB)</span>
                    </a>

                    {downloadTriggered && (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Download initiated! Check your browser downloads folder.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* Reading Paths Section: Start Getting Value Right Away */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-12">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>How to Read This Handbook</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                From the Preface: Choose the reading path that fits your current objective.
              </p>
            </div>

            {/* Path Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {READING_PATHS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePathTab(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePathTab === p.id
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Active Path Details */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Target: {selectedPath.targetAudience}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {selectedPath.recommendedTopics.length} recommended sections
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              {selectedPath.description}
            </p>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Recommended Reading Checklist:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedPath.recommendedTopics.map((topic, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Delivery Architecture Note */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 text-left mb-10">
          <button
            onClick={() => setShowSecurityInfo(!showSecurityInfo)}
            className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                DRM Protection &amp; Reading Access Notice
              </span>
            </div>
            <div className="text-slate-400 p-1">
              {showSecurityInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showSecurityInfo && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 text-xs text-slate-300 leading-relaxed animate-fade-in">
              <p>
                <strong>Protected Online Reader:</strong> Your license includes full access to our online eBook reader with customer watermark, screen recording protection, and progress tracking.
              </p>
              <p>
                <strong>Concurrent Device Limit:</strong> Each purchase license permits up to 2 concurrent devices. You can manage or revoke active browser sessions from the account panel inside the reader.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Thank You Page Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-[11px] text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          &copy; {new Date().getFullYear()} {FUNNEL_CONFIG.publisherName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
