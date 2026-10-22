import React from 'react';
import { X, Shield, FileText, RefreshCw } from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';

export type PolicyType = 'privacy' | 'terms' | 'refund' | null;

interface PolicyModalProps {
  policyType: PolicyType;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ policyType, onClose }) => {
  if (!policyType) return null;

  const contentMap = {
    privacy: {
      title: 'Privacy Policy',
      icon: Shield,
      subtitle: `Last updated: ${FUNNEL_CONFIG.releaseDate}`,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            At <strong>{FUNNEL_CONFIG.productTitle}</strong>, we respect your privacy. This policy outlines how your information is handled when visiting our website and purchasing our digital publication.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">1. Information We Do Not Collect</h4>
          <p>
            We do not process, store, or have access to your payment card details, bank information, or cardholder credentials. All financial transactions are securely handled by our external PCI-DSS compliant payment processor (e.g. Stripe, Lemon Squeezy, Gumroad).
          </p>
          <h4 className="text-sm font-bold text-white pt-2">2. Digital Delivery &amp; Support</h4>
          <p>
            When you purchase our eBook, our payment processor transmits order fulfillment identifiers and customer email so that download access can be granted and critical product updates can be communicated.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">3. Cookies and Analytics</h4>
          <p>
            We minimize tracking technologies. We do not sell, rent, or trade visitor data to third-party data brokers or advertising networks.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">4. Contact Us</h4>
          <p>
            For privacy-related inquiries, reach out to our team at{' '}
            <a href={`mailto:${FUNNEL_CONFIG.supportEmail}`} className="text-cyan-400 underline">
              {FUNNEL_CONFIG.supportEmail}
            </a>.
          </p>
        </div>
      ),
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      subtitle: `Last updated: ${FUNNEL_CONFIG.releaseDate}`,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            By purchasing or accessing <strong>{FUNNEL_CONFIG.productTitle}</strong>, you agree to these Terms of Service.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">1. Digital License</h4>
          <p>
            Upon successful purchase, you are granted a non-exclusive, non-transferable personal license to view, read, and store the digital PDF for your own study and educational use. You may not resell, redistribute, publicize, or publicly host the PDF.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">2. Educational &amp; Informational Scope</h4>
          <p>
            This handbook is provided strictly for educational purposes based on public documentation, research surveys, and practitioner experience. AI models and vendor parameters evolve rapidly. No outcome, certification, or financial result is guaranteed.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">3. Intellectual Property</h4>
          <p>
            All text, layout, and structured instructional materials contained within the handbook are copyrighted. Mention of AI tools (ChatGPT, Claude, Gemini, etc.) is strictly for descriptive and nominative identification.
          </p>
        </div>
      ),
    },
    refund: {
      title: 'Refund & Delivery Policy',
      icon: RefreshCw,
      subtitle: `Digital Goods Policy`,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            We want you to be completely confident in your purchase of <strong>{FUNNEL_CONFIG.productTitle}</strong>.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">1. Immediate Digital Delivery</h4>
          <p>
            The product is a digital PDF file delivered immediately after payment confirmation via a direct download link on the thank-you page.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">2. Satisfaction Commitment</h4>
          <p>
            If you encounter any difficulty downloading the file or believe the handbook does not match what was advertised, please contact us within 14 days of purchase at{' '}
            <a href={`mailto:${FUNNEL_CONFIG.supportEmail}`} className="text-cyan-400 underline">
              {FUNNEL_CONFIG.supportEmail}
            </a>. We will promptly assist you with direct delivery or issue a full refund.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">3. Technical Support</h4>
          <p>
            Lost your download link? Simply email us with your purchase receipt or transaction email and we will re-issue your download link immediately.
          </p>
        </div>
      ),
    },
  }[policyType];

  const Icon = contentMap.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 text-white flex flex-col overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Close policy modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 id="policy-modal-title" className="text-lg font-bold tracking-tight text-white">
              {contentMap.title}
            </h3>
            <p className="text-xs text-slate-400">{contentMap.subtitle}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {contentMap.content}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
