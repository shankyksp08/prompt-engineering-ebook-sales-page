/**
 * Prompt Engineering Handbook — Sales Funnel & Delivery Portal
 * 
 * Implements two distinct pages:
 * 1. High-Converting eBook Sales Page (/)
 * 2. Dedicated Thank-You & Download Portal (/thank-you)
 */

import React, { useState, useEffect } from 'react';
import { FUNNEL_CONFIG, isPaymentConfigured } from './config/funnelConfig.ts';
import { Navigation } from './components/Navigation.tsx';
import { Hero } from './components/Hero.tsx';
import { ProblemSection } from './components/ProblemSection.tsx';
import { PrefaceSection } from './components/PrefaceSection.tsx';
import { FoundationsAndTopicsSection } from './components/FoundationsAndTopicsSection.tsx';
import { KeyBenefits } from './components/KeyBenefits.tsx';
import { WhatsIncluded } from './components/WhatsIncluded.tsx';
import { InteractivePreview } from './components/InteractivePreview.tsx';
import { AudienceSection } from './components/AudienceSection.tsx';
import { HowItWorks } from './components/HowItWorks.tsx';
import { FaqSection } from './components/FaqSection.tsx';
import { FinalCta } from './components/FinalCta.tsx';
import { Footer } from './components/Footer.tsx';
import { ThankYouPage } from './components/ThankYouPage.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { ProductPreviewModal } from './components/ProductPreviewModal.tsx';
import { PolicyModal, PolicyType } from './components/PolicyModal.tsx';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  // Sync with browser navigation (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/return-policy' || path.endsWith('/return-policy')) {
        window.history.replaceState({}, '', '/');
        setCurrentPath('/');
      } else {
        setCurrentPath(path);
      }
      window.scrollTo(0, 0);
    };

    if (window.location.pathname === '/return-policy' || window.location.pathname.endsWith('/return-policy')) {
      window.history.replaceState({}, '', '/');
      setCurrentPath('/');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    }
  };

  /**
   * Universal Purchase CTA Handler
   * All "Get This eBook" buttons invoke this identical function.
   */
  const handleBuyClick = () => {
    if (isPaymentConfigured(FUNNEL_CONFIG.paymentUrl)) {
      // Direct user to external payment provider checkout
      window.location.href = FUNNEL_CONFIG.paymentUrl;
    } else {
      navigate('/thank-you');
    }
  };

  // Route: /thank-you (Customer Fulfillment Portal)
  if (currentPath === '/thank-you' || currentPath.endsWith('/thank-you')) {
    return (
      <ThankYouPage onNavigateHome={() => navigate('/')} />
    );
  }

  // Route: /admin (Private Development & Admin Console)
  if (currentPath === '/admin' || currentPath.endsWith('/admin')) {
    return (
      <AdminPortal
        onNavigateHome={() => navigate('/')}
        onNavigateThankYou={() => navigate('/thank-you')}
      />
    );
  }

  // Route: / (Sales Page)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* SECTION A — Premium Navigation */}
      <Navigation
        onBuyClick={handleBuyClick}
        onPreviewClick={() => setPreviewModalOpen(true)}
      />

      <main className="flex-1">
        {/* SECTION B — Hero Section */}
        <Hero
          onBuyClick={handleBuyClick}
          onPreviewClick={() => setPreviewModalOpen(true)}
        />

        {/* SECTION C — Problem and Relevance */}
        <ProblemSection />

        {/* SINGLE SECTION: Preface */}
        <PrefaceSection />

        {/* SINGLE SECTION: Foundations & 100 Topics */}
        <FoundationsAndTopicsSection />

        {/* Key Practical Benefits */}
        <KeyBenefits />

        {/* What's Included Deliverable Package */}
        <WhatsIncluded
          onBuyClick={handleBuyClick}
          onPreviewClick={() => setPreviewModalOpen(true)}
        />

        {/* Product Preview Sample Reader */}
        <InteractivePreview
          onOpenFullModal={() => setPreviewModalOpen(true)}
          onBuyClick={handleBuyClick}
        />

        {/* SECTION I — Who Should Read This Book? */}
        <AudienceSection />

        {/* SECTION J — How It Works (3-Step Practice Loop) */}
        <HowItWorks />

        {/* SECTION K — Frequently Asked Questions */}
        <FaqSection />

        {/* SECTION L — Final Purchase Section */}
        <FinalCta
          onBuyClick={handleBuyClick}
          onPreviewClick={() => setPreviewModalOpen(true)}
        />
      </main>

      {/* SECTION M — Public Footer with Legal Policy Links and Support Email */}
      <Footer
        onOpenPolicy={(type) => setActivePolicy(type)}
      />

      {/* Modals & Dialogs */}
      <ProductPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onGetBook={handleBuyClick}
      />

      <PolicyModal
        policyType={activePolicy}
        onClose={() => setActivePolicy(null)}
      />

    </div>
  );
}
