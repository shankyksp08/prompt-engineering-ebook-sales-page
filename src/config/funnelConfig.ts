/**
 * Prompt Engineering Handbook - Sales Funnel Configuration
 * 
 * Edit this file to customize your sales page and thank-you page.
 * All purchase buttons, download links, pricing, and contact info
 * are driven from this single file.
 */

export interface FunnelConfig {
  productTitle: string;
  productSubtitle: string;
  edition: string;
  releaseDate: string;
  pageCount: number;
  topicCount: number;
  partCount: number;
  
  // Payment gateway checkout URL
  // Replace with your real Stripe Payment Link, Lemon Squeezy, Gumroad, or Paddle checkout URL.
  // Example: "https://buy.stripe.com/test_..." or "https://gumroad.com/l/..."
  paymentUrl: string;

  // eBook file download URL
  // Defaults to the bundled PDF file in public/assets/aistudio/...
  // You can also change this to an S3/Cloud Storage signed link or CDN URL.
  ebookDownloadUrl: string;

  // Post-payment redirect thank-you page URL
  // Configure this in your payment processor's "After Payment" or "Redirect URL" setting.
  thankYouUrl: string;

  // Pricing
  productPrice: string;
  currency: string;
  originalPrice?: string; // Optional comparison (honest, no fake discounts)

  // Author and support
  authorName: string;
  publisherName: string;
  supportEmail: string;

  // Legal and policy links (Refund Policy, Privacy Policy, Disclaimer)
  refundPolicyUrl: string;
  privacyPolicyUrl: string;
  disclaimerUrl: string;
}

export const FUNNEL_CONFIG: FunnelConfig = {
  productTitle: "Prompt Engineering Handbook",
  productSubtitle: "100 Essential Topics, from Your First Prompt to Production",
  edition: "First Edition",
  releaseDate: "October 2026",
  pageCount: 81,
  topicCount: 100,
  partCount: 9,

  // Razorpay Payment Link connected to all purchase CTA buttons
  paymentUrl: "https://rzp.io/rzp/aGZfHfs",

  // Bundled static PDF path in the repository
  ebookDownloadUrl: "/assets/aistudio/Prompt_Engineering_Handbook_d0bf9480.pdf",

  // The relative or deployed URL of your thank-you page
  thankYouUrl: "/thank-you",

  // Transparent pricing
  productPrice: "₹99",
  currency: "INR",
  originalPrice: "₹199",

  // Business & support info
  authorName: "Prompt Engineering Research Collective",
  publisherName: "Prompt Engineering Handbook Publishing",
  supportEmail: "supportdigitalgovind@gmail.com",

  // Three supported policies: Refund Policy, Privacy Policy, Disclaimer
  refundPolicyUrl: "#refund",
  privacyPolicyUrl: "#privacy",
  disclaimerUrl: "#disclaimer",
};

/**
 * Checks if the payment checkout URL has been configured with an external link.
 */
export function isPaymentConfigured(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed !== "" &&
    !trimmed.includes("REPLACE_WITH_MY_PAYMENT_CHECKOUT_URL") &&
    (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
  );
}

/**
 * Checks if the eBook download URL is configured.
 */
export function isDownloadConfigured(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed !== "" &&
    !trimmed.includes("REPLACE_WITH_YOUR_EBOOK_DOWNLOAD_URL")
  );
}
