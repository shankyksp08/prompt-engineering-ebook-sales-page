/**
 * Digital Govind — Prompt Engineering Handbook
 * GET / HEAD /api/stream-pdf (and /api/reader/stream-pdf)
 *
 * Secure Authenticated Stream for Online-Only Reader:
 * - Serves the official eBook PDF strictly from private storage to the authenticated Online Reader.
 * - Rejects direct browser document navigation / iframe embedding (sec-fetch-dest: document/iframe/embed/object).
 * - Requires Authorization: Bearer <token> and X-Reader-Session: dg-online-reader-v1 on GET requests
 *   so tokens never appear in URLs and raw links cannot be opened in browser tabs or download managers.
 * - Verifies HMAC-SHA256 license signature, expiration, orderId binding, and server revocation state.
 * - Never sends Content-Disposition: attachment.
 */

import fs from 'node:fs';
import {
  authorizeEbookAccess,
  OFFICIAL_EBOOK_PATH,
} from '../src/server/auth/licenseVerifier.ts';
import { orderFulfillmentStore } from '../src/server/razorpay/orderStore.ts';

const REQUIRED_READER_HEADER = 'dg-online-reader-v1';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method Not Allowed. Use GET or HEAD.' });
  }

  // Block direct browser address-bar navigation, HTML requests, and iframe/embed loads
  const secFetchDest = String(req.headers['sec-fetch-dest'] || '').toLowerCase();
  const acceptHeader = String(req.headers['accept'] || '').toLowerCase();
  const readerSessionHeader = String(req.headers['x-reader-session'] || '').trim();

  if (
    secFetchDest === 'document' ||
    secFetchDest === 'iframe' ||
    secFetchDest === 'embed' ||
    secFetchDest === 'object' ||
    acceptHeader.includes('text/html')
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(403).json({
      error: 'Direct PDF Access Disabled',
      message: 'Direct file viewing or downloading is disabled. Use the Protected Online Reader.',
    });
  }

  const { token, orderId, paymentId } = req.query || {};
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const headerOrderId = req.headers['x-order-id'] || req.headers['X-Order-Id'];

  // On full content GET requests, strictly require Authorization header + Online Reader session header
  // (never stream raw PDF bytes via bare query-string URLs).
  if (req.method === 'GET') {
    if (readerSessionHeader !== REQUIRED_READER_HEADER || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(403).json({
        error: 'Online Reader Session Required',
        message: 'PDF content can only be loaded inside the authenticated Digital Govind Online Reader.',
      });
    }
  }

  const authCheck = authorizeEbookAccess({
    token: req.method === 'HEAD' && typeof token === 'string' ? token : undefined,
    orderId:
      typeof headerOrderId === 'string'
        ? headerOrderId
        : typeof orderId === 'string'
          ? orderId
          : undefined,
    paymentId: typeof paymentId === 'string' ? paymentId : undefined,
    authorization: typeof authHeader === 'string' ? authHeader : undefined,
  });

  if (!authCheck.authorized || !authCheck.payload) {
    return res.status(401).json({
      error: 'Unauthorized Access',
      message: authCheck.reason || 'A valid customer license token is required to read this eBook. Please sign in.',
    });
  }

  // Enforce server-side order revocation / refund checks when tracked in memory
  const recordedOrder = orderFulfillmentStore.getByPaymentId(authCheck.payload.paymentId);
  if (recordedOrder && (recordedOrder.status === 'revoked' || recordedOrder.status === 'refunded')) {
    return res.status(403).json({
      error: 'License Revoked',
      message: 'Access for this order has been revoked or refunded.',
    });
  }

  if (!fs.existsSync(OFFICIAL_EBOOK_PATH)) {
    console.error('[StreamPDF] Official eBook PDF not found at:', OFFICIAL_EBOOK_PATH);
    return res.status(500).json({
      error: 'Storage Error',
      message: 'eBook asset is currently unavailable in private storage.',
    });
  }

  const stat = fs.statSync(OFFICIAL_EBOOK_PATH);
  const fileSize = stat.size;

  const securityHeaders = {
    'Accept-Ranges': 'bytes',
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'inline',
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Content-Security-Policy': "default-src 'none'",
  };

  if (req.method === 'HEAD') {
    res.writeHead(200, {
      ...securityHeaders,
      'Content-Length': fileSize,
    });
    return res.end();
  }

  const range = req.headers.range;

  if (range) {
    const parts = String(range).replace(/bytes=/, '').split('-');
    const parsedStart = parseInt(parts[0], 10);
    const parsedEnd = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const start = Number.isFinite(parsedStart) && parsedStart >= 0 ? parsedStart : 0;
    const end = Number.isFinite(parsedEnd) ? Math.min(parsedEnd, fileSize - 1) : fileSize - 1;

    if (start >= fileSize || end < start) {
      res.writeHead(416, {
        'Content-Range': `bytes */${fileSize}`,
      });
      return res.end();
    }

    const chunksize = end - start + 1;

    res.writeHead(206, {
      ...securityHeaders,
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunksize,
    });

    const fileStream = fs.createReadStream(OFFICIAL_EBOOK_PATH, { start, end });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      ...securityHeaders,
      'Content-Length': fileSize,
    });

    const fileStream = fs.createReadStream(OFFICIAL_EBOOK_PATH);
    fileStream.pipe(res);
  }
}
