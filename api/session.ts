/**
 * Digital Govind — Prompt Engineering Handbook
 * GET / POST / DELETE /api/session
 *
 * Single Active Device Session Endpoint:
 * - GET: Validates the caller's Bearer token + HttpOnly cookie against the single
 *        authoritative active session stored server-side. Safe on page reloads.
 * - POST (action: 'logout') / DELETE: Explicitly invalidates the active session
 *        server-side and clears the HttpOnly reader cookie.
 */

import {
  authorizeActiveSession,
  clearSessionCookieHeader,
  getSessionCookieToken,
  verifyLicenseToken,
} from '../src/server/auth/licenseVerifier.ts';
import { activeSessionStore } from '../src/server/auth/sessionStore.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET' || req.method === 'HEAD') {
    const auth = await authorizeActiveSession(req);
    if (!auth.authorized || !auth.payload) {
      res.setHeader('Set-Cookie', clearSessionCookieHeader(req));
      return res.status(auth.statusCode).json({
        valid: false,
        error: auth.error || 'Session Invalidated',
        code: auth.code || 'SESSION_ENDED',
        message: auth.message,
      });
    }

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    return res.status(200).json({
      valid: true,
      customerEmail: auth.payload.customerEmail,
      orderId: auth.payload.orderId,
      sessionId: auth.payload.sid,
      deviceLabel: auth.session?.deviceLabel || 'Web Browser',
      issuedAt: auth.session?.issuedAt,
      lastActiveAt: auth.session?.lastActiveAt,
    });
  }

  if (req.method === 'POST' || req.method === 'DELETE') {
    let body: any = {};
    if (req.method === 'POST') {
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      } catch {
        body = {};
      }
      const action = typeof body?.action === 'string' ? body.action.trim().toLowerCase() : 'logout';
      if (action && action !== 'logout') {
        return res.status(400).json({
          error: 'Unsupported Action',
          message: 'Only action="logout" is supported on POST /api/session.',
        });
      }
    }

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const bearerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : undefined;
    const cookieToken = getSessionCookieToken(req);

    // Revoke matching session if token is cryptographically valid (guards prevent stale session from revoking newer device)
    const candidateToken = bearerToken || cookieToken;
    let revoked = false;
    if (candidateToken) {
      const verified = verifyLicenseToken(candidateToken);
      if (verified.valid && verified.payload) {
        revoked = await activeSessionStore.revokeSession(
          verified.payload.customerEmail,
          verified.payload.sid
        );
      }
    }

    res.setHeader('Set-Cookie', clearSessionCookieHeader(req));
    return res.status(200).json({
      ok: true,
      loggedOut: true,
      revoked,
    });
  }

  res.setHeader('Allow', 'GET, HEAD, POST, DELETE');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
