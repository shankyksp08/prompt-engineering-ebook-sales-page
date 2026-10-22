import React from 'react';
import { X, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';

export type PolicyType = 'refund' | 'privacy' | 'disclaimer' | 'terms' | null;

interface PolicyModalProps {
  policyType: PolicyType;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ policyType, onClose }) => {
  if (!policyType) return null;

  const contentMap = {
    refund: {
      title: 'Refund Policy',
      icon: RefreshCw,
      subtitle: 'Digital Products Delivery & Refund Terms',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            We want you to be completely satisfied with your purchase of <strong>{FUNNEL_CONFIG.productTitle}</strong>.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">1. Immediate Digital Delivery</h4>
          <p>
            Upon successful payment confirmation, you receive immediate access to download the full 81-page eBook in vector PDF format via our post-checkout order fulfillment portal.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">2. Satisfaction &amp; Refund Request</h4>
          <p>
            If you encounter technical issues accessing your file, find that the download is corrupted, or believe the publication does not match the curriculum presented on this page, please contact us within 14 days of purchase at{' '}
            <a href={`mailto:${FUNNEL_CONFIG.supportEmail}`} className="text-cyan-400 underline font-medium">
              {FUNNEL_CONFIG.supportEmail}
            </a>. We will gladly help resolve file access or issue a full refund.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">3. Download Link Re-issuance</h4>
          <p>
            If you lose access to your downloaded file or misplaced your device, simply email customer support with your payment receipt or order email and we will re-issue your download link at no additional charge.
          </p>
        </div>
      ),
    },
    privacy: {
      title: 'Privacy Policy',
      icon: Shield,
      subtitle: `Last updated: ${FUNNEL_CONFIG.releaseDate}`,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            At <strong>{FUNNEL_CONFIG.productTitle}</strong>, we respect your privacy and protect your personal information.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">1. Information We Do Not Collect</h4>
          <p>
            We do not process, store, or have access to your credit card details, debit card credentials, or bank accounts. All payment processing is securely conducted by external, certified PCI-DSS compliant payment gateways.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">2. Digital Delivery &amp; Customer Support</h4>
          <p>
            When completing an order, customer contact information (such as your email address) is used solely to deliver your digital download link and provide direct customer support.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">3. No Third-Party Data Selling</h4>
          <p>
            We never sell, rent, monetize, or disclose your contact details or browsing information to advertising brokers or marketing databases.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">4. Support Inquiries</h4>
          <p>
            For any privacy-related inquiries, reach out directly to{' '}
            <a href={`mailto:${FUNNEL_CONFIG.supportEmail}`} className="text-cyan-400 underline font-medium">
              {FUNNEL_CONFIG.supportEmail}
            </a>.
          </p>
        </div>
      ),
    },
    disclaimer: {
      title: 'Disclaimer',
      icon: AlertCircle,
      subtitle: 'Educational Scope & AI Parameter Notice',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            The instructional materials, prompt blueprints, and architectural patterns in <strong>{FUNNEL_CONFIG.productTitle}</strong> are provided strictly for educational and informational purposes.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">1. AI Model Evolution &amp; Output Variability</h4>
          <p>
            Generative AI models, system prompts, and API parameters (such as temperature, top_p, and frequency penalty) are continuously updated by AI frontier labs. While the core frameworks and techniques in this handbook are designed to be durable, model outputs are probabilistic and may vary across model versions.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">2. No Outcome Guarantee</h4>
          <p>
            Prompt engineering is an applied skill. Practical outcomes, efficiency gains, and code generation success depend on individual application, problem domain, and technical verification. No specific income, employment, or academic outcome is guaranteed.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">3. Trademark &amp; Third-Party References</h4>
          <p>
            References to external tools and frontier models (such as OpenAI, ChatGPT, Anthropic, Claude, Google, Gemini, and others) are made strictly for descriptive, educational, and nominative purposes. The authors and publishers are independent researchers and are not affiliated with or endorsed by these organizations.
          </p>
          <h4 className="text-sm font-bold text-white pt-2">4. Contact &amp; Questions</h4>
          <p>
            If you have questions regarding the handbook content, reach out to our team at{' '}
            <a href={`mailto:${FUNNEL_CONFIG.supportEmail}`} className="text-cyan-400 underline font-medium">
              {FUNNEL_CONFIG.supportEmail}
            </a>.
          </p>
        </div>
      ),
    },
    terms: {
      title: 'Disclaimer',
      icon: AlertCircle,
      subtitle: 'Educational Scope & AI Parameter Notice',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            The instructional materials and prompt blueprints in <strong>{FUNNEL_CONFIG.productTitle}</strong> are provided strictly for educational and informational purposes.
          </p>
          <p>
            For any questions, contact{' '}
            <a href={`mailto:${FUNNEL_CONFIG.supportEmail}`} className="text-cyan-400 underline font-medium">
              {FUNNEL_CONFIG.supportEmail}
            </a>.
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
