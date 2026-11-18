import test from 'node:test';
import assert from 'node:assert/strict';
import downloadEbookHandler from '../../../api/download-ebook.ts';
import streamPdfHandler from '../../../api/stream-pdf.ts';
import { generateLicenseToken } from './licenseVerifier.ts';
import { orderFulfillmentStore } from '../razorpay/orderStore.ts';
import { generateWatermarkText } from '../../utils/security.ts';

process.env.LICENSE_SIGNING_SECRET = 'test_secret_for_reader_security_1234567890';

function createMockRes() {
  const headers: Record<string, string | number> = {};
  let statusCode = 200;
  let body: any = null;
  let ended = false;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    setHeader(k: string, v: string | number) {
      headers[k.toLowerCase()] = v;
    },
    writeHead(code: number, h: Record<string, string | number>) {
      statusCode = code;
      for (const [k, v] of Object.entries(h || {})) {
        headers[k.toLowerCase()] = v;
      }
      return res;
    },
    json(data: any) {
      body = data;
      ended = true;
      return res;
    },
    end() {
      ended = true;
      return res;
    },
    get statusCode() {
      return statusCode;
    },
    get headers() {
      return headers;
    },
    get body() {
      return body;
    },
    get ended() {
      return ended;
    },
  };
  return res;
}

test('download-ebook endpoint permanently rejects all requests with 403', async () => {
  const token = generateLicenseToken({
    orderId: 'ORD-DL-BLOCK-1',
    customerEmail: 'buyer@example.com',
    paymentId: 'pay_dl_block_1',
  });

  const req: any = {
    method: 'GET',
    query: { token, orderId: 'ORD-DL-BLOCK-1' },
    headers: { authorization: `Bearer ${token}` },
  };
  const res = createMockRes();

  await downloadEbookHandler(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body?.error, 'Downloads Disabled');
});

test('stream-pdf blocks direct browser navigation and query-token-only GET requests', async () => {
  const token = generateLicenseToken({
    orderId: 'ORD-STREAM-1',
    customerEmail: 'reader@example.com',
    paymentId: 'pay_stream_1',
  });

  // 1. Direct document navigation blocked
  const docReq: any = {
    method: 'GET',
    query: { token },
    headers: {
      'sec-fetch-dest': 'document',
      accept: 'text/html',
    },
  };
  const docRes = createMockRes();
  await streamPdfHandler(docReq, docRes);
  assert.equal(docRes.statusCode, 403);

  // 2. GET with query token only (missing Authorization + X-Reader-Session headers) blocked
  const bareReq: any = {
    method: 'GET',
    query: { token },
    headers: {},
  };
  const bareRes = createMockRes();
  await streamPdfHandler(bareReq, bareRes);
  assert.equal(bareRes.statusCode, 403);

  // 3. GET with valid headers but forged token returns 401
  const forgedReq: any = {
    method: 'GET',
    query: {},
    headers: {
      authorization: 'Bearer tampered.token',
      'x-reader-session': 'dg-online-reader-v1',
    },
  };
  const forgedRes = createMockRes();
  await streamPdfHandler(forgedReq, forgedRes);
  assert.equal(forgedRes.statusCode, 401);
});

test('stream-pdf allows authenticated HEAD check and rejects revoked orders', async () => {
  const token = generateLicenseToken({
    orderId: 'ORD-HEAD-1',
    customerEmail: 'valid@example.com',
    paymentId: 'pay_head_1',
  });

  const headReq: any = {
    method: 'HEAD',
    query: {},
    headers: {
      authorization: `Bearer ${token}`,
      'x-order-id': 'ORD-HEAD-1',
      'x-reader-session': 'dg-online-reader-v1',
    },
  };
  const headRes = createMockRes();
  await streamPdfHandler(headReq, headRes);
  assert.equal(headRes.statusCode, 200);
  assert.equal(headRes.headers['content-type'], 'application/pdf');
  assert.equal(headRes.headers['content-disposition'], 'inline');
  assert.equal(headRes.headers['x-frame-options'], 'DENY');

  // Revoke order and ensure stream-pdf blocks access with 403
  orderFulfillmentStore.set({
    orderId: 'ORD-HEAD-1',
    paymentId: 'pay_head_1',
    customerEmail: 'valid@example.com',
    customerName: 'Valid User',
    amountPaise: 9900,
    amountFormatted: '₹99',
    currency: 'INR',
    verifiedAt: Date.now(),
    licenseToken: token,
    license: {
      orderId: 'ORD-HEAD-1',
      paymentId: 'pay_head_1',
      customerEmail: 'valid@example.com',
      customerName: 'Valid User',
      amount: '₹99',
      currency: 'INR',
      verifiedAt: Date.now(),
      token,
      status: 'revoked',
      maxDevices: 2,
      readerStreamUrl: '/api/reader/stream-pdf',
    },
    status: 'revoked',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const revokedRes = createMockRes();
  await streamPdfHandler(headReq, revokedRes);
  assert.equal(revokedRes.statusCode, 403);
  orderFulfillmentStore.clear();
});

test('generateWatermarkText includes Digital Govind branding and verified customer email', () => {
  const wm = generateWatermarkText({
    orderId: 'ORD-WM-99',
    paymentId: 'pay_wm_99',
    customerEmail: 'Customer@Example.com',
    amount: '₹99',
    currency: 'INR',
    verifiedAt: 1700000000000,
    token: 'abc.def',
    status: 'active',
    maxDevices: 2,
    activeDevices: [],
  });

  assert.match(wm.primary, /DIGITAL GOVIND/i);
  assert.match(wm.primary, /customer@example\.com/i);
  assert.match(wm.canvasLabel, /Digital Govind/i);
  assert.match(wm.canvasLabel, /customer@example\.com/i);
});
