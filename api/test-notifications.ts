/**
 * Digital Govind — Prompt Engineering Handbook
 * POST /api/test-notifications
 * 
 * Testing and Diagnostics Endpoint:
 * - Preview generated HTML & plain text thank-you email
 * - Preview generated thank-you SMS
 * - Validate Indian mobile numbers
 * - Trigger simulated or test email/SMS dispatch with safe credentials
 */

import crypto from 'node:crypto';
import {
  generateThankYouEmailHtml,
  generateThankYouEmailText,
} from '../src/server/notifications/emailTemplate.ts';
import {
  generateThankYouSmsText,
  formatAndValidateIndianMobile,
} from '../src/server/notifications/smsTemplate.ts';
import {
  dispatchPurchaseNotifications,
  notificationStore,
} from '../src/server/notifications/notificationService.ts';

function isAuthorizedAdminRequest(req: any): boolean {
  const configuredSecret =
    process.env.ADMIN_API_SECRET?.trim() || process.env.LICENSE_SIGNING_SECRET?.trim();
  if (!configuredSecret) return false;

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const headerSecret = req.headers['x-admin-secret'];
  const candidate =
    typeof headerSecret === 'string'
      ? headerSecret.trim()
      : typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : '';

  if (!candidate) return false;

  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(configuredSecret, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!isAuthorizedAdminRequest(req)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Diagnostic notification endpoint requires valid admin authorization.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      action = 'preview', // 'preview' | 'test-dispatch' | 'store-status'
      customerName = 'Test Learner',
      customerEmail = 'test@example.com',
      customerPhone = '+919876543210',
      orderId = `test_ord_${Date.now()}`,
      paymentId = `test_pay_${Date.now()}`,
    } = body;

    if (action === 'store-status') {
      return res.status(200).json({
        totalRecords: notificationStore.listAll().length,
        records: notificationStore.listAll().slice(0, 10),
      });
    }

    if (action === 'preview') {
      const emailHtml = generateThankYouEmailHtml({
        customerName,
        customerEmail,
        orderId,
        readerUrl: 'https://prompt-engineering-ebook-sales-page-three.vercel.app/reader',
      });

      const emailText = generateThankYouEmailText({
        customerName,
        customerEmail,
        orderId,
        readerUrl: 'https://prompt-engineering-ebook-sales-page-three.vercel.app/reader',
      });

      const phoneCheck = formatAndValidateIndianMobile(customerPhone);

      const smsText = generateThankYouSmsText({
        customerName,
        loginUrl: 'https://prompt-engineering-ebook-sales-page-three.vercel.app/reader',
      });

      return res.status(200).json({
        email: {
          subject: 'Thank You for Choosing Digital Govind! Your eBook Journey Begins 🎉',
          html: emailHtml,
          text: emailText,
        },
        sms: {
          text: smsText,
          phoneValidation: phoneCheck,
          characterCount: smsText.length,
        },
      });
    }

    if (action === 'test-dispatch') {
      const result = await dispatchPurchaseNotifications({
        orderId,
        paymentId,
        customerEmail,
        customerPhone,
        customerName,
      });

      return res.status(200).json({
        message: 'Notification test dispatch completed',
        result,
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
