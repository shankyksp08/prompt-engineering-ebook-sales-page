import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyRazorpayPaymentServerSide,
  setMockRazorpayPayment,
  setMockRazorpayPaymentLink,
  clearMockRazorpayData,
  RazorpayPaymentEntity,
  RazorpayPaymentLinkEntity,
} from './paymentVerifier.ts';
import { orderFulfillmentStore } from './orderStore.ts';
import { generateLicenseToken, verifyLicenseToken } from '../auth/licenseVerifier.ts';

// Set test environment secrets
process.env.LICENSE_SIGNING_SECRET = 'test_secret_for_license_verification_1234567890';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_developer_only';
process.env.RAZORPAY_KEY_ID = 'rzp_test_mock_12345';
process.env.RAZORPAY_KEY_SECRET = 'mock_secret_abcdef12345';

test('Rejects missing or empty payment ID with HTTP 400', async () => {
  const res1 = await verifyRazorpayPaymentServerSide({ paymentId: '' });
  assert.equal(res1.verified, false);
  assert.equal(res1.httpStatus, 400);
  assert.equal(res1.error, 'MISSING_PAYMENT_ID');

  const res2 = await verifyRazorpayPaymentServerSide({ paymentId: '   ' });
  assert.equal(res2.verified, false);
  assert.equal(res2.httpStatus, 400);
});

test('Rejects failed payment status with HTTP 400 PAYMENT_NOT_CAPTURED', async () => {
  clearMockRazorpayData();
  setMockRazorpayPayment({
    id: 'pay_failed_test_001',
    entity: 'payment',
    amount: 9900,
    currency: 'INR',
    status: 'failed',
    error_description: 'Payment was declined by customer bank',
  });

  const res = await verifyRazorpayPaymentServerSide({ paymentId: 'pay_failed_test_001' });
  assert.equal(res.verified, false);
  assert.equal(res.httpStatus, 400);
  assert.equal(res.error, 'PAYMENT_NOT_CAPTURED');
  assert.match(res.message || '', /declined/i);
});

test('Rejects authorized (uncaptured) payments with HTTP 400', async () => {
  clearMockRazorpayData();
  setMockRazorpayPayment({
    id: 'pay_auth_only_999',
    entity: 'payment',
    amount: 9900,
    currency: 'INR',
    status: 'authorized',
    captured: false,
    email: 'customer@example.com',
  });

  const res = await verifyRazorpayPaymentServerSide({ paymentId: 'pay_auth_only_999' });
  assert.equal(res.verified, false);
  assert.equal(res.httpStatus, 400);
  assert.equal(res.error, 'PAYMENT_NOT_CAPTURED');
  assert.match(res.message || '', /authorized but not yet captured/i);
});

test('Rejects underpaid amount (must be exactly 9900 paise = ₹99)', async () => {
  clearMockRazorpayData();
  setMockRazorpayPayment({
    id: 'pay_cheap_amount_123',
    entity: 'payment',
    amount: 4900, // ₹49 instead of ₹99
    currency: 'INR',
    status: 'captured',
    captured: true,
    email: 'hacker@discount.com',
  });

  const res = await verifyRazorpayPaymentServerSide({ paymentId: 'pay_cheap_amount_123' });
  assert.equal(res.verified, false);
  assert.equal(res.httpStatus, 400);
  assert.equal(res.error, 'AMOUNT_MISMATCH');
  assert.match(res.message || '', /4900/);
});

test('Rejects currency mismatch (must be INR)', async () => {
  clearMockRazorpayData();
  setMockRazorpayPayment({
    id: 'pay_usd_currency_456',
    entity: 'payment',
    amount: 9900,
    currency: 'USD',
    status: 'captured',
    captured: true,
    email: 'customer@usd.com',
  });

  const res = await verifyRazorpayPaymentServerSide({ paymentId: 'pay_usd_currency_456' });
  assert.equal(res.verified, false);
  assert.equal(res.httpStatus, 400);
  assert.equal(res.error, 'CURRENCY_MISMATCH');
  assert.match(res.message || '', /USD/);
});

test('Rejects refunded payment with amount_refunded > 0', async () => {
  clearMockRazorpayData();
  setMockRazorpayPayment({
    id: 'pay_refunded_789',
    entity: 'payment',
    amount: 9900,
    currency: 'INR',
    status: 'captured',
    captured: true,
    amount_refunded: 9900,
    refund_status: 'full',
    email: 'refunded@buyer.com',
  });

  const res = await verifyRazorpayPaymentServerSide({ paymentId: 'pay_refunded_789' });
  assert.equal(res.verified, false);
  assert.equal(res.httpStatus, 400);
  assert.equal(res.error, 'PAYMENT_REFUNDED');
});

test('Rejects payment associated with unauthorized payment link', async () => {
  clearMockRazorpayData();
  setMockRazorpayPayment({
    id: 'pay_link_mismatch_321',
    entity: 'payment',
    amount: 9900,
    currency: 'INR',
    status: 'captured',
    captured: true,
    invoice_id: 'plink_unauth_99',
    email: 'buyer@test.com',
  });

  setMockRazorpayPaymentLink({
    id: 'plink_unauth_99',
    amount: 9900,
    amount_paid: 9900,
    currency: 'INR',
    status: 'paid',
    short_url: 'https://rzp.io/rzp/unauthorizedShortCode',
    payments: [{ payment_id: 'pay_link_mismatch_321', amount: 9900, status: 'captured' }],
  });

  const res = await verifyRazorpayPaymentServerSide({
    paymentId: 'pay_link_mismatch_321',
    paymentLinkId: 'plink_unauth_99',
  });

  assert.equal(res.verified, false);
  assert.equal(res.httpStatus, 400);
  assert.equal(res.error, 'PAYMENT_LINK_UNAUTHORIZED');
});

test('Verifies authentic captured payment matching ₹99 and official payment link', async () => {
  clearMockRazorpayData();
  const mockPayId = 'pay_legit_success_888';
  const mockLinkId = 'plink_official_aGZfHfs';

  setMockRazorpayPayment({
    id: mockPayId,
    entity: 'payment',
    amount: 9900,
    currency: 'INR',
    status: 'captured',
    captured: true,
    invoice_id: mockLinkId,
    email: 'official.reader@gmail.com',
    contact: '+919876543210',
    description: 'Prompt Engineering Handbook',
  });

  setMockRazorpayPaymentLink({
    id: mockLinkId,
    amount: 9900,
    amount_paid: 9900,
    currency: 'INR',
    status: 'paid',
    short_url: 'https://rzp.io/rzp/aGZfHfs',
    customer: {
      name: 'Govind Reader',
      email: 'official.reader@gmail.com',
      contact: '+919876543210',
    },
    payments: [{ payment_id: mockPayId, amount: 9900, status: 'captured' }],
  });

  const res = await verifyRazorpayPaymentServerSide({
    paymentId: mockPayId,
    paymentLinkId: mockLinkId,
  });

  assert.equal(res.verified, true);
  assert.equal(res.httpStatus, 200);
  assert.equal(res.customerEmail, 'official.reader@gmail.com');
  assert.equal(res.customerPhone, '+919876543210');
  assert.equal(res.customerName, 'Govind Reader');
  assert.equal(res.orderId, mockLinkId);
});

test('Order store correctly records fulfilled order and prevents duplicates (idempotency)', () => {
  orderFulfillmentStore.clear();

  const orderId = 'ORD_IDEMPOTENT_TEST_99';
  const paymentId = 'pay_idempotent_test_99';
  const token = generateLicenseToken({
    orderId,
    customerEmail: 'idempotent@test.com',
    paymentId,
    expiresInDays: 365,
  });

  const license = {
    orderId,
    paymentId,
    customerEmail: 'idempotent@test.com',
    customerName: 'Idempotent Tester',
    amount: '₹99',
    currency: 'INR',
    verifiedAt: Date.now(),
    token,
    status: 'active' as const,
    maxDevices: 2,
    downloadUrl: `/api/download-ebook?token=${encodeURIComponent(token)}&orderId=${orderId}`,
    readerStreamUrl: `/api/stream-pdf?token=${encodeURIComponent(token)}&orderId=${orderId}`,
  };

  orderFulfillmentStore.set({
    orderId,
    paymentId,
    customerEmail: 'idempotent@test.com',
    customerName: 'Idempotent Tester',
    amountPaise: 9900,
    amountFormatted: '₹99',
    currency: 'INR',
    verifiedAt: Date.now(),
    licenseToken: token,
    license,
    status: 'fulfilled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Verify retrieval
  const retrieved = orderFulfillmentStore.getByPaymentId(paymentId);
  assert.ok(retrieved);
  assert.equal(retrieved.license.token, token);
  assert.equal(retrieved.orderId, orderId);

  // Verify token cryptographically
  const verifiedTok = verifyLicenseToken(retrieved.license.token);
  assert.equal(verifiedTok.valid, true);
  assert.equal(verifiedTok.payload?.paymentId, paymentId);
});
