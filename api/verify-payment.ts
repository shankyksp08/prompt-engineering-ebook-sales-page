/**
 * Digital Govind — Prompt Engineering Handbook
 * GET /api/verify-payment
 * 
 * Client & Admin Verification Endpoint:
 * - Checks if an order or payment has been verified and processed.
 * - Checks notification dispatch status for order ID.
 */

import { notificationStore } from '../src/server/notifications/notificationService.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { orderId, paymentId } = req.query || {};

  if (!orderId && !paymentId) {
    return res.status(400).json({
      error: 'Either orderId or paymentId is required as a query parameter',
    });
  }

  const record = notificationStore.get(orderId || '', paymentId || '');

  if (!record) {
    return res.status(200).json({
      verified: false,
      message: 'No verified payment record found in current session',
      orderId: orderId || null,
      paymentId: paymentId || null,
    });
  }

  return res.status(200).json({
    verified: true,
    orderId: record.orderId,
    paymentId: record.paymentId,
    customerEmail: record.customerEmail,
    customerName: record.customerName,
    notifications: {
      emailSent: record.result.email.sent,
      emailProvider: record.result.email.provider,
      smsSent: record.result.sms.sent,
      smsProvider: record.result.sms.provider,
      timestamp: record.result.timestamp,
    },
  });
}
