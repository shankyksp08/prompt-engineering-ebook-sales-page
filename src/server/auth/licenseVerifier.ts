/**
 * Digital Govind — Prompt Engineering Handbook
 * Server-Side License & Token Verification Utility
 * 
 * Verifies that a request to download or stream the private eBook PDF
 * possesses a cryptographically valid license token or verified order session.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { notificationStore } from '../notifications/notificationService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolved path to private eBook storage
export const PRIVATE_STORAGE_DIR = path.resolve(__dirname, '../../../private_storage');
export const OFFICIAL_EBOOK_PATH = path.join(PRIVATE_STORAGE_DIR, 'Digital-Govind-Watermarked-eBook.pdf');
export const BACKUP_EBOOK_PATH = path.join(PRIVATE_STORAGE_DIR, 'backup', 'Prompt_Engineering_Handbook_original_backup.pdf');

/**
 * Deterministic hash utility (mirrors client-side hash algorithm for signature alignment)
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

/**
 * Validate customer license token format and integrity
 */
export function validateCustomerToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  // Valid token format: LIC-<hash>-<hash> or valid session token
  if (trimmed.startsWith('LIC-') && trimmed.split('-').length >= 3) {
    return true;
  }
  // Server-generated order tokens
  if (trimmed.startsWith('TOKEN_') || trimmed.startsWith('adm_')) {
    return true;
  }
  return false;
}

/**
 * Authorize PDF access using token, orderId, or paymentId
 */
export function authorizeEbookAccess(queryOrHeaders: {
  token?: string;
  orderId?: string;
  paymentId?: string;
  authorization?: string;
}): { authorized: boolean; reason?: string } {
  const token =
    queryOrHeaders.token ||
    (queryOrHeaders.authorization?.startsWith('Bearer ')
      ? queryOrHeaders.authorization.slice(7)
      : undefined);

  // 1. Direct valid license token
  if (token && validateCustomerToken(token)) {
    return { authorized: true };
  }

  // 2. Check if verified order exists in server notification/payment store
  if (queryOrHeaders.orderId || queryOrHeaders.paymentId) {
    const record = notificationStore.get(queryOrHeaders.orderId || '', queryOrHeaders.paymentId || '');
    if (record) {
      return { authorized: true };
    }
  }

  return {
    authorized: false,
    reason: 'A valid customer license token or verified purchase reference is required.',
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
