import React from 'react';
import { Mail, Shield, FileText, RefreshCw, Settings } from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';
import { PolicyType } from './PolicyModal.tsx';

interface FooterProps {
  onOpenPolicy: (type: PolicyType) => void;
  onOpenConfigModal: () => void;
  onNavigateThankYou?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicy,
  onOpenConfigModal,
  onNavigateThankYou,
}) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-slate-900 border border-amber-500/80 text-amber-400 font-mono text-xs font-bold">
                &gt;_
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                {FUNNEL_CONFIG.productTitle}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              A practical handbook that helps readers understand prompt engineering, write clearer AI instructions, improve prompts through iteration, and explore practical prompting techniques.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              {FUNNEL_CONFIG.edition} · Published {FUNNEL_CONFIG.releaseDate} · {FUNNEL_CONFIG.pageCount} Pages
            </div>
          </div>

          {/* Quick Legal / Policies */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Legal &amp; Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenPolicy('privacy')}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('terms')}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Terms of Service</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('refund')}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refund &amp; Delivery Policy</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Admin helper */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Customer Support
            </h4>
            <p className="text-xs text-slate-400">
              Questions or issues with your digital download? Reach out anytime:
            </p>
            <a
              href={`mailto:${FUNNEL_CONFIG.supportEmail}`}
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors text-xs font-medium"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{FUNNEL_CONFIG.supportEmail}</span>
            </a>

            <div className="pt-2">
              <button
                onClick={onOpenConfigModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-700/70 transition-colors cursor-pointer"
                title="View Funnel Configuration & Admin Links"
              >
                <Settings className="w-3 h-3 text-amber-400" />
                <span>Admin Funnel Guide</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} {FUNNEL_CONFIG.publisherName}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            {onNavigateThankYou && (
              <button
                onClick={onNavigateThankYou}
                className="hover:text-slate-400 transition-colors underline cursor-pointer"
              >
                View /thank-you Page
              </button>
            )}
            <span>Digital Delivery Only</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
