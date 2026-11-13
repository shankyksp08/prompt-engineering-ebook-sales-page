import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  authorizeEbookAccess,
  validateCustomerToken,
  generateLicenseToken,
  verifyLicenseToken,
  getOfficialEbookStats,
  OFFICIAL_EBOOK_PATH,
  BACKUP_EBOOK_PATH
} from './licenseVerifier.ts';

// Ensure test environment secret is set
process.env.LICENSE_SIGNING_SECRET = 'test_secret_for_license_verification_1234567890';

test('authorizeEbookAccess rejects requests with missing or empty parameters', () => {
  const result1 = authorizeEbookAccess({});
  assert.equal(result1.authorized, false);
  assert.match(result1.reason || '', /required/i);

  const result2 = authorizeEbookAccess({ token: 'invalid_random_string' });
  assert.equal(result2.authorized, false);
});

test('prefix-based tokens are strictly rejected (insecure prefix checks removed)', () => {
  assert.equal(validateCustomerToken(''), false);
  assert.equal(validateCustomerToken('abc'), false);
  assert.equal(validateCustomerToken('LIC-12345-67890'), false);
  assert.equal(validateCustomerToken('LIC-user-sig-extra'), false);
  assert.equal(validateCustomerToken('TOKEN_order_123_abc'), false);
  assert.equal(validateCustomerToken('adm_master_session'), false);
});

test('generates and validates cryptographically secure HMAC-SHA256 license tokens', () => {
  const validToken = generateLicenseToken({
    orderId: 'ORD-TEST-100',
    customerEmail: 'reader@example.com',
    paymentId: 'pay_test_123',
    expiresInDays: 30,
  });

  assert.ok(validToken.includes('.'), 'Token must contain payload and signature segments separated by dot');

  const check = verifyLicenseToken(validToken);
  assert.equal(check.valid, true);
  assert.equal(check.payload?.orderId, 'ORD-TEST-100');
  assert.equal(check.payload?.customerEmail, 'reader@example.com');
  assert.equal(check.payload?.paymentId, 'pay_test_123');
  assert.ok(check.payload?.exp && check.payload.exp > Date.now());

  assert.equal(validateCustomerToken(validToken), true);
});

test('rejects tampered signature in HMAC-SHA256 license token', () => {
  const validToken = generateLicenseToken({
    orderId: 'ORD-TAMPER-01',
    customerEmail: 'tamper@example.com',
    paymentId: 'pay_tamper_01',
  });

  const [payloadB64] = validToken.split('.');
  const forgedToken = `${payloadB64}.forged_tampered_signature_bytes`;

  const check = verifyLicenseToken(forgedToken);
  assert.equal(check.valid, false);
  assert.match(check.reason || '', /tampered|signature/i);
});

test('rejects tampered payload in HMAC-SHA256 license token', () => {
  const validToken = generateLicenseToken({
    orderId: 'ORD-ORIGINAL-01',
    customerEmail: 'original@example.com',
    paymentId: 'pay_orig_01',
  });

  const [, signature] = validToken.split('.');
  const tamperedPayload = Buffer.from(JSON.stringify({
    orderId: 'ORD-HACKED-01',
    customerEmail: 'hacker@example.com',
    paymentId: 'pay_orig_01',
    iat: Date.now(),
    exp: Date.now() + 100000,
  })).toString('base64url');

  const tamperedToken = `${tamperedPayload}.${signature}`;

  const check = verifyLicenseToken(tamperedToken);
  assert.equal(check.valid, false);
  assert.match(check.reason || '', /tampered|signature/i);
});

test('rejects expired HMAC-SHA256 license tokens', () => {
  // Generate token expired 1 day ago
  const expiredToken = generateLicenseToken({
    orderId: 'ORD-EXPIRED-01',
    customerEmail: 'expired@example.com',
    paymentId: 'pay_expired_01',
    expiresInDays: -1, // Expired in past
  });

  const check = verifyLicenseToken(expiredToken);
  assert.equal(check.valid, false);
  assert.match(check.reason || '', /expired/i);

  const auth = authorizeEbookAccess({ token: expiredToken });
  assert.equal(auth.authorized, false);
  assert.match(auth.reason || '', /expired/i);
});

test('authorizeEbookAccess validates orderId, paymentId, and customerEmail bindings', () => {
  const token = generateLicenseToken({
    orderId: 'ORD-BIND-01',
    customerEmail: 'bind@example.com',
    paymentId: 'pay_bind_01',
  });

  // Matching binding passes
  const matchResult = authorizeEbookAccess({
    token,
    orderId: 'ORD-BIND-01',
    paymentId: 'pay_bind_01',
    customerEmail: 'bind@example.com',
  });
  assert.equal(matchResult.authorized, true);

  // Mismatched orderId fails
  const badOrderResult = authorizeEbookAccess({
    token,
    orderId: 'ORD-WRONG-01',
  });
  assert.equal(badOrderResult.authorized, false);
  assert.match(badOrderResult.reason || '', /order ID/i);

  // Mismatched paymentId fails
  const badPaymentResult = authorizeEbookAccess({
    token,
    paymentId: 'pay_wrong_01',
  });
  assert.equal(badPaymentResult.authorized, false);
  assert.match(badPaymentResult.reason || '', /payment ID/i);

  // Mismatched email fails
  const badEmailResult = authorizeEbookAccess({
    token,
    customerEmail: 'impostor@example.com',
  });
  assert.equal(badEmailResult.authorized, false);
  assert.match(badEmailResult.reason || '', /customer email/i);
});

test('authorizeEbookAccess allows valid customer tokens via token or Authorization header', () => {
  const token = generateLicenseToken({
    orderId: 'ORD-AUTH-01',
    customerEmail: 'auth@example.com',
    paymentId: 'pay_auth_01',
  });

  const res1 = authorizeEbookAccess({ token });
  assert.equal(res1.authorized, true);

  const res2 = authorizeEbookAccess({ authorization: `Bearer ${token}` });
  assert.equal(res2.authorized, true);
});

test('getOfficialEbookStats resolves the private storage PDF file with >400KB size', () => {
  const stats = getOfficialEbookStats();
  assert.equal(stats.exists, true);
  assert.ok(stats.sizeBytes > 400000, `Expected PDF size > 400KB, got ${stats.sizeBytes}`);
  assert.equal(fs.existsSync(OFFICIAL_EBOOK_PATH), true);
  assert.equal(fs.existsSync(BACKUP_EBOOK_PATH), true);
});
