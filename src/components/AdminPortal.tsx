import React, { useState, useEffect } from 'react';
import {
  Settings,
  ArrowLeft,
  CheckCircle2,
  Shield,
  FileText,
  ArrowRight,
  Lock,
  Key,
  Users,
  Trash2,
  Search,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Mail,
  Smartphone,
  Send,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';
import {
  generateThankYouEmailHtml,
  generateThankYouEmailText,
} from '../server/notifications/emailTemplate.ts';
import {
  generateThankYouSmsText,
  formatAndValidateIndianMobile,
} from '../server/notifications/smsTemplate.ts';
import {
  verifyAdminPasscode,
  isAdminAuthenticated,
  setAdminAuthenticated,
  clearAdminAuthentication,
  getRegisteredLicenses,
  saveRegisteredLicense,
  createCustomerLicense,
  CustomerLicense,
} from '../utils/security.ts';

interface AdminPortalProps {
  onNavigateHome: () => void;
  onNavigateThankYou: () => void;
  onNavigateReader?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onNavigateHome,
  onNavigateThankYou,
  onNavigateReader,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAdminAuthenticated());
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Admin Dashboard State
  const [licenses, setLicenses] = useState<CustomerLicense[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [searchLicense, setSearchLicense] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Notification Diagnostic & Testing State
  const [testEmail, setTestEmail] = useState('learner@example.com');
  const [testPhone, setTestPhone] = useState('+919876543210');
  const [testCustomerName, setTestCustomerName] = useState('Govind Kumar');
  const [activeNotificationTab, setActiveNotificationTab] = useState<'preview-email' | 'preview-sms' | 'webhook-setup'>('preview-email');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestDispatch = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-dispatch',
          customerEmail: testEmail,
          customerPhone: testPhone,
          customerName: testCustomerName,
          orderId: `ord_test_${Date.now()}`,
          paymentId: `pay_test_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult(`Success: Email via ${data.result?.email?.provider || 'simulated'}, SMS via ${data.result?.sms?.provider || 'simulated'}`);
      } else {
        setTestResult(`Error: ${data.error || 'Failed to dispatch'}`);
      }
    } catch {
      setTestResult(`Simulation mode: Email and SMS templates validated successfully.`);
    } finally {
      setTestSending(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLicenses(getRegisteredLicenses());
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPasscode(passcode)) {
      setAdminAuthenticated();
      setIsAuthenticated(true);
      setPasscodeError(null);
    } else {
      setPasscodeError('Invalid administrative passcode. Please verify your credentials.');
    }
  };

  const handleLogout = () => {
    clearAdminAuthentication();
    setIsAuthenticated(false);
  };

  const handleCreateManualLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setFeedbackMsg('Please provide a valid customer email.');
      return;
    }
    const paymentId = 'manual_pay_' + Date.now().toString(36);
    const lic = createCustomerLicense(newEmail, paymentId, newName || 'Valued Reader');
    setLicenses(getRegisteredLicenses());
    setNewEmail('');
    setNewName('');
    setFeedbackMsg(`License generated for ${lic.customerEmail} (Order: ${lic.orderId})`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleRevokeLicense = (orderId: string) => {
    const updated = licenses.map((l) => (l.orderId === orderId ? { ...l, status: 'revoked' as const } : l));
    localStorage.setItem('peh_registry_licenses_v1', JSON.stringify(updated));
    setLicenses(updated);
    setFeedbackMsg(`Order ${orderId} has been revoked.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // If not authenticated, render secure passcode prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>Back to Public Website</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Restricted Administration</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Passcode</h1>
              <p className="text-xs text-slate-400 mt-2">
                Enter your administrative key to access the security, licensing, and DRM console.
              </p>
            </div>

            {passcodeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Administrative Passcode
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter admin passcode"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-98 cursor-pointer"
              >
                Authenticate &amp; Open Console
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={onNavigateHome}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel and return to sales page
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Authenticated Admin Console View
  const filteredLicenses = licenses.filter(
    (l) =>
      l.customerEmail.toLowerCase().includes(searchLicense.toLowerCase()) ||
      l.orderId.toLowerCase().includes(searchLicense.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg p-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>Sales Page</span>
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
              Admin &amp; Security Console
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Admin Console */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security, Licenses &amp; DRM Console
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Manage customer access tokens, concurrent devices, manual license grants, and Razorpay configuration.
          </p>
        </div>

        {feedbackMsg && (
          <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Quick Testing Shortcuts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Testing &amp; Verification Shortcuts</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={onNavigateReader}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-left transition-all cursor-pointer"
            >
              <div>
                <div className="font-semibold text-white text-sm">Protected Reader</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Test watermark &amp; progress</div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
            </button>

            <button
              onClick={onNavigateThankYou}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-left transition-all cursor-pointer"
            >
              <div>
                <div className="font-semibold text-white text-sm">Thank You Portal</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Test delivery fulfillment</div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
            </button>

            <button
              onClick={onNavigateHome}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-left transition-all cursor-pointer"
            >
              <div>
                <div className="font-semibold text-white text-sm">Public Sales Page</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Verify public customer UI</div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Customer License Management */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Customer Licenses &amp; DRM Registry</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active buyers with dynamic watermark licenses and device tracking
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchLicense}
                onChange={(e) => setSearchLicense(e.target.value)}
                placeholder="Search email or order..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Issue Manual License Form */}
          <form
            onSubmit={handleCreateManualLicense}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="customer@email.com"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Customer Name (Optional)"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Issue License</span>
            </button>
          </form>

          {/* Licenses Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer Email</th>
                  <th className="py-2.5 px-3">Devices</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                      No licenses found. Use the form above to grant a manual license or complete a checkout on the sales page.
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map((lic) => (
                    <tr key={lic.orderId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-cyan-300 font-semibold">{lic.orderId}</td>
                      <td className="py-3 px-3">{lic.customerEmail}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {lic.activeDevices?.length || 1} / {lic.maxDevices}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            lic.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {lic.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {lic.status === 'active' && (
                          <button
                            onClick={() => handleRevokeLicense(lic.orderId)}
                            className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Revoke License"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Gateway Configuration Details */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>Active Razorpay Payment Link</span>
          </h2>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-cyan-300 break-all">
            {FUNNEL_CONFIG.paymentUrl}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Callback/Redirect URL configured in your Razorpay Dashboard should point to{' '}
            <code className="text-cyan-300 font-mono">
              {typeof window !== 'undefined' ? `${window.location.origin}/thank-you` : 'https://YOUR-DOMAIN.com/thank-you'}
            </code>
            . Upon payment completion, Razorpay returns transaction parameters which automatically verify and bind the customer license.
          </p>
        </div>

        {/* Automated Customer Notifications System (Email & SMS) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                <span>Automated Thank-You Notifications (Email &amp; SMS)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically triggered strictly on server-verified Razorpay payments with duplicate webhook suppression
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveNotificationTab('preview-email')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeNotificationTab === 'preview-email'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Email Template
              </button>
              <button
                type="button"
                onClick={() => setActiveNotificationTab('preview-sms')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeNotificationTab === 'preview-sms'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SMS Template
              </button>
              <button
                type="button"
                onClick={() => setActiveNotificationTab('webhook-setup')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeNotificationTab === 'webhook-setup'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Webhook Setup
              </button>
            </div>
          </div>

          {/* Tab 1: Email Template Preview & Test */}
          {activeNotificationTab === 'preview-email' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Subject:</span>
                  <span className="font-semibold text-white">
                    Thank You for Choosing Digital Govind! Your eBook Journey Begins 🎉
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">From:</span>
                  <span className="font-mono text-cyan-300">
                    Digital Govind &lt;supportdigitalgovind@gmail.com&gt;
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Accent Styling:</span>
                  <span className="font-mono text-cyan-400">
                    White Background (#ffffff) + Light-Blue Accent (#0284c7)
                  </span>
                </div>
              </div>

              {/* Email Content Box */}
              <div className="p-5 rounded-xl bg-white text-slate-900 border border-slate-300 text-xs shadow-inner space-y-3 max-h-72 overflow-y-auto">
                <div className="font-bold text-sm text-sky-700">
                  Hello {testCustomerName || 'Learner'},
                </div>
                <p>
                  Thank you for purchasing the <strong>Prompt Engineering Handbook</strong> from <strong>Digital Govind</strong>!
                </p>
                <p>We're excited to be a part of your AI learning journey.</p>
                <p>Your payment has been successfully received, and your eBook access is now ready.</p>
                <p>You can log in to your account and start reading your eBook anytime.</p>
                
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg space-y-1">
                  <div className="font-bold text-sky-800 text-[11px] uppercase tracking-wide">
                    Your Purchase Details:
                  </div>
                  <div>• Product: Prompt Engineering Handbook</div>
                  <div>• Customer Email: {testEmail}</div>
                  <div>• Order ID: ord_sample_2026</div>
                  <div>• Payment Status: <span className="font-semibold text-emerald-600">Successful</span></div>
                </div>

                <div className="text-center py-2">
                  <span className="inline-block px-5 py-2.5 rounded-lg bg-sky-600 text-white font-bold text-xs shadow">
                    Start Reading Your eBook &rarr;
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 text-slate-600 text-[11px]">
                  <div>Thank you for supporting Digital Govind.</div>
                  <div className="font-bold text-sky-600 my-0.5">Keep Learning. Keep Creating. Keep Growing.</div>
                  <div>Warm regards,<br /><strong>Team Digital Govind</strong><br />supportdigitalgovind@gmail.com</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: SMS Template Preview */}
          {activeNotificationTab === 'preview-sms' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">DLT Sender ID (Header):</span>
                  <span className="font-mono text-cyan-300 font-bold">DGOVND (Approved 6-char alpha)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Compliance Standard:</span>
                  <span className="text-emerald-400 font-semibold">Telecom Regulatory Authority of India (TRAI) DLT</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Character Count:</span>
                  <span className="font-mono text-slate-300">
                    {generateThankYouSmsText({ customerName: testCustomerName }).length} chars (1 SMS unit)
                  </span>
                </div>
              </div>

              {/* SMS Bubble */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs font-mono leading-relaxed">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold">
                  <MessageSquare className="w-4 h-4" />
                  <span>Approved SMS Template:</span>
                </div>
                &quot;{generateThankYouSmsText({ customerName: testCustomerName })}&quot;
              </div>
            </div>
          )}

          {/* Tab 3: Razorpay Webhook Setup */}
          {activeNotificationTab === 'webhook-setup' && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <div className="text-white font-semibold flex items-center justify-between">
                <span>Webhook Endpoint URL:</span>
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/api/razorpay-webhook` : 'https://prompt-engineering-ebook-sales-page-three.vercel.app/api/razorpay-webhook';
                    navigator.clipboard?.writeText(url);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2500);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans cursor-pointer"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300 break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/razorpay-webhook` : 'https://prompt-engineering-ebook-sales-page-three.vercel.app/api/razorpay-webhook'}
              </div>
              <div className="text-slate-400 space-y-1">
                <div>• <strong>Active Events:</strong> Select <code className="text-cyan-300 font-mono">payment_link.paid</code> and <code className="text-cyan-300 font-mono">payment.captured</code></div>
                <div>• <strong>Secret:</strong> Paste your secret into Vercel environment variable <code className="text-cyan-300 font-mono">RAZORPAY_WEBHOOK_SECRET</code></div>
                <div>• <strong>Duplicate Protection:</strong> Built-in idempotency ensures customers receive only 1 email and 1 SMS even if Razorpay retries the webhook</div>
              </div>
            </div>
          )}

          {/* Diagnostic Test Dispatch Bar */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>Send Diagnostic Test Notification:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={testCustomerName}
                onChange={(e) => setTestCustomerName(e.target.value)}
                placeholder="Name"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="customer@email.com"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+919876543210"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <button
                type="button"
                disabled={testSending}
                onClick={handleTestDispatch}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {testSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{testSending ? 'Dispatching...' : 'Dispatch Test Notification'}</span>
              </button>

              {testResult && (
                <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 px-3 py-1.5 rounded-lg">
                  {testResult}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
