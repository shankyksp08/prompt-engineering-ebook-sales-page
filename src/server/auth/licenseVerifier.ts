/**
 * Digital Govind — Prompt Engineering Handbook
 * Server-Side License & Token Verification Utility
 * 
 * Provides cryptographically secure HMAC-SHA256 license token generation
 * and constant-time verification for private eBook PDF access.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  activeSessionStore,
  SESSION_ENDED_MESSAGE,
  SESSION_REPLACED_MESSAGE,
  type CustomerSessionRecord,
} from './sessionStore.ts';
import { orderFulfillmentStore } from '../razorpay/orderStore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolved path to private eBook storage (supports both Vercel /var/task/private_storage and local dev)
const cwdPrivateStorage = path.resolve(process.cwd(), 'private_storage');
const relativePrivateStorage = path.resolve(__dirname, '../../../private_storage');
export const PRIVATE_STORAGE_DIR = fs.existsSync(cwdPrivateStorage)
  ? cwdPrivateStorage
  : relativePrivateStorage;
export const OFFICIAL_EBOOK_PATH = path.join(PRIVATE_STORAGE_DIR, 'Digital-Govind-Watermarked-eBook.pdf');
export const BACKUP_EBOOK_PATH = path.join(PRIVATE_STORAGE_DIR, 'backup', 'Prompt_Engineering_Handbook_original_backup.pdf');

export const READER_SESSION_COOKIE_NAME = 'dg_reader_session';
export const DEFAULT_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * Payload structure for cryptographically signed customer license tokens
 */
export interface LicenseTokenPayload {
  orderId: string;
  customerEmail: string;
  paymentId: string;
  sid?: string; // Server-enforced single active device session ID
  iat: number; // Issued-at timestamp (milliseconds)
  exp: number; // Expiration timestamp (milliseconds)
}

export interface TokenVerificationResult {
  valid: boolean;
  reason?: string;
  payload?: LicenseTokenPayload;
}

/**
 * Retrieves the license signing secret strictly from server-side environment variables.
 * Never falls back to hardcoded strings or insecure defaults.
 */
export function getLicenseSigningSecret(): string {
  const secret = process.env.LICENSE_SIGNING_SECRET?.trim();
  if (!secret) {
    throw new Error('Server configuration error: LICENSE_SIGNING_SECRET is not configured in environment variables.');
  }
  return secret;
}

/**
 * Generates a cryptographically secure HMAC-SHA256 signed license token.
 *
 * Format:
 *   <base64url(payload)>.<base64url(hmac_sha256(payload, LICENSE_SIGNING_SECRET))>
 */
export function generateLicenseToken(params: {
  orderId: string;
  customerEmail: string;
  paymentId: string;
  sessionId?: string;
  expiresInDays?: number;
  expiresAtMs?: number;
}): string {
  const secret = getLicenseSigningSecret();

  if (!params.orderId || !params.customerEmail || !params.paymentId) {
    throw new Error('Missing required parameters to generate license token.');
  }

  const iat = Date.now();
  let exp: number;
  if (typeof params.expiresAtMs === 'number') {
    exp = params.expiresAtMs;
  } else if (typeof params.expiresInDays === 'number') {
    exp = iat + params.expiresInDays * 24 * 60 * 60 * 1000;
  } else {
    exp = iat + 365 * 24 * 60 * 60 * 1000;
  }

  const cleanSid = typeof params.sessionId === 'string' && params.sessionId.trim()
    ? params.sessionId.trim()
    : undefined;

  const payload: LicenseTokenPayload = {
    orderId: params.orderId.trim(),
    customerEmail: params.customerEmail.trim().toLowerCase(),
    paymentId: params.paymentId.trim(),
    ...(cleanSid ? { sid: cleanSid } : {}),
    iat,
    exp,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson, 'utf8').toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Cryptographically verifies an HMAC-SHA256 license token using constant-time comparison.
 * Strictly verifies signature, payload integrity, and expiration.
 * Insecure prefix checks (startsWith('LIC-'), startsWith('TOKEN_'), startsWith('adm_')) are completely removed.
 */
export function verifyLicenseToken(token: string | undefined | null): TokenVerificationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Missing or empty license token.' };
  }

  let secret: string;
  try {
    secret = getLicenseSigningSecret();
  } catch (err: any) {
    return { valid: false, reason: err.message };
  }

  const trimmed = token.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Invalid license token format. Expected HMAC-SHA256 signed token.' };
  }

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) {
    return { valid: false, reason: 'Malformed license token segments.' };
  }

  // 1. Recompute expected HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  // 2. Constant-time signature comparison using crypto.timingSafeEqual
  const sigBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: 'Invalid or tampered license token signature.' };
  }

  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, reason: 'Invalid or tampered license token signature.' };
  }

  // 3. Decode and validate JSON payload
  let payload: LicenseTokenPayload;
  try {
    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    payload = JSON.parse(jsonStr);
  } catch {
    return { valid: false, reason: 'Malformed license token payload.' };
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.orderId !== 'string' ||
    typeof payload.customerEmail !== 'string' ||
    typeof payload.paymentId !== 'string' ||
    typeof payload.iat !== 'number' ||
    typeof payload.exp !== 'number'
  ) {
    return { valid: false, reason: 'License token payload is missing required fields.' };
  }

  // 4. Expiration check
  if (Date.now() > payload.exp) {
    return { valid: false, reason: 'License token has expired.' };
  }

  return { valid: true, payload };
}

/**
 * Validates a customer token without insecure prefix checks.
 * Backward-compatible helper that delegates to verifyLicenseToken.
 */
export function validateCustomerToken(token: string | undefined | null): boolean {
  return verifyLicenseToken(token).valid;
}

/**
 * Authorize eBook PDF access (download or stream).
 * Used uniformly by both /api/download-ebook and /api/stream-pdf.
 * 
 * Verifies:
 * - Cryptographic validity and signature of license token
 * - Token expiration
 * - Matching orderId / paymentId / customerEmail when provided in query/headers
 */
export function authorizeEbookAccess(queryOrHeaders: {
  token?: string;
  orderId?: string;
  paymentId?: string;
  customerEmail?: string;
  authorization?: string;
}): { authorized: boolean; reason?: string; payload?: LicenseTokenPayload } {
  const token =
    queryOrHeaders.token ||
    (queryOrHeaders.authorization?.startsWith('Bearer ')
      ? queryOrHeaders.authorization.slice(7)
      : undefined);

  if (!token) {
    return {
      authorized: false,
      reason: 'A valid customer license token is required.',
    };
  }

  const verification = verifyLicenseToken(token);
  if (!verification.valid || !verification.payload) {
    return {
      authorized: false,
      reason: verification.reason || 'Invalid or unverified license token.',
    };
  }

  const payload = verification.payload;

  // Verify orderId binding if supplied
  if (queryOrHeaders.orderId && queryOrHeaders.orderId.trim() !== '') {
    if (payload.orderId.toLowerCase() !== queryOrHeaders.orderId.trim().toLowerCase()) {
      return {
        authorized: false,
        reason: 'License token order ID does not match request.',
      };
    }
  }

  // Verify paymentId binding if supplied
  if (queryOrHeaders.paymentId && queryOrHeaders.paymentId.trim() !== '') {
    if (payload.paymentId.toLowerCase() !== queryOrHeaders.paymentId.trim().toLowerCase()) {
      return {
        authorized: false,
        reason: 'License token payment ID does not match request.',
      };
    }
  }

  // Verify customerEmail binding if supplied
  if (queryOrHeaders.customerEmail && queryOrHeaders.customerEmail.trim() !== '') {
    if (payload.customerEmail.toLowerCase() !== queryOrHeaders.customerEmail.trim().toLowerCase()) {
      return {
        authorized: false,
        reason: 'License token customer email does not match request.',
      };
    }
  }

  return { authorized: true, payload };
}

/**
 * Parse raw Cookie header string into a key-value map.
 */
export function parseCookieHeader(cookieHeader: string | undefined | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx <= 0) continue;
    const key = pair.slice(0, idx).trim();
    const rawVal = pair.slice(idx + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(rawVal);
    } catch {
      cookies[key] = rawVal;
    }
  }
  return cookies;
}

/**
 * Extract the HttpOnly reader session cookie token from a request.
 */
export function getSessionCookieToken(req: any): string | undefined {
  if (req?.cookies && typeof req.cookies[READER_SESSION_COOKIE_NAME] === 'string') {
    const val = req.cookies[READER_SESSION_COOKIE_NAME].trim();
    return val || undefined;
  }
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie;
  const parsed = parseCookieHeader(Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader);
  const val = parsed[READER_SESSION_COOKIE_NAME];
  return val && val.trim() ? val.trim() : undefined;
}

/**
 * Determine whether the request arrived over HTTPS (so Secure cookie attribute matches deployment).
 */
export function isSecureRequest(req: any): boolean {
  const forwardedProto = String(req?.headers?.['x-forwarded-proto'] || '').toLowerCase();
  if (forwardedProto.split(',')[0].trim() === 'https') return true;
  if (req?.socket?.encrypted || req?.connection?.encrypted) return true;
  return process.env.NODE_ENV === 'production';
}

/**
 * Build Set-Cookie header for HttpOnly, SameSite=Lax (+ Secure over HTTPS) reader session token.
 */
export function buildSessionCookieHeader(
  token: string,
  req: any,
  maxAgeSec = DEFAULT_SESSION_MAX_AGE_SECONDS
): string {
  const parts = [
    `${READER_SESSION_COOKIE_NAME}=${encodeURIComponent(token.trim())}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`,
  ];
  if (isSecureRequest(req)) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

/**
 * Build Set-Cookie header that clears the reader session cookie cleanly.
 */
export function clearSessionCookieHeader(req: any): string {
  const parts = [
    `${READER_SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isSecureRequest(req)) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

/**
 * Derive a clean human-readable browser/OS label from User-Agent when client doesn't supply one.
 */
export function deriveDeviceLabelFromUserAgent(uaRaw: unknown): string {
  const ua = typeof uaRaw === 'string' ? uaRaw : '';
  if (!ua) return 'Web Browser';

  let browser = 'Browser';
  if (ua.includes('Firefox') || ua.includes('FxiOS')) browser = 'Firefox';
  else if (ua.includes('Edg') || ua.includes('EdgiOS') || ua.includes('EdgA')) browser = 'Edge';
  else if (ua.includes('CriOS') || ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  let os = 'Desktop';
  if (/iPad/i.test(ua)) os = 'iPadOS';
  else if (/iPhone|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return `${browser} on ${os}`;
}

export interface ActiveSessionAuthResult {
  authorized: boolean;
  statusCode: number;
  error?: string;
  code?: 'SESSION_REPLACED' | 'SESSION_ENDED' | 'SESSION_REQUIRED' | 'ORDER_REVOKED' | 'INVALID_TOKEN';
  message?: string;
  payload?: LicenseTokenPayload;
  session?: CustomerSessionRecord;
}

/**
 * Single source of truth for validating an authenticated customer's active device session.
 *
 * Enforces:
 * 1. Valid HMAC-SHA256 license token from Authorization Bearer header, HttpOnly cookie, or optional query param.
 * 2. When BOTH Bearer/query token and HttpOnly cookie exist on the request, they must belong to the same customer & sid
 *    (blocks session-mixing or stale-tab replay).
 * 3. Token MUST carry a server-issued `sid` claim.
 * 4. `sid` must match the single authoritative active session ID in `activeSessionStore`.
 * 5. Order must not be revoked or refunded.
 */
export async function authorizeActiveSession(
  req: any,
  options: { allowQueryToken?: boolean; touch?: boolean } = {}
): Promise<ActiveSessionAuthResult> {
  const query = req?.query || {};
  const headers = req?.headers || {};

  const authHeader = headers['authorization'] || headers['Authorization'];
  const bearerToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : undefined;

  const queryToken =
    options.allowQueryToken && typeof query.token === 'string' && query.token.trim()
      ? query.token.trim()
      : undefined;

  const cookieToken = getSessionCookieToken(req);
  const primaryToken = bearerToken || queryToken || cookieToken;

  if (!primaryToken) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized Access',
      code: 'SESSION_REQUIRED',
      message: 'Please sign in to access your handbook reader.',
    };
  }

  const headerOrderId = headers['x-order-id'] || headers['X-Order-Id'];
  const orderIdHint =
    typeof headerOrderId === 'string'
      ? headerOrderId
      : typeof query.orderId === 'string'
        ? query.orderId
        : undefined;
  const paymentIdHint = typeof query.paymentId === 'string' ? query.paymentId : undefined;

  const authCheck = authorizeEbookAccess({
    token: primaryToken,
    orderId: orderIdHint,
    paymentId: paymentIdHint,
  });

  if (!authCheck.authorized || !authCheck.payload) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized Access',
      code: 'INVALID_TOKEN',
      message: authCheck.reason || SESSION_ENDED_MESSAGE,
    };
  }

  const payload = authCheck.payload;
  if (!payload.sid || typeof payload.sid !== 'string' || !payload.sid.trim()) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Session Required',
      code: 'SESSION_REQUIRED',
      message: SESSION_ENDED_MESSAGE,
    };
  }

  // If BOTH explicit token (Bearer/query) and HttpOnly cookie exist, enforce exact sid & email agreement
  if ((bearerToken || queryToken) && cookieToken && cookieToken !== primaryToken) {
    const cookieVerify = verifyLicenseToken(cookieToken);
    if (
      !cookieVerify.valid ||
      !cookieVerify.payload ||
      cookieVerify.payload.customerEmail !== payload.customerEmail ||
      cookieVerify.payload.sid !== payload.sid
    ) {
      return {
        authorized: false,
        statusCode: 401,
        error: 'Session Invalidated',
        code: 'SESSION_REPLACED',
        message: SESSION_REPLACED_MESSAGE,
      };
    }
  }

  // Enforce order revocation / refund check
  const recordedOrder = orderFulfillmentStore.getByPaymentId(payload.paymentId);
  if (recordedOrder && (recordedOrder.status === 'revoked' || recordedOrder.status === 'refunded')) {
    return {
      authorized: false,
      statusCode: 403,
      error: 'License Revoked',
      code: 'ORDER_REVOKED',
      message: 'Access for this order has been revoked or refunded.',
    };
  }

  // Validate single active session against persistent server-side store
  const sessionCheck = await activeSessionStore.validateSession(payload.customerEmail, payload.sid);
  if (!sessionCheck.valid) {
    return {
      authorized: false,
      statusCode: 401,
      error: sessionCheck.code === 'SESSION_REPLACED' ? 'Session Replaced' : 'Session Ended',
      code: sessionCheck.code,
      message: sessionCheck.message,
    };
  }

  if (options.touch !== false) {
    await activeSessionStore.touchSession(payload.customerEmail, payload.sid);
  }

  return {
    authorized: true,
    statusCode: 200,
    payload,
    session: sessionCheck.session,
  };
}

/**
 * Ensure private eBook exists and is readable
 */
export function getOfficialEbookStats(): { exists: boolean; sizeBytes: number; path: string } {
  if (fs.existsSync(OFFICIAL_EBOOK_PATH)) {
    const stats = fs.statSync(OFFICIAL_EBOOK_PATH);
    return { exists: true, sizeBytes: stats.size, path: OFFICIAL_EBOOK_PATH };
  }
  return { exists: false, sizeBytes: 0, path: OFFICIAL_EBOOK_PATH };
}

/**
 * Non-cryptographic hash utility.
 * @deprecated DO NOT USE FOR AUTHENTICATION OR ACCESS CONTROL. Kept solely for non-security string hashing.
 */
export function hashSimple(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
