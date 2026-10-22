import React from 'react';
import { Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';
import { PolicyType } from './PolicyModal.tsx';

interface FooterProps {
  onOpenPolicy: (type: PolicyType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPolicy }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-slate-900 border border-amber-500/80 text-amber-400 font-mono text-xs font-bold">
                &gt;_
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                {FUNNEL_CONFIG.productTitle}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              A practical handbook that helps readers understand prompt engineering, write clearer AI instructions, improve prompts through iteration, and explore practical prompting techniques.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              {FUNNEL_CONFIG.edition} · Published {FUNNEL_CONFIG.releaseDate} · {FUNNEL_CONFIG.pageCount} Pages
            </div>
          </div>

          {/* Quick Legal / Policies: Refund Policy, Privacy Policy, Disclaimer */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Legal &amp; Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenPolicy('refund')}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refund Policy</span>
                </button>
              </li>
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
                  onClick={() => onOpenPolicy('disclaimer')}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Disclaimer</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright and Clickable Support Email Only */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} {FUNNEL_CONFIG.publisherName}. All rights reserved.
          </div>

          <div>
            <a
              href="mailto:supportdigitalgovind@gmail.com"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              supportdigitalgovind@gmail.com
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
