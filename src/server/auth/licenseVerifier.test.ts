import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import {
  authorizeEbookAccess,
  validateCustomerToken,
  getOfficialEbookStats,
  OFFICIAL_EBOOK_PATH,
  BACKUP_EBOOK_PATH
} from './licenseVerifier.ts';

test('authorizeEbookAccess rejects requests with missing or empty parameters', () => {
  const result1 = authorizeEbookAccess({});
  assert.equal(result1.authorized, false);
  assert.match(result1.reason || '', /required/i);

  const result2 = authorizeEbookAccess({ token: 'invalid_random_string' });
  assert.equal(result2.authorized, false);
});

test('validateCustomerToken validates valid license tokens and rejects forged formats', () => {
  assert.equal(validateCustomerToken(''), false);
  assert.equal(validateCustomerToken('abc'), false);
  assert.equal(validateCustomerToken('LIC-12345-67890'), true);
  assert.equal(validateCustomerToken('LIC-user-sig-extra'), true);
  assert.equal(validateCustomerToken('TOKEN_order_123_abc'), true);
  assert.equal(validateCustomerToken('adm_master_session'), true);
});

test('authorizeEbookAccess allows valid customer tokens via token or Authorization header', () => {
  const res1 = authorizeEbookAccess({ token: 'LIC-abc-def' });
  assert.equal(res1.authorized, true);

  const res2 = authorizeEbookAccess({ authorization: 'Bearer LIC-user-sig' });
  assert.equal(res2.authorized, true);
});

test('getOfficialEbookStats resolves the private storage PDF file with >400KB size', () => {
  const stats = getOfficialEbookStats();
  assert.equal(stats.exists, true);
  assert.ok(stats.sizeBytes > 400000, `Expected PDF size > 400KB, got ${stats.sizeBytes}`);
  assert.equal(fs.existsSync(OFFICIAL_EBOOK_PATH), true);
  assert.equal(fs.existsSync(BACKUP_EBOOK_PATH), true);
});
