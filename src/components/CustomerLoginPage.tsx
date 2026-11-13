import React, { useState } from 'react';
import { Shield, ArrowLeft, Mail, Key, CheckCircle2, AlertCircle, BookOpen, ArrowRight } from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';
import {
  createCustomerLicense,
  getRegisteredLicenses,
  getActiveLicense,
} from '../utils/security.ts';

interface CustomerLoginPageProps {
  onNavigateHome: () => void;
  onLoginSuccess: () => void;
}

export const CustomerLoginPage: React.FC<CustomerLoginPageProps> = ({
  onNavigateHome,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [orderOrPaymentId, setOrderOrPaymentId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const existingLicense = getActiveLicense();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid customer email address.');
      return;
    }

    setLoading(true);

    const checkAccess = async () => {
      try {
        // 1. Check existing verified licenses in local storage registry
        const registry = getRegisteredLicenses();
        const match = registry.find(
          (l) =>
            l.customerEmail.toLowerCase() === cleanEmail && l.status === 'active' ||
            (orderOrPaymentId &&
              (l.orderId.toLowerCase() === orderOrPaymentId.trim().toLowerCase() ||
                l.paymentId.toLowerCase() === orderOrPaymentId.trim().toLowerCase()))
        );

        if (match) {
          // Existing customer retains access
          createCustomerLicense(match.customerEmail, match.paymentId, match.customerName);
          setSuccessMessage('Verified purchase confirmed! Opening eBook reader...');
          setTimeout(() => {
            onLoginSuccess();
          }, 800);
          return;
        }

        // 2. If Order/Payment ID provided, verify against server API
        if (orderOrPaymentId) {
          const res = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId: orderOrPaymentId.trim(),
              paymentLinkId: orderOrPaymentId.trim(),
              status: 'paid',
              email: cleanEmail,
            }),
          });

          const data = await res.json().catch(() => ({}));
          if (res.ok && data.verified && data.license) {
            createCustomerLicense(
              cleanEmail,
              orderOrPaymentId.trim(),
              data.license.customerName || 'Verified Reader',
              data.license.token,
              data.license.orderId
            );
            setSuccessMessage('Payment verified! Access unlocked...');
            setTimeout(() => {
              onLoginSuccess();
            }, 800);
            return;
          }
        }

        // 3. Unpaid or unverified customer access rejected
        setErrorMessage(
          'No verified purchase found for this email address. Please provide your Razorpay Payment ID or purchase the handbook from the sales page.'
        );
      } catch (err: any) {
        setErrorMessage('Verification failed. Please check your network and try again.');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg p-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Return to Sales Page</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
              Secure Reader Access
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/10">
              <Shield className="w-7 h-7" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Customer Sign In
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Access your protected online handbook reader, saved progress, and custom watermarked content.
            </p>
          </div>

          {/* Already logged in shortcut */}
          {existingLicense && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Active Session Detected</div>
                <div className="text-[11px] text-emerald-400/80 font-mono truncate max-w-[200px]">
                  {existingLicense.customerEmail}
                </div>
              </div>
              <button
                onClick={onLoginSuccess}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors cursor-pointer"
              >
                <span>Open Reader</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Customer Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Razorpay Payment ID / Order ID <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderOrPaymentId}
                  onChange={(e) => setOrderOrPaymentId(e.target.value)}
                  placeholder="pay_xxx or ORD-xxx"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-cyan-500/20 active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Verifying...' : 'Unlock Online Reader'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 leading-relaxed">
              Haven&apos;t purchased the handbook yet?{' '}
              <button
                onClick={onNavigateHome}
                className="text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Get it for {FUNNEL_CONFIG.productPrice}
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-500">
              Need assistance? Email{' '}
              <a href={`mailto:${FUNNEL_CONFIG.supportEmail}`} className="text-cyan-400 hover:underline">
                {FUNNEL_CONFIG.supportEmail}
              </a>
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} {FUNNEL_CONFIG.publisherName}. All rights reserved.
      </footer>
    </div>
  );
};
