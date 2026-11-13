/**
 * Digital Govind — Prompt Engineering Handbook
 * GET /api/download-ebook
 * 
 * Secure Authenticated Download Endpoint:
 * - Serves the official watermarked eBook PDF strictly from private storage.
 * - Rejects unauthorized requests with 401.
 * - Forces download attachment with filename "Digital-Govind-Watermarked-eBook.pdf".
 */

import fs from 'node:fs';
import {
  authorizeEbookAccess,
  OFFICIAL_EBOOK_PATH,
} from '../src/server/auth/licenseVerifier.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed. Use GET to download.' });
  }

  const { token, orderId, paymentId } = req.query || {};
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  // Verify access authorization
  const authCheck = authorizeEbookAccess({
    token: typeof token === 'string' ? token : undefined,
    orderId: typeof orderId === 'string' ? orderId : undefined,
    paymentId: typeof paymentId === 'string' ? paymentId : undefined,
    authorization: typeof authHeader === 'string' ? authHeader : undefined,
  });

  if (!authCheck.authorized) {
    return res.status(401).json({
      error: 'Unauthorized Access',
      message: authCheck.reason || 'A verified purchase license token is required to download this eBook. Please authenticate your purchase.',
    });
  }

  if (!fs.existsSync(OFFICIAL_EBOOK_PATH)) {
    console.error('[DownloadAPI] Official eBook PDF not found at:', OFFICIAL_EBOOK_PATH);
    return res.status(500).json({
      error: 'Storage Error',
      message: 'eBook asset is currently unavailable in private storage. Please contact support.',
    });
  }

  const stat = fs.statSync(OFFICIAL_EBOOK_PATH);

  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Length': stat.size,
    'Content-Disposition': 'attachment; filename="Digital-Govind-Watermarked-eBook.pdf"',
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  const readStream = fs.createReadStream(OFFICIAL_EBOOK_PATH);
  readStream.pipe(res);
}
