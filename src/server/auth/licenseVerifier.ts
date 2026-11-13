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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolved path to private eBook storage
export const PRIVATE_STORAGE_DIR = path.resolve(__dirname, '../../../private_storage');
export const OFFICIAL_EBOOK_PATH = path.join(PRIVATE_STORAGE_DIR, 'Digital-Govind-Watermarked-eBook.pdf');
export const BACKUP_EBOOK_PATH = path.join(PRIVATE_STORAGE_DIR, 'backup', 'Prompt_Engineering_Handbook_original_backup.pdf');

/**
 * Payload structure for cryptographically signed customer license tokens
 */
export interface LicenseTokenPayload {
  orderId: string;
  customerEmail: string;
  paymentId: string;
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

  const payload: LicenseTokenPayload = {
    orderId: params.orderId.trim(),
    customerEmail: params.customerEmail.trim().toLowerCase(),
    paymentId: params.paymentId.trim(),
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
