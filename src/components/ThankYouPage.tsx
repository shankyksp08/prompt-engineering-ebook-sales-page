import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  FileText,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Clock,
  Code,
  Shield,
  Layers,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FUNNEL_CONFIG, isDownloadConfigured } from '../config/funnelConfig.ts';
import { READING_PATHS } from '../utils/funnel.ts';
import { BookMockup } from './BookMockup.tsx';

interface ThankYouPageProps {
  onNavigateHome: () => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({ onNavigateHome }) => {
  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [activePathTab, setActivePathTab] = useState<'30-minute' | 'practical' | 'builder'>('30-minute');

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
              Order Fulfillment Portal
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
            Your digital copy is ready for immediate download. Click the button below to save the 81-page PDF file to your device.
          </p>
        </div>

        {/* Central Download Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl mb-12 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left: Book Cover preview */}
            <div className="md:col-span-5 flex justify-center">
              <BookMockup size="sm" interactive={false} />
            </div>

            {/* Right: Primary Download Action */}
            <div className="md:col-span-7 flex flex-col justify-center text-left space-y-5">
              
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                  Deliverable File Details
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {FUNNEL_CONFIG.productTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  {FUNNEL_CONFIG.edition} · {FUNNEL_CONFIG.releaseDate} · Vector PDF Format
                </p>
              </div>

              {/* File Specs Badges */}
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  📄 81 Pages
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  💾 ~305 KB PDF
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  ⚡ 100 Topics
                </span>
              </div>

              {/* Primary Download Button */}
              {hasConfiguredDownload ? (
                <div className="space-y-3 pt-2">
                  <a
                    href={FUNNEL_CONFIG.ebookDownloadUrl}
                    download="Prompt_Engineering_Handbook_2026.pdf"
                    onClick={handleDownloadClick}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-3 py-4 px-8 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-extrabold text-base transition-all shadow-xl shadow-emerald-500/20 active:scale-98 focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-slate-950" />
                    <span>Download Your eBook</span>
                  </a>

                  {downloadTriggered && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Download initiated! Check your browser downloads folder.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Configuration Warning: Missing EBOOK_DOWNLOAD_URL</span>
                  </div>
                  <p>
                    The download URL has not been customized yet. Please edit{' '}
                    <code className="bg-slate-900 px-1 py-0.5 rounded text-white font-mono">
                      src/config/funnelConfig.ts
                    </code>{' '}
                    to specify your live PDF location.
                  </p>
                </div>
              )}

              {/* Troubleshooting note */}
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                If the download does not start automatically,{' '}
                <a
                  href={FUNNEL_CONFIG.ebookDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  click here to open the PDF directly in a new tab
                </a>
                .
              </p>

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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

        {/* Security & Delivery Architecture Note (Honest Technical Disclosure) */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 text-left mb-10">
          <button
            onClick={() => setShowSecurityInfo(!showSecurityInfo)}
            className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                Delivery Mode &amp; Payment Verification Notice
              </span>
            </div>
            <div className="text-slate-400 p-1">
              {showSecurityInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showSecurityInfo && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 text-xs text-slate-300 leading-relaxed animate-fade-in">
              <p>
                <strong>Delivery Mode:</strong> This page is designed as the post-payment redirection destination for your Razorpay Payment Link (<code className="bg-slate-800 px-1 py-0.5 rounded font-mono text-cyan-300">https://rzp.io/rzp/aGZfHfs</code>).
              </p>
              <p>
                <strong>Notice on Verification:</strong> Visiting this URL alone does not cryptographically prove that a payment was completed. This site operates as a client-side delivery portal. The download link provides direct access to the bundled eBook and is not gated behind server-side authorization.
              </p>
              <p>
                <strong>Server-Side Hardening (Optional):</strong> For strict copy protection, configure a server webhook (e.g. Razorpay <code className="bg-slate-800 px-1 py-0.5 rounded font-mono">payment_link.paid</code>), verify the <code className="bg-slate-800 px-1 py-0.5 rounded font-mono">X-Razorpay-Signature</code> via HMAC-SHA256, and generate a time-limited signed download token.
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
