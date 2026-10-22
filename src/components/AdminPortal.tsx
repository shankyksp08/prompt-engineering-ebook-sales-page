import React from 'react';
import { Settings, ArrowLeft, ExternalLink, CheckCircle2, Shield, FileText, ArrowRight } from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';

interface AdminPortalProps {
  onNavigateHome: () => void;
  onNavigateThankYou: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onNavigateHome,
  onNavigateThankYou,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg p-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Return to Public Sales Page</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-mono text-amber-300 font-semibold uppercase tracking-wider">
              Private Admin &amp; Dev Environment
            </span>
          </div>
        </div>
      </header>

      {/* Main Admin Console */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-wider mb-3">
            <Settings className="w-3.5 h-3.5" />
            <span>Internal Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Funnel Configuration &amp; Testing Console
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            This dashboard is isolated from public customers and contains internal deployment, testing, and gateway settings.
          </p>
        </div>

        {/* Quick Testing Actions Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Development &amp; Testing Links</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={onNavigateThankYou}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
            >
              <div>
                <div className="font-semibold text-white text-sm group-hover:text-cyan-300 transition-colors">
                  Test /thank-you Fulfillment
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Verify the customer download page and reading paths
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
            </button>

            <button
              onClick={onNavigateHome}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
            >
              <div>
                <div className="font-semibold text-white text-sm group-hover:text-cyan-300 transition-colors">
                  View Public Sales Page
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Inspect the production-ready customer view
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Active Payment Configuration */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>Razorpay Integration Status</span>
          </h2>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Payment Gateway Link:</span>
              <span className="font-mono text-emerald-400 font-semibold">Active &amp; Connected</span>
            </div>
            <code className="text-cyan-300 font-mono text-xs break-all block bg-slate-900 p-2.5 rounded border border-slate-800">
              {FUNNEL_CONFIG.paymentUrl}
            </code>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed pt-2">
            <h3 className="font-semibold text-white uppercase text-[11px] tracking-wider text-cyan-400">
              Razorpay Dashboard Redirect URL Configuration:
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-400">
              <li>Open your Razorpay Dashboard &rarr; Payment Links &rarr; Select <code className="text-cyan-300 font-mono">aGZfHfs</code>.</li>
              <li>Set Redirect URL / Callback URL to your deployed domain:
                <div className="mt-1 font-mono text-[11px] bg-slate-950 text-cyan-300 p-2 rounded border border-slate-800 break-all select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/thank-you` : 'https://YOUR-DOMAIN.com/thank-you'}
                </div>
              </li>
              <li>Customers will automatically be redirected to the download portal upon completing payment.</li>
            </ol>
          </div>
        </div>

        {/* Asset & Product Specs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Bundled eBook Asset</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Price</span>
              <span className="text-white font-bold text-sm">{FUNNEL_CONFIG.productPrice}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">PDF Pages</span>
              <span className="text-white font-bold text-sm">{FUNNEL_CONFIG.pageCount} Pages</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Support Email</span>
              <span className="text-white font-mono text-xs truncate block">{FUNNEL_CONFIG.supportEmail}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        Internal Development Environment · Not visible to public customers
      </footer>
    </div>
  );
};
