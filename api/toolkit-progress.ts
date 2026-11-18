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

import {
  authorizeActiveSession,
  clearSessionCookieHeader,
} from '../src/server/auth/licenseVerifier.ts';
import { toolkitProgressStore } from '../src/server/toolkit/toolkitProgressStore.ts';
import { sanitizeToolkitProgress } from '../src/utils/toolkitProgress.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const authCheck = await authorizeActiveSession(req);

  if (!authCheck.authorized || !authCheck.payload) {
    if (authCheck.statusCode === 401) {
      res.setHeader('Set-Cookie', clearSessionCookieHeader(req));
    }
    return res.status(authCheck.statusCode).json({
      error: authCheck.error || 'Unauthorized Access',
      code: authCheck.code || 'SESSION_ENDED',
      message:
        authCheck.message ||
        'Only verified customers with an active handbook license can access toolkit progress.',
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
