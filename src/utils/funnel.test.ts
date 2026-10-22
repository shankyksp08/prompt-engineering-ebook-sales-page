import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidCheckoutUrl,
  isValidDownloadUrl,
  parsePriceNumber,
  calculateDiscountPercent,
  isValidEmail,
  formatByteSize,
  READING_PATHS
} from './funnel.ts';

test('isValidCheckoutUrl correctly identifies placeholders and real links', () => {
  assert.equal(isValidCheckoutUrl(''), false);
  assert.equal(isValidCheckoutUrl('REPLACE_WITH_MY_PAYMENT_CHECKOUT_URL'), false);
  assert.equal(isValidCheckoutUrl('https://rzp.io/rzp/aGZfHfs'), true);
  assert.equal(isValidCheckoutUrl('https://buy.stripe.com/test_12345'), true);
  assert.equal(isValidCheckoutUrl('https://mybusiness.lemonsqueezy.com/buy/xyz'), true);
  assert.equal(isValidCheckoutUrl('not-a-valid-url'), false);
});

test('isValidDownloadUrl detects valid pdf files and local endpoints', () => {
  assert.equal(isValidDownloadUrl(''), false);
  assert.equal(isValidDownloadUrl('REPLACE_WITH_YOUR_EBOOK_DOWNLOAD_URL'), false);
  assert.equal(isValidDownloadUrl('/assets/aistudio/Prompt_Engineering_Handbook_d0bf9480.pdf'), true);
  assert.equal(isValidDownloadUrl('https://storage.googleapis.com/bucket/handbook.pdf'), true);
});

test('parsePriceNumber parses valid currencies and formats', () => {
  assert.equal(parsePriceNumber('$29'), 29);
  assert.equal(parsePriceNumber('₹99'), 99);
  assert.equal(parsePriceNumber('$49.00'), 49);
  assert.equal(parsePriceNumber('29 USD'), 29);
  assert.equal(parsePriceNumber('invalid'), null);
});

test('calculateDiscountPercent calculates honest discount when applicable', () => {
  assert.equal(calculateDiscountPercent('$29', '$49'), 41);
  assert.equal(calculateDiscountPercent('$29', '$29'), null);
  assert.equal(calculateDiscountPercent('$50', '$40'), null);
  assert.equal(calculateDiscountPercent('$29', undefined), null);
});

test('isValidEmail detects valid support email addresses', () => {
  assert.equal(isValidEmail('supportdigitalgovind@gmail.com'), true);
  assert.equal(isValidEmail('support@promptengineeringhandbook.com'), true);
  assert.equal(isValidEmail('SET_MY_SUPPORT_EMAIL'), false);
  assert.equal(isValidEmail('bademail@'), false);
});

test('formatByteSize formats file sizes properly', () => {
  assert.equal(formatByteSize(500), '500 B');
  assert.equal(formatByteSize(312320), '305 KB');
  assert.equal(formatByteSize(2097152), '2.0 MB');
});

test('READING_PATHS contains 3 core paths from Preface', () => {
  assert.equal(READING_PATHS.length, 3);
  assert.equal(READING_PATHS[0].id, '30-minute');
  assert.equal(READING_PATHS[1].id, 'practical');
  assert.equal(READING_PATHS[2].id, 'builder');
  assert.ok(READING_PATHS[0].recommendedTopics.length > 3);
});
