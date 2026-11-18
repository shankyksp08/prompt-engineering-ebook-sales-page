import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { toolkitProgressStore } from './toolkitProgressStore.ts';
import { generateLicenseToken } from '../auth/licenseVerifier.ts';
import { activeSessionStore } from '../auth/sessionStore.ts';
import {
  createEmptyToolkitProgress,
  toggleTaskInProgress,
  toggleWeekCompletionInProgress,
} from '../../utils/toolkitProgress.ts';
import toolkitProgressHandler from '../../../api/toolkit-progress.ts';

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as any,
    setHeader(k: string, v: string) {
      this.headers[k] = v;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
  };
  return res;
}

test('toolkitProgressStore persists across simulated cold restarts / device changes', async () => {
  const tempFile = path.join(os.tmpdir(), `dg-toolkit-test-${Date.now()}.json`);
  try {
    toolkitProgressStore.setStorageFilePathForTests(tempFile);

    let progress = createEmptyToolkitProgress();
    progress = toggleTaskInProgress(progress, 'w1-t1', 10000);
    progress = toggleWeekCompletionInProgress(progress, 2, 20000);

    await toolkitProgressStore.saveProgress('Reader.One@Example.com', progress);

    // Clear in-memory cache to simulate a brand new serverless cold start / second device login
    toolkitProgressStore.clearMemoryForTests();

    const restored = await toolkitProgressStore.getProgress('reader.one@example.com');
    assert.deepEqual(restored.completedWeeks, [2]);
    assert.equal(restored.completedTaskIds.includes('w1-t1'), true);
    assert.equal(restored.completedTaskIds.includes('w2-t4'), true);
    assert.equal(restored.lastCompletedActivity?.weekNumber, 2);
  } finally {
    toolkitProgressStore.setStorageFilePathForTests(null);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

test('/api/toolkit-progress blocks unauthenticated access and binds storage to signed customer email', async () => {
  const prevSecret = process.env.LICENSE_SIGNING_SECRET;
  const tempFile = path.join(os.tmpdir(), `dg-toolkit-api-${Date.now()}.json`);
  const tempSessionFile = path.join(os.tmpdir(), `dg-toolkit-sess-${Date.now()}.json`);
  process.env.LICENSE_SIGNING_SECRET = 'test_toolkit_signing_secret_32_chars_min';
  toolkitProgressStore.setStorageFilePathForTests(tempFile);
  activeSessionStore.setStorageFilePathForTests(tempSessionFile);

  try {
    // 1. Reject missing token
    const unauthRes = createMockResponse();
    await toolkitProgressHandler(
      { method: 'GET', headers: {} },
      unauthRes
    );
    assert.equal(unauthRes.statusCode, 401);

    // 2. Authenticate Device 1 with real active-session HMAC token
    const sess1 = await activeSessionStore.issueSingleSession({
      customerEmail: 'verified.buyer@digitalgovind.in',
      orderId: 'ORD_TOOLKIT_01',
      paymentId: 'pay_toolkit_01',
      deviceLabel: 'Device 1',
    });
    const token1 = generateLicenseToken({
      orderId: 'ORD_TOOLKIT_01',
      customerEmail: 'verified.buyer@digitalgovind.in',
      paymentId: 'pay_toolkit_01',
      sessionId: sess1.activeSessionId!,
    });

    const initialProgress = toggleTaskInProgress(createEmptyToolkitProgress(), 'w1-t2', 55555);
    const postRes = createMockResponse();
    await toolkitProgressHandler(
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token1}`,
          'x-order-id': 'ORD_TOOLKIT_01',
        },
        body: {
          customerEmail: 'attacker@evil.com', // Must be ignored in favor of signed token email
          progress: initialProgress,
        },
      },
      postRes
    );
    assert.equal(postRes.statusCode, 200);
    assert.equal(postRes.body.customerEmail, 'verified.buyer@digitalgovind.in');

    // 3. Simulate logging in from Device 2 -> restores toolkit progress and invalidates Device 1
    const sess2 = await activeSessionStore.issueSingleSession({
      customerEmail: 'verified.buyer@digitalgovind.in',
      orderId: 'ORD_TOOLKIT_01',
      paymentId: 'pay_toolkit_01',
      deviceLabel: 'Device 2',
    });
    const token2 = generateLicenseToken({
      orderId: 'ORD_TOOLKIT_01',
      customerEmail: 'verified.buyer@digitalgovind.in',
      paymentId: 'pay_toolkit_01',
      sessionId: sess2.activeSessionId!,
    });

    toolkitProgressStore.clearMemoryForTests();
    const getRes = createMockResponse();
    await toolkitProgressHandler(
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token2}`,
          'x-order-id': 'ORD_TOOLKIT_01',
        },
      },
      getRes
    );
    assert.equal(getRes.statusCode, 200);
    assert.deepEqual(getRes.body.progress.completedTaskIds, ['w1-t2']);
    assert.equal(getRes.body.progress.lastCompletedActivity?.taskId, 'w1-t2');

    // 4. Old Device 1 must now lose access to toolkit progress
    const oldDeviceRes = createMockResponse();
    await toolkitProgressHandler(
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token1}`,
          'x-order-id': 'ORD_TOOLKIT_01',
        },
      },
      oldDeviceRes
    );
    assert.equal(oldDeviceRes.statusCode, 401);
  } finally {
    toolkitProgressStore.setStorageFilePathForTests(null);
    activeSessionStore.setStorageFilePathForTests(null);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    if (fs.existsSync(tempSessionFile)) fs.unlinkSync(tempSessionFile);
    if (prevSecret === undefined) delete process.env.LICENSE_SIGNING_SECRET;
    else process.env.LICENSE_SIGNING_SECRET = prevSecret;
  }
});
