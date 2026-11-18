import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { activeSessionStore, SESSION_REPLACED_MESSAGE } from './sessionStore.ts';
import {
  generateLicenseToken,
  READER_SESSION_COOKIE_NAME,
} from './licenseVerifier.ts';
import sessionHandler from '../../../api/session.ts';
import streamPdfHandler from '../../../api/stream-pdf.ts';
import toolkitProgressHandler from '../../../api/toolkit-progress.ts';
import verifyPaymentHandler from '../../../api/verify-payment.ts';
import { orderFulfillmentStore } from '../razorpay/orderStore.ts';

process.env.LICENSE_SIGNING_SECRET = 'test_secret_for_single_device_sessions_123456';

function createMockRes() {
  const headers: Record<string, string | number | string[]> = {};
  let statusCode = 200;
  let body: any = null;
  let ended = false;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    setHeader(k: string, v: string | number | string[]) {
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

test('concurrent logins for the same customer settle on strictly one active sessionId', async () => {
  const tempFile = path.join(os.tmpdir(), `dg-session-concurrent-${Date.now()}.json`);
  activeSessionStore.setStorageFilePathForTests(tempFile);

  try {
    const email = 'concurrent.user@digitalgovind.in';
    const [s1, s2, s3] = await Promise.all([
      activeSessionStore.issueSingleSession({
        customerEmail: email,
        orderId: 'ORD-CONC-1',
        paymentId: 'pay_conc_1',
        deviceLabel: 'Chrome on Windows',
      }),
      activeSessionStore.issueSingleSession({
        customerEmail: email,
        orderId: 'ORD-CONC-1',
        paymentId: 'pay_conc_1',
        deviceLabel: 'Safari on iPhone',
      }),
      activeSessionStore.issueSingleSession({
        customerEmail: email,
        orderId: 'ORD-CONC-1',
        paymentId: 'pay_conc_1',
        deviceLabel: 'Firefox on macOS',
      }),
    ]);

    const checks = await Promise.all([
      activeSessionStore.validateSession(email, s1.activeSessionId),
      activeSessionStore.validateSession(email, s2.activeSessionId),
      activeSessionStore.validateSession(email, s3.activeSessionId),
    ]);

    const validCount = checks.filter((c) => c.valid).length;
    assert.equal(validCount, 1, 'Exactly one concurrent login must remain active');
  } finally {
    activeSessionStore.setStorageFilePathForTests(null);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

test('logging in on Device B immediately invalidates Device A across /api/session, /api/stream-pdf, and /api/toolkit-progress', async () => {
  const tempFile = path.join(os.tmpdir(), `dg-session-kick-${Date.now()}.json`);
  activeSessionStore.setStorageFilePathForTests(tempFile);

  try {
    const email = 'single.device@digitalgovind.in';
    const orderId = 'ORD-SINGLE-99';
    const paymentId = 'pay_single_99';

    // 1. Seed verified customer order in server store
    const initialSession = await activeSessionStore.issueSingleSession({
      customerEmail: email,
      orderId,
      paymentId,
      deviceLabel: 'Chrome on Windows',
    });
    const deviceAToken = generateLicenseToken({
      orderId,
      customerEmail: email,
      paymentId,
      sessionId: initialSession.activeSessionId!,
    });

    orderFulfillmentStore.set({
      orderId,
      paymentId,
      customerEmail: email,
      customerName: 'Test Buyer',
      amountPaise: 9900,
      amountFormatted: '₹99',
      currency: 'INR',
      verifiedAt: Date.now(),
      licenseToken: deviceAToken,
      license: {
        orderId,
        paymentId,
        customerEmail: email,
        customerName: 'Test Buyer',
        amount: '₹99',
        currency: 'INR',
        verifiedAt: Date.now(),
        token: deviceAToken,
        sessionId: initialSession.activeSessionId!,
        deviceLabel: 'Chrome on Windows',
        status: 'active',
        maxDevices: 1,
        readerStreamUrl: '/api/reader/stream-pdf',
      },
      status: 'fulfilled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Verify Device A can access /api/session cleanly (and persists across refresh)
    const devACheck1 = createMockRes();
    await sessionHandler(
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${deviceAToken}`,
          cookie: `${READER_SESSION_COOKIE_NAME}=${encodeURIComponent(deviceAToken)}`,
        },
      },
      devACheck1
    );
    assert.equal(devACheck1.statusCode, 200);
    assert.equal(devACheck1.body.valid, true);
    assert.equal(devACheck1.body.sessionId, initialSession.activeSessionId);

    // 3. Log in from Device B via POST /api/verify-payment
    const devBLoginRes = createMockRes();
    await verifyPaymentHandler(
      {
        method: 'POST',
        headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605.1.15' },
        body: { email, deviceLabel: 'Safari on macOS' },
      },
      devBLoginRes
    );
    assert.equal(devBLoginRes.statusCode, 200);
    assert.equal(devBLoginRes.body.verified, true);
    assert.equal(devBLoginRes.body.license.maxDevices, 1);

    const deviceBToken = devBLoginRes.body.license.token;
    const deviceBSid = devBLoginRes.body.license.sessionId;
    assert.notEqual(deviceBSid, initialSession.activeSessionId);

    const setCookieHeader = String(devBLoginRes.headers['set-cookie'] || '');
    assert.match(setCookieHeader, /dg_reader_session=/);
    assert.match(setCookieHeader, /HttpOnly/i);
    assert.match(setCookieHeader, /SameSite=Lax/i);

    // 4. Device A MUST be rejected across all protected endpoints with exact replacement message
    const devASessionRes = createMockRes();
    await sessionHandler(
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${deviceAToken}`,
          cookie: `${READER_SESSION_COOKIE_NAME}=${encodeURIComponent(deviceAToken)}`,
        },
      },
      devASessionRes
    );
    assert.equal(devASessionRes.statusCode, 401);
    assert.equal(devASessionRes.body.code, 'SESSION_REPLACED');
    assert.equal(devASessionRes.body.message, SESSION_REPLACED_MESSAGE);
    assert.match(String(devASessionRes.headers['set-cookie'] || ''), /Max-Age=0/);

    const devAStreamRes = createMockRes();
    await streamPdfHandler(
      {
        method: 'HEAD',
        query: {},
        headers: {
          authorization: `Bearer ${deviceAToken}`,
          'x-order-id': orderId,
          'x-reader-session': 'dg-online-reader-v1',
        },
      },
      devAStreamRes
    );
    assert.equal(devAStreamRes.statusCode, 401);

    const devAToolkitRes = createMockRes();
    await toolkitProgressHandler(
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${deviceAToken}`,
          'x-order-id': orderId,
        },
      },
      devAToolkitRes
    );
    assert.equal(devAToolkitRes.statusCode, 401);
    assert.equal(devAToolkitRes.body.message, SESSION_REPLACED_MESSAGE);

    // 5. Device B refresh (repeated GET /api/session) stays active with the SAME sessionId
    for (let i = 0; i < 2; i++) {
      const devBRefreshRes = createMockRes();
      await sessionHandler(
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${deviceBToken}`,
            cookie: `${READER_SESSION_COOKIE_NAME}=${encodeURIComponent(deviceBToken)}`,
          },
        },
        devBRefreshRes
      );
      assert.equal(devBRefreshRes.statusCode, 200);
      assert.equal(devBRefreshRes.body.sessionId, deviceBSid);
    }

    // 6. Mismatched Bearer (Device A) + Cookie (Device B) rejected cleanly
    const mixedRes = createMockRes();
    await sessionHandler(
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${deviceAToken}`,
          cookie: `${READER_SESSION_COOKIE_NAME}=${encodeURIComponent(deviceBToken)}`,
        },
      },
      mixedRes
    );
    assert.equal(mixedRes.statusCode, 401);

    // 7. Old replaced token attempting logout CANNOT revoke Device B's active session
    const staleLogoutRes = createMockRes();
    await sessionHandler(
      {
        method: 'POST',
        headers: { authorization: `Bearer ${deviceAToken}` },
        body: { action: 'logout' },
      },
      staleLogoutRes
    );
    assert.equal(staleLogoutRes.body.revoked, false);

    const stillActiveRes = createMockRes();
    await sessionHandler(
      {
        method: 'GET',
        headers: { authorization: `Bearer ${deviceBToken}` },
      },
      stillActiveRes
    );
    assert.equal(stillActiveRes.statusCode, 200);

    // 8. Explicit logout from Device B invalidates server session and prevents replay
    const logoutRes = createMockRes();
    await sessionHandler(
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${deviceBToken}`,
          cookie: `${READER_SESSION_COOKIE_NAME}=${encodeURIComponent(deviceBToken)}`,
        },
        body: { action: 'logout' },
      },
      logoutRes
    );
    assert.equal(logoutRes.statusCode, 200);
    assert.equal(logoutRes.body.loggedOut, true);
    assert.equal(logoutRes.body.revoked, true);
    assert.match(String(logoutRes.headers['set-cookie'] || ''), /Max-Age=0/);

    const replayAfterLogoutRes = createMockRes();
    await sessionHandler(
      {
        method: 'GET',
        headers: { authorization: `Bearer ${deviceBToken}` },
      },
      replayAfterLogoutRes
    );
    assert.equal(replayAfterLogoutRes.statusCode, 401);
  } finally {
    orderFulfillmentStore.clear();
    activeSessionStore.setStorageFilePathForTests(null);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});
