import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashSimple,
  generateLicenseToken,
  parseRazorpayPaymentParams,
  isServerSignedLicense,
  verifyAdminPasscode,
} from './security.ts';

test('hashSimple produces deterministic non-empty string', () => {
  const hash1 = hashSimple('test@example.com');
  const hash2 = hashSimple('test@example.com');
  const hash3 = hashSimple('other@example.com');
  assert.equal(hash1, hash2);
  assert.notEqual(hash1, hash3);
  assert.ok(hash1.length > 0);
});

test('generateLicenseToken generates formatted license token', () => {
  const token = generateLicenseToken('buyer@gmail.com', 'pay_12345', 1700000000000);
  assert.ok(token.startsWith('LIC-'));
  assert.ok(token.includes('-'));
});

test('parseRazorpayPaymentParams detects paid status and rejects explicit failure statuses', () => {
  const valid = '?razorpay_payment_id=pay_123&razorpay_payment_link_id=plink_456&razorpay_payment_link_status=paid';
  const result = parseRazorpayPaymentParams(valid);
  assert.equal(result.isPaid, true);
  assert.equal(result.paymentId, 'pay_123');
  assert.equal(result.paymentLinkId, 'plink_456');

  const failed = '?razorpay_payment_id=pay_123&razorpay_payment_link_status=failed';
  assert.equal(parseRazorpayPaymentParams(failed).isPaid, false);

  const cancelled = '?razorpay_payment_id=pay_123&razorpay_payment_link_status=cancelled';
  assert.equal(parseRazorpayPaymentParams(cancelled).isPaid, false);

  const unpaid = '?razorpay_payment_link_status=created';
  const resultUnpaid = parseRazorpayPaymentParams(unpaid);
  assert.equal(resultUnpaid.isPaid, false);

  const empty = '';
  assert.equal(parseRazorpayPaymentParams(empty).isPaid, false);
});

test('isServerSignedLicense validates server-issued signed tokens and rejects legacy LIC- tokens', () => {
  assert.equal(isServerSignedLicense(null), false);
  assert.equal(
    isServerSignedLicense({
      orderId: 'ORD-1',
      paymentId: 'pay_1',
      customerEmail: 'a@b.com',
      amount: '₹99',
      currency: 'INR',
      verifiedAt: Date.now(),
      token: 'LIC-FAKE-TOKEN',
      status: 'active',
      maxDevices: 2,
      activeDevices: [],
    }),
    false
  );
  assert.equal(
    isServerSignedLicense({
      orderId: 'ORD-1',
      paymentId: 'pay_1',
      customerEmail: 'a@b.com',
      amount: '₹99',
      currency: 'INR',
      verifiedAt: Date.now(),
      token: 'eyJvcmRlcklkIjoiT1JELTEifQ.c2lnbmF0dXJl',
      status: 'active',
      maxDevices: 2,
      activeDevices: [],
    }),
    true
  );
});

test('verifyAdminPasscode checks admin passcode correctly', () => {
  assert.equal(verifyAdminPasscode('admin2026'), true);
  assert.equal(verifyAdminPasscode('wrongpassword'), false);
  assert.equal(verifyAdminPasscode(''), false);
});

