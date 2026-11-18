/**
 * Digital Govind — Prompt Engineering Handbook
 * Razorpay Webhook & Payment Signature Verification Service
 * 
 * Capabilities:
 * 1. Server-to-server Razorpay API verification (GET /v1/payments/:id).
 * 2. Strict status validation (rejects uncaptured, pending, failed, refunded transactions).
 * 3. Amount (9900 paise = ₹99) and currency ('INR') verification.
 * 4. Payment Link binding check against the official Digital Govind link (https://rzp.io/rzp/aGZfHfs).
 * 5. HMAC-SHA256 signature verification for webhook and checkout callbacks.
 * 6. Test fixture mocking support for offline testing without real Razorpay network calls.
 */

import crypto from 'node:crypto';

export interface RazorpayCustomerDetails {
  orderId: string;
  paymentId: string;
  customerEmail: string;
  customerPhone?: string;
  customerName?: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  error?: string;
  details?: RazorpayCustomerDetails;
  isSimulated?: boolean;
}

export interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string; // 'captured', 'authorized', 'failed', 'refunded'
  order_id?: string | null;
  invoice_id?: string | null;
  international?: boolean;
  method?: string;
  amount_refunded?: number;
  refund_status?: string | null;
  captured?: boolean;
  description?: string;
  email?: string;
  contact?: string;
  notes?: Record<string, any>;
  fee?: number;
  tax?: number;
  error_code?: string | null;
  error_description?: string | null;
  created_at?: number;
}

export interface RazorpayPaymentLinkEntity {
  id: string;
  entity?: string;
  amount: number;
  amount_paid: number;
  currency: string;
  status: string; // 'paid', 'issued', 'expired', 'cancelled'
  short_url?: string;
  description?: string;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  payments?: Array<{
    payment_id: string;
    amount: number;
    status: string;
    created_at?: number;
  }>;
  order_id?: string;
  reference_id?: string;
}

export interface ServerSidePaymentVerificationResult {
  verified: boolean;
  httpStatus: number;
  error?: string;
  message?: string;
  payment?: RazorpayPaymentEntity;
  paymentLink?: RazorpayPaymentLinkEntity;
  orderId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

// In-memory test mock fixtures for automated testing without live credentials
const mockPayments: Map<string, RazorpayPaymentEntity> = new Map();
const mockPaymentLinks: Map<string, RazorpayPaymentLinkEntity> = new Map();

export function setMockRazorpayPayment(payment: RazorpayPaymentEntity): void {
  mockPayments.set(payment.id, payment);
}

export function setMockRazorpayPaymentLink(link: RazorpayPaymentLinkEntity): void {
  mockPaymentLinks.set(link.id, link);
}

export function clearMockRazorpayData(): void {
  mockPayments.clear();
  mockPaymentLinks.clear();
}

/**
 * Retrieve server-side Razorpay API credentials
 */
export function getRazorpayCredentials(): {
  keyId?: string;
  keySecret?: string;
  isConfigured: boolean;
} {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const isConfigured = Boolean(keyId && keySecret);
  return { keyId, keySecret, isConfigured };
}

/**
 * Fetch official payment details directly from Razorpay API
 */
export async function fetchRazorpayPayment(
  paymentId: string
): Promise<{ success: boolean; data?: RazorpayPaymentEntity; status?: number; error?: string; message?: string }> {
  const cleanId = (paymentId || '').trim();
  if (!cleanId) {
    return { success: false, status: 400, error: 'MISSING_PAYMENT_ID', message: 'Payment ID is required.' };
  }

  // Check mock store first (for automated test suites and offline testing)
  if (mockPayments.has(cleanId)) {
    const mock = mockPayments.get(cleanId)!;
    return { success: true, data: mock, status: 200 };
  }

  const { keyId, keySecret, isConfigured } = getRazorpayCredentials();
  if (!isConfigured) {
    return {
      success: false,
      status: 500,
      error: 'CREDENTIALS_MISSING',
      message: 'Razorpay API credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured on the server.',
    };
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const url = `https://api.razorpay.com/v1/payments/${encodeURIComponent(cleanId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json().catch(() => ({}));

    if (response.status === 404 || (json && json.error && json.error.code === 'BAD_REQUEST_ERROR')) {
      return {
        success: false,
        status: 404,
        error: 'PAYMENT_NOT_FOUND',
        message: json.error?.description || `Payment record '${cleanId}' was not found on Razorpay.`,
      };
    }

    if (response.status === 401) {
      return {
        success: false,
        status: 500,
        error: 'AUTH_FAILED',
        message: 'Invalid Razorpay API credentials.',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: json.error?.code || 'RAZORPAY_API_ERROR',
        message: json.error?.description || `Razorpay API error (HTTP ${response.status})`,
      };
    }

    return { success: true, data: json as RazorpayPaymentEntity, status: 200 };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      error: 'NETWORK_ERROR',
      message: `Failed to connect to Razorpay API: ${err.message}`,
    };
  }
}

/**
 * Fetch official payment link details directly from Razorpay API
 */
export async function fetchRazorpayPaymentLink(
  paymentLinkId: string
): Promise<{ success: boolean; data?: RazorpayPaymentLinkEntity; status?: number; error?: string; message?: string }> {
  const cleanId = (paymentLinkId || '').trim();
  if (!cleanId) {
    return { success: false, status: 400, error: 'MISSING_PAYMENT_LINK_ID', message: 'Payment Link ID is required.' };
  }

  // Check mock store first
  if (mockPaymentLinks.has(cleanId)) {
    const mock = mockPaymentLinks.get(cleanId)!;
    return { success: true, data: mock, status: 200 };
  }

  const { keyId, keySecret, isConfigured } = getRazorpayCredentials();
  if (!isConfigured) {
    return {
      success: false,
      status: 500,
      error: 'CREDENTIALS_MISSING',
      message: 'Razorpay API credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured on the server.',
    };
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    // Try payment_links endpoint first
    let response = await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(cleanId)}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    // Fallback to invoices if 404
    if (response.status === 404) {
      response = await fetch(`https://api.razorpay.com/v1/invoices/${encodeURIComponent(cleanId)}`, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });
    }

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: json.error?.code || 'PAYMENT_LINK_ERROR',
        message: json.error?.description || `Failed to retrieve payment link '${cleanId}'`,
      };
    }

    return { success: true, data: json as RazorpayPaymentLinkEntity, status: 200 };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      error: 'NETWORK_ERROR',
      message: `Failed to query Razorpay Payment Links API: ${err.message}`,
    };
  }
}

/**
 * Strict Server-to-Server Razorpay Payment Verification
 * 
 * Verifies:
 * 1. Payment exists on Razorpay servers.
 * 2. Payment status is strictly 'captured' (and captured === true).
 * 3. Amount matches expected eBook price (9900 paise = ₹99).
 * 4. Currency is strictly 'INR'.
 * 5. Payment has not been refunded (amount_refunded === 0).
 * 6. Payment belongs to the expected Razorpay Payment Link (short code aGZfHfs or expected ID).
 * 7. Extracts verified customer email and contact directly from Razorpay.
 */
export async function verifyRazorpayPaymentServerSide(params: {
  paymentId: string;
  paymentLinkId?: string;
  paymentLinkReferenceId?: string;
  paymentLinkStatus?: string;
  razorpayOrderId?: string;
  signature?: string;
  expectedAmountPaise?: number; // default: 9900 (₹99)
  expectedCurrency?: string; // default: 'INR'
  expectedShortUrl?: string; // default: 'https://rzp.io/rzp/aGZfHfs'
  customerEmailFallback?: string;
  customerNameFallback?: string;
}): Promise<ServerSidePaymentVerificationResult> {
  const {
    paymentId,
    paymentLinkId,
    paymentLinkReferenceId,
    paymentLinkStatus,
    razorpayOrderId,
    signature,
    expectedAmountPaise = 9900,
    expectedCurrency = 'INR',
    expectedShortUrl = 'https://rzp.io/rzp/aGZfHfs',
    customerEmailFallback,
    customerNameFallback,
  } = params;

  // 1. Validate paymentId parameter format
  if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
    return {
      verified: false,
      httpStatus: 400,
      error: 'MISSING_PAYMENT_ID',
      message: 'A valid Razorpay payment ID is required for verification.',
    };
  }

  const cleanPaymentId = paymentId.trim();

  // Basic sanity check on payment ID format (alphanumeric with prefix like pay_)
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanPaymentId)) {
    return {
      verified: false,
      httpStatus: 400,
      error: 'INVALID_PAYMENT_ID_FORMAT',
      message: 'The provided payment ID contains illegal characters.',
    };
  }

  // 2. Fetch payment entity directly from Razorpay server-to-server API
  const paymentRes = await fetchRazorpayPayment(cleanPaymentId);
  if (!paymentRes.success || !paymentRes.data) {
    return {
      verified: false,
      httpStatus: paymentRes.status || 400,
      error: paymentRes.error || 'PAYMENT_LOOKUP_FAILED',
      message: paymentRes.message || `Payment '${cleanPaymentId}' could not be verified on Razorpay.`,
    };
  }

  const payment = paymentRes.data;

  // 3. Strict Status Verification: Must be 'captured'
  const isCaptured = payment.status === 'captured' && (payment.captured === true || payment.captured === undefined);
  if (!isCaptured) {
    let explanation = `Payment status is '${payment.status}'. Only captured transactions can receive eBook access.`;
    if (payment.status === 'authorized') {
      explanation = 'Payment is currently authorized but not yet captured. Please wait for capture confirmation.';
    } else if (payment.status === 'failed') {
      explanation = `Payment failed on Razorpay: ${payment.error_description || 'Transaction declined.'}`;
    } else if (payment.status === 'refunded') {
      explanation = 'This payment was refunded. Access to the eBook has been revoked.';
    } else if (payment.status === 'created') {
      explanation = 'Payment is pending customer completion and has not been processed.';
    }
    return {
      verified: false,
      httpStatus: 400,
      error: 'PAYMENT_NOT_CAPTURED',
      message: explanation,
      payment,
    };
  }

  // 4. Strict Amount Verification: Must match configured eBook price in paise (9900 = ₹99)
  if (payment.amount !== expectedAmountPaise) {
    return {
      verified: false,
      httpStatus: 400,
      error: 'AMOUNT_MISMATCH',
      message: `Payment amount (${payment.amount} paise) does not match the configured eBook price (${expectedAmountPaise} paise / ₹99).`,
      payment,
    };
  }

  // 5. Strict Currency Verification: Must be INR
  if ((payment.currency || '').toUpperCase() !== expectedCurrency.toUpperCase()) {
    return {
      verified: false,
      httpStatus: 400,
      error: 'CURRENCY_MISMATCH',
      message: `Payment currency '${payment.currency}' does not match expected currency '${expectedCurrency}'.`,
      payment,
    };
  }

  // 6. Refund Verification: Payment must not have been refunded
  if (payment.amount_refunded && payment.amount_refunded > 0) {
    return {
      verified: false,
      httpStatus: 400,
      error: 'PAYMENT_REFUNDED',
      message: `Payment has been partially or fully refunded (${payment.amount_refunded} paise). Access revoked.`,
      payment,
    };
  }

  // 7. Verify Payment Link Association (if paymentLinkId is provided or present in payment record)
  let verifiedPaymentLink: RazorpayPaymentLinkEntity | undefined = undefined;
  const targetPaymentLinkId = paymentLinkId?.trim() || payment.invoice_id || undefined;

  if (targetPaymentLinkId) {
    const linkRes = await fetchRazorpayPaymentLink(targetPaymentLinkId);
    if (!linkRes.success || !linkRes.data) {
      if (paymentLinkId || targetPaymentLinkId.startsWith('plink_')) {
        return {
          verified: false,
          httpStatus: linkRes.status || 400,
          error: linkRes.error || 'PAYMENT_LINK_LOOKUP_FAILED',
          message: linkRes.message || `Payment Link '${targetPaymentLinkId}' could not be verified on Razorpay.`,
          payment,
        };
      }
    } else {
      verifiedPaymentLink = linkRes.data;

      // Check payment link status is 'paid'
      if (verifiedPaymentLink.status && verifiedPaymentLink.status !== 'paid') {
        return {
          verified: false,
          httpStatus: 400,
          error: 'PAYMENT_LINK_NOT_PAID',
          message: `Razorpay Payment Link status is '${verifiedPaymentLink.status}'. Expected 'paid'.`,
          payment,
          paymentLink: verifiedPaymentLink,
        };
      }

      // Check payment link amount
      if (verifiedPaymentLink.amount && verifiedPaymentLink.amount !== expectedAmountPaise) {
        return {
          verified: false,
          httpStatus: 400,
          error: 'PAYMENT_LINK_AMOUNT_MISMATCH',
          message: `Payment Link amount (${verifiedPaymentLink.amount} paise) does not match expected price (${expectedAmountPaise} paise).`,
          payment,
          paymentLink: verifiedPaymentLink,
        };
      }

      // Check short URL matches official short URL only for Payment Link entities (not underlying inv_ invoices whose short_url is /i/...)
      const isPaymentLinkEntity =
        verifiedPaymentLink.entity === 'payment_link' ||
        targetPaymentLinkId.startsWith('plink_') ||
        Boolean(verifiedPaymentLink.short_url && verifiedPaymentLink.short_url.includes('/rzp/'));

      if (verifiedPaymentLink.short_url && isPaymentLinkEntity) {
        const expectedCode = expectedShortUrl.split('/').pop() || 'aGZfHfs';
        const matchesShortUrl =
          verifiedPaymentLink.short_url.includes(expectedCode) ||
          verifiedPaymentLink.short_url === expectedShortUrl;

        if (!matchesShortUrl) {
          console.warn(`[PaymentVerifier] Payment Link short_url mismatch: ${verifiedPaymentLink.short_url}`);
          return {
            verified: false,
            httpStatus: 400,
            error: 'PAYMENT_LINK_UNAUTHORIZED',
            message: 'Payment Link does not correspond to the official Digital Govind Handbook checkout.',
            payment,
            paymentLink: verifiedPaymentLink,
          };
        }
      }

      // Check that payment ID is associated with this payment link
      if (verifiedPaymentLink.payments && verifiedPaymentLink.payments.length > 0) {
        const hasPayment = verifiedPaymentLink.payments.some((p) => p.payment_id === cleanPaymentId);
        if (!hasPayment && payment.invoice_id !== targetPaymentLinkId) {
          return {
            verified: false,
            httpStatus: 400,
            error: 'PAYMENT_LINK_ASSOCIATION_MISMATCH',
            message: `Payment ID '${cleanPaymentId}' is not associated with Payment Link '${targetPaymentLinkId}'.`,
            payment,
            paymentLink: verifiedPaymentLink,
          };
        }
      }
    }
  }

  // 8. Cryptographic Signature check (if signature provided in callback)
  if (signature) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const { keySecret } = getRazorpayCredentials();
    const secretsToTry = [keySecret, webhookSecret].filter(Boolean) as string[];

    if (secretsToTry.length > 0) {
      const refId = paymentLinkReferenceId ?? verifiedPaymentLink?.reference_id ?? '';
      const linkStatus = paymentLinkStatus || verifiedPaymentLink?.status || 'paid';
      const payloadCandidates = [
        // Official Razorpay Payment Link callback signature format
        `${targetPaymentLinkId || ''}|${refId}|${linkStatus}|${cleanPaymentId}`,
        // Standard Checkout order signature format
        `${razorpayOrderId || payment.order_id || ''}|${cleanPaymentId}`,
        // Short fallback format
        `${targetPaymentLinkId || ''}|${cleanPaymentId}`,
      ].filter((candidate) => candidate.replace(/\|/g, '') !== '');

      let signatureMatched = false;
      for (const sec of secretsToTry) {
        if (payloadCandidates.some((cand) => verifyRazorpayWebhookSignature(cand, signature, sec))) {
          signatureMatched = true;
          break;
        }
      }

      if (!signatureMatched) {
        console.warn(`[PaymentVerifier] Signature provided for payment '${cleanPaymentId}' failed verification.`);
        return {
          verified: false,
          httpStatus: 400,
          error: 'INVALID_SIGNATURE',
          message: 'Razorpay callback signature verification failed.',
          payment,
        };
      }
    }
  }

  // 9. Extract authoritative customer details from verified Razorpay records (ignoring void@razorpay.com placeholder)
  const emailCandidates = [
    payment.email,
    verifiedPaymentLink?.customer?.email,
    payment.notes?.email,
    payment.notes?.customer_email,
    customerEmailFallback,
  ];
  const customerEmail = emailCandidates.find((candidate) => isRealCustomerEmail(candidate)) || '';

  if (!customerEmail) {
    return {
      verified: false,
      httpStatus: 400,
      error: 'MISSING_CUSTOMER_EMAIL',
      message: 'Customer email could not be retrieved from the verified Razorpay payment.',
      payment,
    };
  }

  const customerPhone =
    payment.contact ||
    verifiedPaymentLink?.customer?.contact ||
    payment.notes?.phone ||
    '';

  const customerName =
    verifiedPaymentLink?.customer?.name ||
    payment.notes?.name ||
    payment.description ||
    customerNameFallback ||
    'Valued Reader';

  const orderId =
    (targetPaymentLinkId && targetPaymentLinkId.startsWith('plink_') ? targetPaymentLinkId : undefined) ||
    payment.order_id ||
    payment.invoice_id ||
    `ORD-${cleanPaymentId.replace(/^pay_/, '').toUpperCase()}`;

  return {
    verified: true,
    httpStatus: 200,
    payment,
    paymentLink: verifiedPaymentLink,
    orderId,
    customerEmail: customerEmail.toLowerCase().trim(),
    customerPhone: customerPhone.trim(),
    customerName: customerName.trim(),
  };
}

/**
 * Checks whether an email value is a real customer email (ignores Razorpay's void@razorpay.com placeholder)
 */
export function isRealCustomerEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return false;
  if (normalized === 'void@razorpay.com') return false;
  return true;
}

/**
 * Extracts all candidate real emails stored on a Razorpay payment entity
 */
function extractPaymentEmails(payment: RazorpayPaymentEntity): string[] {
  const raw = [
    payment.email,
    payment.notes?.email,
    payment.notes?.customer_email,
    payment.notes?.buyer_email,
  ];
  return raw
    .filter((v): v is string => isRealCustomerEmail(v))
    .map((v) => v.trim().toLowerCase());
}

/**
 * Fetch a page of payments from Razorpay API (GET /v1/payments)
 */
export async function fetchRazorpayPaymentsPage(params: {
  count?: number;
  skip?: number;
} = {}): Promise<{
  success: boolean;
  items?: RazorpayPaymentEntity[];
  status?: number;
  error?: string;
  message?: string;
}> {
  const count = Math.min(Math.max(params.count ?? 100, 1), 100);
  const skip = Math.max(params.skip ?? 0, 0);

  if (mockPayments.size > 0) {
    const all = Array.from(mockPayments.values()).reverse();
    return {
      success: true,
      items: all.slice(skip, skip + count),
      status: 200,
    };
  }

  const { keyId, keySecret, isConfigured } = getRazorpayCredentials();
  if (!isConfigured) {
    return {
      success: false,
      status: 500,
      error: 'CREDENTIALS_MISSING',
      message: 'Razorpay API credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured on the server.',
    };
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const url = `https://api.razorpay.com/v1/payments?count=${count}&skip=${skip}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json().catch(() => ({}));
    if (response.status === 401) {
      return {
        success: false,
        status: 500,
        error: 'AUTH_FAILED',
        message: 'Invalid Razorpay API credentials.',
      };
    }
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: json.error?.code || 'RAZORPAY_API_ERROR',
        message: json.error?.description || `Razorpay API error (HTTP ${response.status})`,
      };
    }

    const items = Array.isArray(json.items) ? (json.items as RazorpayPaymentEntity[]) : [];
    return { success: true, items, status: 200 };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      error: 'NETWORK_ERROR',
      message: `Failed to query Razorpay Payments API: ${err.message}`,
    };
  }
}

/**
 * Fetch payments associated with a Razorpay Order ID (GET /v1/orders/:orderId/payments)
 */
export async function fetchRazorpayOrderPayments(razorpayOrderId: string): Promise<{
  success: boolean;
  items?: RazorpayPaymentEntity[];
  status?: number;
  error?: string;
  message?: string;
}> {
  const cleanOrderId = (razorpayOrderId || '').trim();
  if (!cleanOrderId) {
    return { success: false, status: 400, error: 'MISSING_ORDER_ID', message: 'Order ID is required.' };
  }

  if (mockPayments.size > 0) {
    const matched = Array.from(mockPayments.values()).filter((p) => p.order_id === cleanOrderId);
    return { success: true, items: matched, status: 200 };
  }

  const { keyId, keySecret, isConfigured } = getRazorpayCredentials();
  if (!isConfigured) {
    return {
      success: false,
      status: 500,
      error: 'CREDENTIALS_MISSING',
      message: 'Razorpay API credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured on the server.',
    };
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const url = `https://api.razorpay.com/v1/orders/${encodeURIComponent(cleanOrderId)}/payments`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });
    const json = await response.json().catch(() => ({}));
    if (response.status === 401) {
      return { success: false, status: 500, error: 'AUTH_FAILED', message: 'Invalid Razorpay API credentials.' };
    }
    if (!response.ok) {
      return {
        success: false,
        status: response.status === 400 ? 404 : response.status,
        error: json.error?.code || 'ORDER_LOOKUP_FAILED',
        message: json.error?.description || `Order '${cleanOrderId}' not found on Razorpay.`,
      };
    }

    const items = Array.isArray(json.items) ? (json.items as RazorpayPaymentEntity[]) : [];
    return { success: true, items, status: 200 };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      error: 'NETWORK_ERROR',
      message: `Failed to query Razorpay Order Payments API: ${err.message}`,
    };
  }
}

/**
 * Find and verify a real captured ₹99 INR payment on Razorpay matching a customer email.
 * Never creates fake records or bypasses capture/amount/currency/refund checks.
 */
export async function findVerifiedPaymentByEmailServerSide(params: {
  email: string;
  expectedAmountPaise?: number;
  expectedCurrency?: string;
  expectedShortUrl?: string;
  maxPagesToScan?: number;
}): Promise<ServerSidePaymentVerificationResult> {
  const cleanEmail = (params.email || '').trim().toLowerCase();
  if (!isRealCustomerEmail(cleanEmail)) {
    return {
      verified: false,
      httpStatus: 400,
      error: 'INVALID_EMAIL',
      message: 'A valid customer email address is required.',
    };
  }

  const expectedAmountPaise = params.expectedAmountPaise ?? 9900;
  const expectedCurrency = (params.expectedCurrency ?? 'INR').toUpperCase();
  const expectedShortUrl = params.expectedShortUrl ?? 'https://rzp.io/rzp/aGZfHfs';
  const maxPages = params.maxPagesToScan ?? 5;
  const pageSize = 100;

  for (let page = 0; page < maxPages; page++) {
    const pageRes = await fetchRazorpayPaymentsPage({ count: pageSize, skip: page * pageSize });
    if (!pageRes.success) {
      return {
        verified: false,
        httpStatus: pageRes.status || 500,
        error: pageRes.error || 'RAZORPAY_LOOKUP_FAILED',
        message: pageRes.message || 'Unable to query Razorpay payments.',
      };
    }

    const items = pageRes.items || [];
    for (const payment of items) {
      const isCaptured =
        payment.status === 'captured' && (payment.captured === true || payment.captured === undefined);
      const isNotRefunded = !payment.amount_refunded || payment.amount_refunded === 0;
      const matchesAmountAndCurrency =
        payment.amount === expectedAmountPaise &&
        (payment.currency || '').toUpperCase() === expectedCurrency;

      if (!isCaptured || !isNotRefunded || !matchesAmountAndCurrency) {
        continue;
      }

      const emailsOnPayment = extractPaymentEmails(payment);
      let emailMatched = emailsOnPayment.includes(cleanEmail);

      // If email is not directly on payment, check linked Payment Link customer record when invoice_id starts with plink_
      if (!emailMatched && payment.invoice_id && payment.invoice_id.startsWith('plink_')) {
        const linkRes = await fetchRazorpayPaymentLink(payment.invoice_id);
        if (linkRes.success && linkRes.data?.customer?.email) {
          emailMatched = linkRes.data.customer.email.trim().toLowerCase() === cleanEmail;
        }
      }

      if (!emailMatched) {
        continue;
      }

      const verified = await verifyRazorpayPaymentServerSide({
        paymentId: payment.id,
        paymentLinkId: payment.invoice_id?.startsWith('plink_') ? payment.invoice_id : undefined,
        expectedAmountPaise,
        expectedCurrency,
        expectedShortUrl,
      });

      if (verified.verified) {
        return verified;
      }
    }

    if (items.length < pageSize) {
      break;
    }
  }

  return {
    verified: false,
    httpStatus: 404,
    error: 'PAYMENT_NOT_FOUND_FOR_EMAIL',
    message: 'No captured ₹99 Razorpay payment was found for this email address. If you paid via UPI without entering your email at checkout, please also enter your Razorpay Payment ID (pay_...).',
  };
}

/**
 * Find and verify a real captured ₹99 INR payment from a Razorpay Order ID (order_...),
 * Payment Link ID (plink_...), or Handbook Order ID (ORD-...).
 */
export async function findVerifiedPaymentByOrderOrLinkIdServerSide(params: {
  identifier: string;
  customerEmailFallback?: string;
  expectedAmountPaise?: number;
  expectedCurrency?: string;
  expectedShortUrl?: string;
}): Promise<ServerSidePaymentVerificationResult> {
  const cleanId = (params.identifier || '').trim();
  const expectedAmountPaise = params.expectedAmountPaise ?? 9900;
  const expectedCurrency = (params.expectedCurrency ?? 'INR').toUpperCase();
  const expectedShortUrl = params.expectedShortUrl ?? 'https://rzp.io/rzp/aGZfHfs';

  if (!cleanId) {
    return {
      verified: false,
      httpStatus: 400,
      error: 'MISSING_ORDER_ID',
      message: 'A valid Razorpay Order ID, Payment Link ID, or Payment ID is required.',
    };
  }

  // 1. Direct pay_ ID
  if (cleanId.startsWith('pay_')) {
    return verifyRazorpayPaymentServerSide({
      paymentId: cleanId,
      expectedAmountPaise,
      expectedCurrency,
      expectedShortUrl,
      customerEmailFallback: params.customerEmailFallback,
    });
  }

  // 2. Razorpay Order ID (order_...)
  if (cleanId.startsWith('order_')) {
    const orderRes = await fetchRazorpayOrderPayments(cleanId);
    if (!orderRes.success) {
      return {
        verified: false,
        httpStatus: orderRes.status || 404,
        error: orderRes.error || 'ORDER_LOOKUP_FAILED',
        message: orderRes.message || `Order '${cleanId}' could not be retrieved from Razorpay.`,
      };
    }
    const items = orderRes.items || [];
    const captured =
      items.find(
        (p) =>
          p.status === 'captured' &&
          p.amount === expectedAmountPaise &&
          (p.currency || '').toUpperCase() === expectedCurrency &&
          (!p.amount_refunded || p.amount_refunded === 0)
      ) || items[0];

    if (!captured) {
      return {
        verified: false,
        httpStatus: 404,
        error: 'NO_PAYMENT_FOR_ORDER',
        message: `No captured payment found for Razorpay Order '${cleanId}'.`,
      };
    }

    return verifyRazorpayPaymentServerSide({
      paymentId: captured.id,
      expectedAmountPaise,
      expectedCurrency,
      expectedShortUrl,
      customerEmailFallback: params.customerEmailFallback,
    });
  }

  // 3. Razorpay Payment Link ID (plink_...)
  if (cleanId.startsWith('plink_')) {
    const linkRes = await fetchRazorpayPaymentLink(cleanId);
    if (!linkRes.success || !linkRes.data) {
      return {
        verified: false,
        httpStatus: linkRes.status || 404,
        error: linkRes.error || 'PAYMENT_LINK_LOOKUP_FAILED',
        message: linkRes.message || `Payment Link '${cleanId}' was not found on Razorpay.`,
      };
    }

    const paidEntry =
      linkRes.data.payments?.find((p) => p.status === 'captured') || linkRes.data.payments?.[0];
    if (paidEntry?.payment_id) {
      return verifyRazorpayPaymentServerSide({
        paymentId: paidEntry.payment_id,
        paymentLinkId: cleanId,
        expectedAmountPaise,
        expectedCurrency,
        expectedShortUrl,
        customerEmailFallback: params.customerEmailFallback,
      });
    }

    if (linkRes.data.order_id) {
      return findVerifiedPaymentByOrderOrLinkIdServerSide({
        identifier: linkRes.data.order_id,
        customerEmailFallback: params.customerEmailFallback,
        expectedAmountPaise,
        expectedCurrency,
        expectedShortUrl,
      });
    }

    return {
      verified: false,
      httpStatus: 400,
      error: 'PAYMENT_LINK_NOT_PAID',
      message: `No captured payment found on Payment Link '${cleanId}'.`,
    };
  }

  // 4. Generated Handbook Order ID (ORD-...) -> scan recent Razorpay payments matching pay_<suffix>
  if (cleanId.toUpperCase().startsWith('ORD-')) {
    const suffixLower = cleanId.slice(4).toLowerCase();
    const pageRes = await fetchRazorpayPaymentsPage({ count: 100, skip: 0 });
    if (!pageRes.success) {
      return {
        verified: false,
        httpStatus: pageRes.status || 500,
        error: pageRes.error || 'RAZORPAY_LOOKUP_FAILED',
        message: pageRes.message || 'Unable to query Razorpay payments.',
      };
    }

    const matched = (pageRes.items || []).find(
      (p) => p.id.replace(/^pay_/, '').toLowerCase() === suffixLower || p.order_id === cleanId
    );
    if (matched) {
      return verifyRazorpayPaymentServerSide({
        paymentId: matched.id,
        expectedAmountPaise,
        expectedCurrency,
        expectedShortUrl,
        customerEmailFallback: params.customerEmailFallback,
      });
    }
  }

  return {
    verified: false,
    httpStatus: 404,
    error: 'ORDER_NOT_FOUND',
    message: `No verified Razorpay transaction found for '${cleanId}'. Please check your Payment ID (pay_...) or Order ID (order_...).`,
  };
}

/**
 * Verify Razorpay Webhook HMAC-SHA256 Signature
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined | null,
  webhookSecret: string | undefined
): boolean {
  if (!signatureHeader) {
    return false;
  }

  if (!webhookSecret || webhookSecret.trim() === '') {
    return false;
  }

  try {
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret.trim())
      .update(bodyStr)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signatureHeader.trim(), 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (err) {
    console.error('[RazorpayVerifier] Signature comparison error:', err);
    return false;
  }
}

/**
 * Parse and Validate Razorpay Webhook Payload
 */
export function extractAndValidateWebhookEvent(
  eventPayload: any,
  options: {
    expectedAmountPaise?: number; // defaults to 9900 (₹99)
    strictAmountCheck?: boolean;
  } = {}
): WebhookVerificationResult {
  const { expectedAmountPaise = 9900, strictAmountCheck = false } = options;

  if (!eventPayload || typeof eventPayload !== 'object') {
    return { isValid: false, error: 'Malformed or empty webhook JSON payload' };
  }

  const eventType = eventPayload.event;
  const payload = eventPayload.payload || {};

  const paymentEntity = payload.payment?.entity;
  const paymentLinkEntity = payload.payment_link?.entity;
  const orderEntity = payload.order?.entity;

  // We accept payment_link.paid, payment.captured, or order.paid
  const acceptedEvents = ['payment_link.paid', 'payment.captured', 'order.paid'];
  if (!acceptedEvents.includes(eventType)) {
    return {
      isValid: false,
      error: `Ignored event type: ${eventType}. Expected one of: ${acceptedEvents.join(', ')}`,
    };
  }

  // Extract payment details
  const paymentId = paymentEntity?.id;
  if (!paymentId || typeof paymentId !== 'string') {
    return {
      isValid: false,
      error: 'Payment ID missing from webhook payload',
    };
  }

  const orderId =
    paymentLinkEntity?.id ||
    orderEntity?.id ||
    paymentEntity?.order_id ||
    `ord_${paymentId}`;

  // Extract customer information (ignore Razorpay void@razorpay.com placeholder)
  const webhookEmailCandidates = [
    paymentEntity?.email,
    paymentLinkEntity?.customer?.email,
    paymentEntity?.notes?.email,
    paymentEntity?.notes?.customer_email,
    paymentEntity?.notes?.buyer_email,
  ];
  const customerEmail =
    webhookEmailCandidates.find((candidate) => isRealCustomerEmail(candidate))?.trim().toLowerCase() || '';

  const customerPhone =
    paymentEntity?.contact ||
    paymentLinkEntity?.customer?.contact ||
    paymentEntity?.notes?.phone ||
    '';

  const customerName =
    paymentLinkEntity?.customer?.name ||
    paymentEntity?.notes?.name ||
    'Valued Customer';

  const amount = paymentEntity?.amount ?? paymentLinkEntity?.amount ?? 0;
  const currency = paymentEntity?.currency || paymentLinkEntity?.currency || 'INR';
  const status = paymentEntity?.status || paymentLinkEntity?.status || 'paid';
  const method = paymentEntity?.method;

  if (paymentEntity?.status && paymentEntity.status !== 'captured') {
    return {
      isValid: false,
      error: `Payment status is '${paymentEntity.status}', expected 'captured'`,
    };
  }

  if (currency.toUpperCase() !== 'INR') {
    return {
      isValid: false,
      error: `Currency mismatch: Received '${currency}', expected 'INR'`,
    };
  }

  if (strictAmountCheck && amount !== expectedAmountPaise) {
    return {
      isValid: false,
      error: `Amount mismatch: Received ${amount} paise, expected ${expectedAmountPaise} paise (₹99)`,
    };
  }

  if (!isRealCustomerEmail(customerEmail)) {
    return {
      isValid: false,
      error: 'Customer email not found in payment payload',
    };
  }

  return {
    isValid: true,
    details: {
      orderId,
      paymentId,
      customerEmail,
      customerPhone,
      customerName,
      amount,
      currency,
      status,
      method,
    },
  };
}
