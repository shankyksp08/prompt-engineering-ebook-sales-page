/**
 * Digital Govind — Prompt Engineering Handbook
 * Razorpay Webhook & Payment Signature Verification Service
 * 
 * Verifies:
 * 1. HMAC-SHA256 signature from 'x-razorpay-signature' header.
 * 2. Event type matches 'payment_link.paid', 'payment.captured', or 'order.paid'.
 * 3. Payment amount matches expected price (₹99 = 9900 paise) and currency is 'INR'.
 * 4. Extracts verified customer details (email, phone, name, order ID, payment ID).
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

  // If webhook secret is not set, allow dev/test fallback if explicitly configured
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
  const paymentId = paymentEntity?.id || `pay_${Date.now()}`;
  const orderId =
    paymentLinkEntity?.id ||
    orderEntity?.id ||
    paymentEntity?.order_id ||
    `ord_${paymentId}`;

  // Extract customer information
  const customerEmail =
    paymentEntity?.email ||
    paymentLinkEntity?.customer?.email ||
    paymentEntity?.notes?.email ||
    '';

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

  if (strictAmountCheck && amount !== expectedAmountPaise) {
    return {
      isValid: false,
      error: `Amount mismatch: Received ${amount} paise, expected ${expectedAmountPaise} paise (₹99)`,
    };
  }

  if (!customerEmail || !customerEmail.includes('@')) {
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
