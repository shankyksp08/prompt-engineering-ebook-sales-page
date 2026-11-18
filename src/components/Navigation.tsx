import React, { useState, useEffect } from 'react';
import { Menu, X, BookOpen, ArrowRight, UserRound } from 'lucide-react';
import { FUNNEL_CONFIG } from '../config/funnelConfig.ts';

interface NavigationProps {
  onBuyClick: () => void;
  onPreviewClick: () => void;
  onLoginClick?: () => void;
  isThankYouPage?: boolean;
  onNavigateHome?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onBuyClick,
  onPreviewClick,
  onLoginClick,
  isThankYouPage = false,
  onNavigateHome,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Preface', href: '#preface' },
    { label: 'Foundations & Topics', href: '#foundations-and-topics' },
    { label: "What's Included", href: '#whats-included' },
    { label: 'Audience', href: '#who-its-for' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20 py-3'
          : 'bg-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Brand Mark */}
        {isThankYouPage ? (
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg p-1 min-w-0"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/80 text-amber-400 font-mono text-sm font-bold shadow-inner group-hover:border-amber-400 transition-colors shrink-0">
              &gt;_
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-sm sm:text-base tracking-tight block truncate">
                {FUNNEL_CONFIG.productTitle}
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5 truncate">
                ← Return to Sales Page
              </span>
            </div>
          </button>
        ) : (
          <a
            href="#"
            className="flex items-center gap-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg p-1 min-w-0"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/80 text-amber-400 font-mono text-sm font-bold shadow-inner group-hover:border-amber-400 transition-colors shrink-0">
              &gt;_
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-sm sm:text-base tracking-tight block truncate">
                {FUNNEL_CONFIG.productTitle}
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono block -mt-0.5 truncate">
                {FUNNEL_CONFIG.edition} · {FUNNEL_CONFIG.releaseDate}
              </span>
            </div>
          </a>
        )}

        {/* Desktop Nav Links */}
        {!isThankYouPage && (
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-cyan-400 transition-colors py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded motion-link"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={onPreviewClick}
              className="text-slate-300 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-slate-700/80 hover:bg-slate-800 transition-colors motion-secondary-btn cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Sample Pages</span>
            </button>
          </nav>
        )}

        {/* Desktop Thank You CTA (only on /thank-you) */}
        {isThankYouPage && (
          <div className="hidden sm:flex items-center gap-3">
            <a
              href={FUNNEL_CONFIG.ebookDownloadUrl}
              download
              className="flex items-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer motion-cta-btn"
            >
              <span>Download PDF</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Top-Right Header Actions: Login Button + Mobile Hamburger Toggle */}
        {!isThankYouPage && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onLoginClick) {
                  onLoginClick();
                } else if (typeof window !== 'undefined') {
                  window.location.assign('/login');
                }
              }}
              className="motion-cta-btn flex items-center justify-center gap-1.5 py-2 px-3.5 sm:py-2.5 sm:px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-[#FFFFFF] font-extrabold text-xs sm:text-sm shadow-xl shadow-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-cyan-300 cursor-pointer whitespace-nowrap"
            >
              <span className="pointer-events-none absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-cta-sweep" />
              <UserRound className="w-4 h-4 text-[#FFFFFF] shrink-0" />
              <span className="text-[#FFFFFF]">Login</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {!isThankYouPage && mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900/95 border-b border-slate-800 px-4 pt-3 pb-5 mt-2 backdrop-blur-md animate-fade-in">
          <nav className="flex flex-col gap-3 text-sm text-slate-200">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onPreviewClick();
              }}
              className="flex items-center gap-2 py-2 px-3 rounded-lg bg-slate-800/80 text-amber-400 text-left"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Sample Pages</span>
            </button>
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onBuyClick();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20"
              >
                <span>Get This eBook</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
