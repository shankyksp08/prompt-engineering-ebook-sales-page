/**
 * Digital Govind — Prompt Engineering Handbook
 * GET /api/download-ebook
 *
 * Permanently Disabled Download Endpoint:
 * - Customer-facing PDF file downloads have been removed.
 * - Verified customers read the handbook exclusively via the Protected Online Reader.
 * - Never exposes the private storage path or raw PDF attachment.
 */

export default async function handler(_req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  return res.status(403).json({
    error: 'Downloads Disabled',
    message:
      'Direct PDF downloads are disabled. Verified customers can access the Digital Govind Prompt Engineering Handbook exclusively inside the Protected Online Reader.',
  });
}
