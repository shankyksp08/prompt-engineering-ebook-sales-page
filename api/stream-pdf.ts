/**
 * Digital Govind — Prompt Engineering Handbook
 * GET /api/stream-pdf
 * 
 * Secure Authenticated PDF Stream for Online eBook Reader:
 * - Serves the official watermarked eBook PDF strictly from private storage.
 * - Streams inline for browser/reader rendering.
 * - Supports HTTP 206 Partial Content (range requests) for high-performance page navigation and zoom.
 * - Rejects unauthorized requests with 401.
 */

import fs from 'node:fs';
import {
  authorizeEbookAccess,
  OFFICIAL_EBOOK_PATH,
} from '../src/server/auth/licenseVerifier.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed. Use GET to read.' });
  }

  const { token, orderId, paymentId } = req.query || {};
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  // Check authorization
  const authCheck = authorizeEbookAccess({
    token: typeof token === 'string' ? token : undefined,
    orderId: typeof orderId === 'string' ? orderId : undefined,
    paymentId: typeof paymentId === 'string' ? paymentId : undefined,
    authorization: typeof authHeader === 'string' ? authHeader : undefined,
  });

  if (!authCheck.authorized) {
    return res.status(401).json({
      error: 'Unauthorized Access',
      message: 'A valid customer license token is required to read this eBook. Please log in or verify your purchase.',
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
  const range = req.headers.range;

  if (range) {
    // Handle byte-range request for smooth PDF pagination
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="Digital-Govind-Watermarked-eBook.pdf"',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    });

    const fileStream = fs.createReadStream(OFFICIAL_EBOOK_PATH, { start, end });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="Digital-Govind-Watermarked-eBook.pdf"',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    });

    const fileStream = fs.createReadStream(OFFICIAL_EBOOK_PATH);
    fileStream.pipe(res);
  }
}
