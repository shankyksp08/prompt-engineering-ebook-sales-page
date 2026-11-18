import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyRazorpayPaymentServerSide,
  findVerifiedPaymentByEmailServerSide,
  findVerifiedPaymentByOrderOrLinkIdServerSide,
  extractAndValidateWebhookEvent,
  setMockRazorpayPayment,
  setMockRazorpayPaymentLink,
  clearMockRazorpayData,
} from './paymentVerifier.ts';

describe('Razorpay Server-Side Payment Lookup & Login Verification', () => {
  beforeEach(() => {
    clearMockRazorpayData();
  });

  afterEach(() => {
    clearMockRazorpayData();
  });

  it('matches captured ₹99 INR payment by email on email-only sign-in', async () => {
    setMockRazorpayPayment({
      id: 'pay_captured_email_01',
      entity: 'payment',
      amount: 9900,
      currency: 'INR',
      status: 'captured',
      captured: true,
      email: 'reader@example.com',
      contact: '+919876543210',
      order_id: 'order_ABC123',
      amount_refunded: 0,
    });

    const result = await findVerifiedPaymentByEmailServerSide({
      email: 'Reader@Example.com',
    });

    assert.equal(result.verified, true);
    assert.equal(result.httpStatus, 200);
    assert.equal(result.payment?.id, 'pay_captured_email_01');
    assert.equal(result.customerEmail, 'reader@example.com');
    assert.equal(result.orderId, 'order_ABC123');
  });

  it('ignores void@razorpay.com placeholder and never grants access on email-only login without real email match', async () => {
    setMockRazorpayPayment({
      id: 'pay_upi_void_only',
      entity: 'payment',
      amount: 9900,
      currency: 'INR',
      status: 'captured',
      captured: true,
      email: 'void@razorpay.com',
      order_id: 'order_VOID01',
      amount_refunded: 0,
    });

    const voidAttempt = await findVerifiedPaymentByEmailServerSide({
      email: 'void@razorpay.com',
    });
    assert.equal(voidAttempt.verified, false);
    assert.equal(voidAttempt.httpStatus, 400);

    const userAttempt = await findVerifiedPaymentByEmailServerSide({
      email: 'buyer@example.com',
    });
    assert.equal(userAttempt.verified, false);
    assert.equal(userAttempt.httpStatus, 404);
  });

  it('rejects uncaptured, wrong-amount, or refunded payments during email lookup', async () => {
    setMockRazorpayPayment({
      id: 'pay_auth_only',
      entity: 'payment',
      amount: 9900,
      currency: 'INR',
      status: 'authorized',
      captured: false,
      email: 'pending@example.com',
      amount_refunded: 0,
    });
    setMockRazorpayPayment({
      id: 'pay_wrong_amount',
      entity: 'payment',
      amount: 100,
      currency: 'INR',
      status: 'captured',
      captured: true,
      email: 'cheap@example.com',
      amount_refunded: 0,
    });
    setMockRazorpayPayment({
      id: 'pay_refunded',
      entity: 'payment',
      amount: 9900,
      currency: 'INR',
      status: 'captured',
      captured: true,
      email: 'refunded@example.com',
      amount_refunded: 9900,
    });

    assert.equal((await findVerifiedPaymentByEmailServerSide({ email: 'pending@example.com' })).verified, false);
    assert.equal((await findVerifiedPaymentByEmailServerSide({ email: 'cheap@example.com' })).verified, false);
    assert.equal((await findVerifiedPaymentByEmailServerSide({ email: 'refunded@example.com' })).verified, false);
  });

  it('resolves captured payment from Razorpay order_..., plink_..., and ORD-... identifiers', async () => {
    setMockRazorpayPaymentLink({
      id: 'plink_OFFICIAL01',
      entity: 'payment_link',
      amount: 9900,
      amount_paid: 9900,
      currency: 'INR',
      status: 'paid',
      short_url: 'https://rzp.io/rzp/aGZfHfs',
      customer: {
        name: 'Aarav Sharma',
        email: 'aarav@example.com',
      },
      payments: [
        {
          payment_id: 'pay_LINK99',
          amount: 9900,
          status: 'captured',
        },
      ],
    });

    setMockRazorpayPayment({
      id: 'pay_LINK99',
      entity: 'payment',
      amount: 9900,
      currency: 'INR',
      status: 'captured',
      captured: true,
      email: 'void@razorpay.com',
      invoice_id: 'plink_OFFICIAL01',
      order_id: 'order_LINKORDER99',
      amount_refunded: 0,
    });

    const byOrder = await findVerifiedPaymentByOrderOrLinkIdServerSide({
      identifier: 'order_LINKORDER99',
    });
    assert.equal(byOrder.verified, true);
    assert.equal(byOrder.customerEmail, 'aarav@example.com');

    const byLink = await findVerifiedPaymentByOrderOrLinkIdServerSide({
      identifier: 'plink_OFFICIAL01',
    });
    assert.equal(byLink.verified, true);
    assert.equal(byLink.payment?.id, 'pay_LINK99');

    const byGeneratedOrd = await findVerifiedPaymentByOrderOrLinkIdServerSide({
      identifier: 'ORD-LINK99',
    });
    assert.equal(byGeneratedOrd.verified, true);
    assert.equal(byGeneratedOrd.payment?.id, 'pay_LINK99');
  });

  it('does not falsely reject underlying inv_ invoice entities whose short_url uses /i/ instead of /rzp/aGZfHfs', async () => {
    setMockRazorpayPaymentLink({
      id: 'inv_XYZ123',
      entity: 'invoice',
      amount: 9900,
      amount_paid: 9900,
      currency: 'INR',
      status: 'paid',
      short_url: 'https://rzp.io/i/inv_XYZ123',
      customer: {
        email: 'invoicebuyer@example.com',
      },
    });

    setMockRazorpayPayment({
      id: 'pay_INV99',
      entity: 'payment',
      amount: 9900,
      currency: 'INR',
      status: 'captured',
      captured: true,
      email: 'void@razorpay.com',
      invoice_id: 'inv_XYZ123',
      notes: { email: 'invoicebuyer@example.com' },
      amount_refunded: 0,
    });

    const result = await verifyRazorpayPaymentServerSide({
      paymentId: 'pay_INV99',
    });

    assert.equal(result.verified, true);
    assert.equal(result.customerEmail, 'invoicebuyer@example.com');
  });

  it('webhook validator skips void@razorpay.com and picks real email from payment_link or notes', () => {
    const validated = extractAndValidateWebhookEvent(
      {
        event: 'payment_link.paid',
        payload: {
          payment: {
            entity: {
              id: 'pay_WEBHOOK01',
              amount: 9900,
              currency: 'INR',
              status: 'captured',
              email: 'void@razorpay.com',
              notes: { email: 'realuser@example.com' },
            },
          },
          payment_link: {
            entity: {
              id: 'plink_WEBHOOK01',
              amount: 9900,
              currency: 'INR',
              status: 'paid',
              customer: {
                name: 'Real User',
                email: 'realuser@example.com',
              },
            },
          },
        },
      },
      { expectedAmountPaise: 9900, strictAmountCheck: true }
    );

    assert.equal(validated.isValid, true);
    assert.equal(validated.details?.customerEmail, 'realuser@example.com');
  });
});
