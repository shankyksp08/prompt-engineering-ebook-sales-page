/**
 * Digital Govind — Prompt Engineering Handbook
 * POST /api/razorpay-webhook
 * 
 * Secure Webhook Endpoint for Razorpay Payment Notifications:
 * 1. Validates HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET.
 * 2. Parses event ('payment_link.paid', 'payment.captured', 'order.paid').
 * 3. Enforces idempotency to block duplicate webhooks and multiple emails/SMS.
 * 4. Automatically dispatches customer thank-you email (Resend/SendGrid) and SMS (MSG91/Twilio).
 */

import {
  verifyRazorpayWebhookSignature,
  extractAndValidateWebhookEvent,
} from '../src/server/razorpay/paymentVerifier.ts';
import {
  dispatchPurchaseNotifications,
  notificationStore,
} from '../src/server/notifications/notificationService.ts';
import { generateLicenseToken } from '../src/server/auth/licenseVerifier.ts';
import { orderFulfillmentStore } from '../src/server/razorpay/orderStore.ts';

// Preserve raw request stream on Vercel so Razorpay HMAC-SHA256 signature verification matches exact bytes
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to extract exact raw body string from various request representations
async function getRawBody(req: any): Promise<string> {
  if (req.rawBody && typeof req.rawBody === 'string') {
    return req.rawBody;
  }
  if (Buffer.isBuffer(req.rawBody)) {
    return req.rawBody.toString('utf8');
  }
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  if (typeof req.body === 'string') {
    return req.body;
  }

  // Stream reader for standard Node / Vercel bodyParser:false requests
  if (req.readable !== false && typeof req.on === 'function') {
    const chunks: Buffer[] = [];
    const rawFromStream = await new Promise<string>((resolve, reject) => {
      req.on('data', (chunk: any) => {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk);
      });
      req.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      req.on('error', (err: any) => reject(err));
    });
    if (rawFromStream) {
      return rawFromStream;
    }
  }

  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body);
  }

  return '';
}

export default async function handler(req: any, res: any) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'Method Not Allowed. Razorpay webhooks require POST.',
    });
  }

  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured. Rejecting unverified webhook.');
      return res.status(500).json({
        error: 'Webhook verification secret is not configured on the server.',
      });
    }

    const rawBody = await getRawBody(req);
    const signatureHeader = req.headers['x-razorpay-signature'] || req.headers['X-Razorpay-Signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

    const isValidSig = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValidSig) {
      console.warn('[Webhook] Invalid or missing Razorpay signature received.');
      return res.status(401).json({
        error: 'Invalid signature verification failed',
      });
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const validated = extractAndValidateWebhookEvent(payload, {
      expectedAmountPaise: 9900,
      strictAmountCheck: true,
    });

    if (!validated.isValid || !validated.details) {
      console.log(`[Webhook] Ignored event or invalid payload: ${validated.error}`);
      return res.status(200).json({
        received: true,
        processed: false,
        reason: validated.error,
      });
    }

    const {
      orderId,
      paymentId,
      customerEmail,
      customerPhone,
      customerName,
      amount,
    } = validated.details;

    // Check if already processed (Idempotency)
    if (notificationStore.has(orderId, paymentId)) {
      const existing = notificationStore.get(orderId, paymentId)!;
      console.log(`[Webhook] Duplicate webhook received for order ${orderId}. Skipping notification dispatch.`);
      return res.status(200).json({
        received: true,
        processed: false,
        duplicate: true,
        message: 'Notification already dispatched for this order',
        orderId,
        paymentId,
      });
    }

    // Dispatch thank-you notifications (Email & SMS)
    const result = await dispatchPurchaseNotifications({
      orderId,
      paymentId,
      customerEmail,
      customerPhone,
      customerName,
      amountPaise: amount,
    });

    console.log(`[Webhook] Notification dispatched successfully:`, {
      orderId,
      paymentId,
      emailSent: result.email.sent,
      emailProvider: result.email.provider,
      smsSent: result.sms.sent,
      smsProvider: result.sms.provider,
    });

    // Register in orderFulfillmentStore if not already present
    if (!orderFulfillmentStore.hasPayment(paymentId)) {
      const token = generateLicenseToken({
        orderId,
        customerEmail,
        paymentId,
        expiresInDays: 365,
      });

      const license = {
        orderId,
        paymentId,
        customerEmail,
        customerName: customerName || 'Valued Reader',
        customerPhone: customerPhone || undefined,
        amount: '₹99',
        currency: 'INR',
        verifiedAt: Date.now(),
        token,
        status: 'active' as const,
        maxDevices: 2,
        readerStreamUrl: `/api/reader/stream-pdf`,
      };

      orderFulfillmentStore.set({
        orderId,
        paymentId,
        customerEmail,
        customerName: customerName || 'Valued Reader',
        customerPhone: customerPhone || undefined,
        amountPaise: amount,
        amountFormatted: '₹99',
        currency: 'INR',
        verifiedAt: Date.now(),
        licenseToken: token,
        license,
        status: 'fulfilled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      received: true,
      processed: true,
      orderId,
      paymentId,
      notifications: result,
    });
  } catch (err: any) {
    console.error('[Webhook] Unhandled error processing webhook:', err);
    return res.status(500).json({
      error: 'Internal server error processing webhook',
      message: err.message,
    });
  }
}
