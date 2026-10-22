import React from 'react';
import { X, ExternalLink, ArrowRight, ShieldCheck, Settings, CheckCircle2 } from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';

interface CheckoutGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateRedirect: () => void;
}

export const CheckoutGuideModal: React.FC<CheckoutGuideModalProps> = ({
  isOpen,
  onClose,
  onSimulateRedirect,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 text-white overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 id="modal-title" className="text-xl font-bold tracking-tight text-white">
              Payment Checkout Configuration
            </h3>
            <p className="text-xs text-slate-400">
              For website owners &amp; administrators
            </p>
          </div>
        </div>

        {/* Informative Body */}
        <div className="space-y-4 text-sm text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 leading-relaxed">
            <p className="font-semibold text-slate-200 mb-1">
              Currently using placeholder payment checkout URL:
            </p>
            <code className="text-amber-300 font-mono break-all block bg-slate-950/70 p-2 rounded border border-slate-800">
              {FUNNEL_CONFIG.paymentUrl}
            </code>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> How to connect your live checkout:
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 pl-1 leading-relaxed">
              <li>
                Create a payment link in your preferred gateway (e.g. <strong>Stripe Payment Links, Lemon Squeezy, Gumroad, or Paddle</strong>).
              </li>
              <li>
                Set the gateway&apos;s <strong>Redirect URL / Success URL</strong> to:
                <div className="mt-1 font-mono text-[11px] bg-slate-950/80 text-cyan-300 p-1.5 rounded border border-slate-800 break-all select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/thank-you` : 'https://YOUR-DOMAIN.com/thank-you'}
                </div>
              </li>
              <li>
                Update <code className="text-white font-mono bg-slate-800 px-1 py-0.5 rounded">src/config/funnelConfig.ts</code> with your payment URL.
              </li>
            </ol>
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2.5">
            <button
              onClick={() => {
                onClose();
                onSimulateRedirect();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
            >
              <span>Test Thank-You Flow (Simulate Post-Payment)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Back to Sales Page
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            No customer card data is ever collected or processed on this server.
          </p>
        </div>
      </div>
    </div>
  );
};
