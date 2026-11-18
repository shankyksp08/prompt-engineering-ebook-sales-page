/**
 * Digital Govind — Prompt Engineering Handbook
 * /api/verify-payment
 * 
 * Secure Server-Side Payment & License Verification Endpoint:
 * - GET: Check verification, order fulfillment, and notification status by orderId or paymentId.
 * - POST: Strictly performs server-to-server verification with Razorpay's authenticated API:
 *   1. NEVER trusts client-submitted status strings (e.g. razorpay_payment_link_status=paid).
 *   2. NEVER issues a license based solely on a client-submitted payment ID.
 *   3. Queries GET /v1/payments/:id via authenticated Basic Auth (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET).
 *   4. Verifies payment exists, status is strictly 'captured', amount is 9900 paise (₹99), and currency is 'INR'.
 *   5. Verifies Payment Link binding against the official checkout (https://rzp.io/rzp/aGZfHfs).
 *   6. Verifies transaction has not been refunded.
 *   7. Idempotent: repeated requests return the existing authorized order and license without duplicates.
 *   8. Automatically triggers customer thank-you email and SMS upon successful fulfillment.
 */

import { generateLicenseToken } from '../src/server/auth/licenseVerifier.ts';
import {
  verifyRazorpayPaymentServerSide,
  findVerifiedPaymentByEmailServerSide,
  findVerifiedPaymentByOrderOrLinkIdServerSide,
  isRealCustomerEmail,
  getRazorpayCredentials,
} from '../src/server/razorpay/paymentVerifier.ts';
import { orderFulfillmentStore } from '../src/server/razorpay/orderStore.ts';
import type {
  OrderRecord,
  CustomerLicensePayload,
} from '../src/server/razorpay/orderStore.ts';
import {
  dispatchPurchaseNotifications,
  notificationStore,
} from '../src/server/notifications/notificationService.ts';

export default async function handler(req: any, res: any) {
  // ---------------------------------------------------------------------------
  // GET: Order Status and Fulfillment Lookup
  // ---------------------------------------------------------------------------
  if (req.method === 'GET') {
    const { orderId, paymentId, email } = req.query || {};
    const cleanOrderId = typeof orderId === 'string' ? orderId.trim() : '';
    const cleanPaymentId = typeof paymentId === 'string' ? paymentId.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanOrderId && !cleanPaymentId && !cleanEmail) {
      return res.status(400).json({
        verified: false,
        error: 'Missing Query Parameters',
        message: 'Either orderId, paymentId, or email is required to query order status.',
      });
    }

    // 1. Check server-side order fulfillment store
    let order: OrderRecord | undefined = undefined;
    if (cleanPaymentId) {
      order = orderFulfillmentStore.getByPaymentId(cleanPaymentId);
    }
    if (!order && cleanOrderId) {
      order = orderFulfillmentStore.getByOrderId(cleanOrderId);
    }
    if (!order && cleanEmail) {
      order = orderFulfillmentStore.getByEmail(cleanEmail);
    }

    if (order) {
      if (order.status === 'revoked' || order.status === 'refunded') {
        return res.status(403).json({
          verified: false,
          error: 'Order Revoked',
          message: 'Access has been revoked or refunded for this transaction.',
        });
      }

      if (
        cleanEmail &&
        isRealCustomerEmail(order.customerEmail) &&
        order.customerEmail.toLowerCase() !== cleanEmail
      ) {
        return res.status(403).json({
          verified: false,
          error: 'Email Mismatch',
          message: 'The email address does not match the customer email on this order.',
        });
      }

      const notifRecord = notificationStore.get(order.orderId, order.paymentId);
      return res.status(200).json({
        verified: true,
        orderId: order.orderId,
        paymentId: order.paymentId,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        customerPhone: order.customerPhone || null,
        amount: order.amountFormatted,
        currency: order.currency,
        status: order.status,
        verifiedAt: order.verifiedAt,
        license: order.license,
        notifications: notifRecord
          ? {
              emailSent: notifRecord.result.email.sent,
              emailProvider: notifRecord.result.email.provider,
              smsSent: notifRecord.result.sms.sent,
              smsProvider: notifRecord.result.sms.provider,
              timestamp: notifRecord.result.timestamp,
            }
          : null,
      });
    }

    // 2. Check notification store fallback
    const legacyRecord = notificationStore.get(cleanOrderId || '', cleanPaymentId || '');
    if (legacyRecord) {
      return res.status(200).json({
        verified: true,
        orderId: legacyRecord.orderId,
        paymentId: legacyRecord.paymentId,
        customerEmail: legacyRecord.customerEmail,
        customerName: legacyRecord.customerName,
        status: 'fulfilled',
        notifications: {
          emailSent: legacyRecord.result.email.sent,
          emailProvider: legacyRecord.result.email.provider,
          smsSent: legacyRecord.result.sms.sent,
          smsProvider: legacyRecord.result.sms.provider,
          timestamp: legacyRecord.result.timestamp,
        },
      });
    }

    // 3. Stateless serverless fallback: query Razorpay API directly if credentials are configured
    const lookupIdentifier = cleanPaymentId || cleanOrderId;
    if (lookupIdentifier && getRazorpayCredentials().isConfigured) {
      const liveResult = await findVerifiedPaymentByOrderOrLinkIdServerSide({
        identifier: lookupIdentifier,
        customerEmailFallback: cleanEmail || undefined,
      });

      if (liveResult.verified && liveResult.payment) {
        const verifiedEmail = liveResult.customerEmail!;
        if (!cleanEmail || verifiedEmail.toLowerCase() === cleanEmail) {
          const verifiedName = liveResult.customerName || 'Valued Reader';
          const verifiedPhone = liveResult.customerPhone || '';
          const resolvedOrderId = liveResult.orderId!;
          const verifiedAt = Date.now();
          const token = generateLicenseToken({
            orderId: resolvedOrderId,
            customerEmail: verifiedEmail,
            paymentId: liveResult.payment.id,
            expiresInDays: 365,
          });
          const license: CustomerLicensePayload = {
            orderId: resolvedOrderId,
            paymentId: liveResult.payment.id,
            customerEmail: verifiedEmail,
            customerName: verifiedName,
            customerPhone: verifiedPhone || undefined,
            amount: '₹99',
            currency: liveResult.payment.currency || 'INR',
            verifiedAt,
            token,
            status: 'active',
            maxDevices: 2,
            downloadUrl: `/api/download-ebook?token=${encodeURIComponent(token)}&orderId=${encodeURIComponent(resolvedOrderId)}`,
            readerStreamUrl: `/api/stream-pdf?token=${encodeURIComponent(token)}&orderId=${encodeURIComponent(resolvedOrderId)}`,
          };
          orderFulfillmentStore.set({
            orderId: resolvedOrderId,
            paymentId: liveResult.payment.id,
            paymentLinkId: liveResult.paymentLink?.id,
            customerEmail: verifiedEmail,
            customerName: verifiedName,
            customerPhone: verifiedPhone || undefined,
            amountPaise: liveResult.payment.amount,
            amountFormatted: '₹99',
            currency: liveResult.payment.currency || 'INR',
            verifiedAt,
            licenseToken: token,
            license,
            status: 'fulfilled',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          return res.status(200).json({
            verified: true,
            orderId: resolvedOrderId,
            paymentId: liveResult.payment.id,
            customerEmail: verifiedEmail,
            customerName: verifiedName,
            customerPhone: verifiedPhone || null,
            amount: '₹99',
            currency: liveResult.payment.currency || 'INR',
            status: 'fulfilled',
            verifiedAt,
            license,
            notifications: null,
          });
        }
      }
    }

    return res.status(200).json({
      verified: false,
      message: 'No verified payment record found for the provided identifier.',
      orderId: cleanOrderId || null,
      paymentId: cleanPaymentId || null,
    });
  }

  // ---------------------------------------------------------------------------
  // POST: Authenticate Payment via Server-to-Server Razorpay API
  // ---------------------------------------------------------------------------
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const {
        paymentId,
        paymentLinkId,
        paymentLinkReferenceId,
        orderId: razorpayOrderId,
        status: paymentLinkStatus,
        signature,
        email,
        customerName,
      } = body;

      const cleanPaymentId = typeof paymentId === 'string' ? paymentId.trim() : '';
      const cleanPaymentLinkId = typeof paymentLinkId === 'string' ? paymentLinkId.trim() : '';
      const cleanOrderId = typeof razorpayOrderId === 'string' ? razorpayOrderId.trim() : '';
      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

      // 1. Require a payment/order/link identifier OR a valid customer email for lookup
      if (!cleanPaymentId && !cleanOrderId && !cleanPaymentLinkId && !cleanEmail) {
        return res.status(400).json({
          verified: false,
          error: 'Missing Payment ID',
          message: 'A valid Razorpay payment ID, order ID, or customer email is required.',
        });
      }

      // 2. Check Idempotency / In-Memory Store first
      let existingOrder: OrderRecord | undefined = undefined;
      if (cleanPaymentId) {
        existingOrder = orderFulfillmentStore.getByPaymentId(cleanPaymentId);
      } else if (cleanOrderId) {
        existingOrder = orderFulfillmentStore.getByOrderId(cleanOrderId);
      } else if (cleanPaymentLinkId) {
        existingOrder = orderFulfillmentStore.getByOrderId(cleanPaymentLinkId);
      } else if (cleanEmail) {
        existingOrder = orderFulfillmentStore.getByEmail(cleanEmail);
      }

      if (existingOrder) {
        if (existingOrder.status === 'revoked' || existingOrder.status === 'refunded') {
          return res.status(403).json({
            verified: false,
            error: 'Order Revoked',
            message: 'Access has been revoked or refunded for this transaction.',
          });
        }

        if (
          cleanEmail &&
          isRealCustomerEmail(existingOrder.customerEmail) &&
          existingOrder.customerEmail.toLowerCase() !== cleanEmail
        ) {
          return res.status(403).json({
            verified: false,
            error: 'Email Mismatch',
            message: 'The email address entered does not match the customer email recorded on this Razorpay payment.',
          });
        }

        return res.status(200).json({
          verified: true,
          message: 'Payment already verified. Existing customer license retrieved.',
          license: existingOrder.license,
          isExisting: true,
        });
      }

      // 3. Server-to-Server Razorpay Verification
      // Note: We DO NOT trust `body.status` to grant access; Razorpay API status must be 'captured'.
      let verificationResult;

      if (cleanPaymentId) {
        verificationResult = await verifyRazorpayPaymentServerSide({
          paymentId: cleanPaymentId,
          paymentLinkId: cleanPaymentLinkId || undefined,
          paymentLinkReferenceId: paymentLinkReferenceId ? String(paymentLinkReferenceId).trim() : undefined,
          paymentLinkStatus: paymentLinkStatus ? String(paymentLinkStatus).trim() : undefined,
          razorpayOrderId: cleanOrderId || undefined,
          signature: signature ? String(signature).trim() : undefined,
          expectedAmountPaise: 9900, // ₹99 = 9900 paise
          expectedCurrency: 'INR',
          expectedShortUrl: 'https://rzp.io/rzp/aGZfHfs',
          customerEmailFallback: cleanEmail || undefined,
          customerNameFallback: typeof customerName === 'string' ? customerName.trim() : undefined,
        });
      } else if (cleanOrderId || cleanPaymentLinkId) {
        verificationResult = await findVerifiedPaymentByOrderOrLinkIdServerSide({
          identifier: cleanOrderId || cleanPaymentLinkId,
          customerEmailFallback: cleanEmail || undefined,
          expectedAmountPaise: 9900,
          expectedCurrency: 'INR',
          expectedShortUrl: 'https://rzp.io/rzp/aGZfHfs',
        });
      } else {
        if (!isRealCustomerEmail(cleanEmail)) {
          return res.status(400).json({
            verified: false,
            error: 'Invalid Email',
            message: 'Please enter a valid customer email address.',
          });
        }

        verificationResult = await findVerifiedPaymentByEmailServerSide({
          email: cleanEmail,
          expectedAmountPaise: 9900,
          expectedCurrency: 'INR',
          expectedShortUrl: 'https://rzp.io/rzp/aGZfHfs',
        });
      }

      if (!verificationResult.verified || !verificationResult.payment) {
        return res.status(verificationResult.httpStatus || 400).json({
          verified: false,
          error: verificationResult.error || 'Payment Verification Failed',
          message: verificationResult.message || 'Payment could not be verified on Razorpay servers.',
        });
      }

      const payment = verificationResult.payment;

      // Enforce email match when Razorpay holds a real customer email (never allow cross-account lookup via paymentId)
      const recordedEmails = [
        payment.email,
        verificationResult.paymentLink?.customer?.email,
        payment.notes?.email,
        payment.notes?.customer_email,
      ]
        .filter((e): e is string => isRealCustomerEmail(e))
        .map((e) => e.trim().toLowerCase());

      if (cleanEmail && recordedEmails.length > 0 && !recordedEmails.includes(cleanEmail)) {
        return res.status(403).json({
          verified: false,
          error: 'Email Mismatch',
          message: 'The email address entered does not match the customer email recorded on this Razorpay payment.',
        });
      }

      // Idempotency check on the resolved Razorpay payment ID
      const existingByResolvedPayment = orderFulfillmentStore.getByPaymentId(payment.id);
      if (existingByResolvedPayment) {
        if (existingByResolvedPayment.status === 'revoked' || existingByResolvedPayment.status === 'refunded') {
          return res.status(403).json({
            verified: false,
            error: 'Order Revoked',
            message: 'Access has been revoked or refunded for this transaction.',
          });
        }
        return res.status(200).json({
          verified: true,
          message: 'Payment already verified. Existing customer license retrieved.',
          license: existingByResolvedPayment.license,
          isExisting: true,
        });
      }

      const verifiedEmail = verificationResult.customerEmail!;
      const verifiedName = verificationResult.customerName || 'Valued Reader';
      const verifiedPhone = verificationResult.customerPhone || '';
      const orderId = verificationResult.orderId!;
      const verifiedAt = Date.now();

      // 4. Generate cryptographically secure HMAC-SHA256 signed license token
      const token = generateLicenseToken({
        orderId,
        customerEmail: verifiedEmail,
        paymentId: payment.id,
        expiresInDays: 365,
      });

      const license: CustomerLicensePayload = {
        orderId,
        paymentId: payment.id,
        customerEmail: verifiedEmail,
        customerName: verifiedName,
        customerPhone: verifiedPhone || undefined,
        amount: '₹99',
        currency: payment.currency || 'INR',
        verifiedAt,
        token,
        status: 'active',
        maxDevices: 2,
        downloadUrl: `/api/download-ebook?token=${encodeURIComponent(token)}&orderId=${encodeURIComponent(orderId)}`,
        readerStreamUrl: `/api/stream-pdf?token=${encodeURIComponent(token)}&orderId=${encodeURIComponent(orderId)}`,
      };

      // 5. Store fulfilled order in server-authoritative store (Idempotency guarantee)
      const orderRecord: OrderRecord = {
        orderId,
        paymentId: payment.id,
        paymentLinkId: verificationResult.paymentLink?.id || (paymentLinkId ? String(paymentLinkId) : undefined),
        customerEmail: verifiedEmail,
        customerName: verifiedName,
        customerPhone: verifiedPhone || undefined,
        amountPaise: payment.amount,
        amountFormatted: '₹99',
        currency: payment.currency || 'INR',
        verifiedAt,
        licenseToken: token,
        license,
        status: 'fulfilled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      orderFulfillmentStore.set(orderRecord);

      // 6. Automatically dispatch customer thank-you email and SMS (if not already sent)
      dispatchPurchaseNotifications({
        orderId,
        paymentId: payment.id,
        customerEmail: verifiedEmail,
        customerName: verifiedName,
        customerPhone: verifiedPhone || undefined,
        amountPaise: payment.amount,
      }).catch((err) => {
        console.warn('[VerifyPayment] Background notification dispatch error:', err.message);
      });

      return res.status(200).json({
        verified: true,
        message: 'Payment verified successfully. Customer license created.',
        license,
      });
    } catch (err: any) {
      console.error('[VerifyPayment] Error during payment verification:', err);
      return res.status(500).json({
        verified: false,
        error: 'Internal Verification Error',
        message: err.message || 'An unexpected error occurred during verification.',
      });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
