/**
 * Digital Govind — Prompt Engineering Handbook
 * GET / POST /api/toolkit-progress
 *
 * Authenticated Customer Endpoint for the Complete Starter Toolkit 4-Week Learning Tracker:
 * - Strictly requires Authorization: Bearer <HMAC-SHA256 license token>.
 * - Verifies cryptographic signature, expiration, order binding, and revocation status.
 * - Binds progress strictly to the verified customer email in the token payload
 *   so customers restore their progress seamlessly across devices and sessions.
 */

import { authorizeEbookAccess } from '../src/server/auth/licenseVerifier.ts';
import { orderFulfillmentStore } from '../src/server/razorpay/orderStore.ts';
import { toolkitProgressStore } from '../src/server/toolkit/toolkitProgressStore.ts';
import { sanitizeToolkitProgress } from '../src/utils/toolkitProgress.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const headerOrderId = req.headers['x-order-id'] || req.headers['X-Order-Id'];

  const authCheck = authorizeEbookAccess({
    authorization: typeof authHeader === 'string' ? authHeader : undefined,
    orderId: typeof headerOrderId === 'string' ? headerOrderId : undefined,
  });

  if (!authCheck.authorized || !authCheck.payload) {
    return res.status(401).json({
      error: 'Unauthorized Access',
      message:
        authCheck.reason ||
        'Only verified customers with an active handbook license can access toolkit progress.',
    });
  }

  const recordedOrder = orderFulfillmentStore.getByPaymentId(authCheck.payload.paymentId);
  if (recordedOrder && (recordedOrder.status === 'revoked' || recordedOrder.status === 'refunded')) {
    return res.status(403).json({
      error: 'License Revoked',
      message: 'Access for this order has been revoked or refunded.',
    });
  }

  const verifiedEmail = authCheck.payload.customerEmail.trim().toLowerCase();

  if (req.method === 'GET') {
    try {
      const progress = await toolkitProgressStore.getProgress(verifiedEmail);
      return res.status(200).json({
        ok: true,
        customerEmail: verifiedEmail,
        orderId: authCheck.payload.orderId,
        progress,
      });
    } catch (err: any) {
      console.error('[ToolkitProgress] GET error:', err);
      return res.status(500).json({
        error: 'Progress Read Failed',
        message: 'Unable to load toolkit progress right now.',
      });
    }
  }

  // POST / PUT: Save customer's toolkit progress under verified account email
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const incomingProgress = sanitizeToolkitProgress(body?.progress ?? body);
    const saved = await toolkitProgressStore.saveProgress(verifiedEmail, {
      ...incomingProgress,
      updatedAt: incomingProgress.updatedAt > 0 ? incomingProgress.updatedAt : Date.now(),
    });

    return res.status(200).json({
      ok: true,
      customerEmail: verifiedEmail,
      orderId: authCheck.payload.orderId,
      progress: saved,
    });
  } catch (err: any) {
    console.error('[ToolkitProgress] POST error:', err);
    return res.status(500).json({
      error: 'Progress Save Failed',
      message: 'Unable to save toolkit progress right now.',
    });
  }
}
