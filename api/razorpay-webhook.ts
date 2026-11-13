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

// Helper to extract raw body buffer from various request representations
async function getRawBody(req: any): Promise<string> {
  if (typeof req.body === 'string') {
    return req.body;
  }
  if (req.rawBody && typeof req.rawBody === 'string') {
    return req.rawBody;
  }
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body);
  }

  // Stream reader for standard Node / Express req
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', (err: any) => reject(err));
  });
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
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-razorpay-signature'] || req.headers['X-Razorpay-Signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret && webhookSecret.trim() !== '') {
      const isValidSig = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValidSig) {
        console.warn('[Webhook] Invalid Razorpay signature received.');
        return res.status(401).json({
          error: 'Invalid signature verification failed',
        });
      }
    } else {
      console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET not configured. Running in unverified development mode.');
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const validated = extractAndValidateWebhookEvent(payload);

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
        downloadUrl: `/api/download-ebook?token=${encodeURIComponent(token)}&orderId=${encodeURIComponent(orderId)}`,
        readerStreamUrl: `/api/stream-pdf?token=${encodeURIComponent(token)}&orderId=${encodeURIComponent(orderId)}`,
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
