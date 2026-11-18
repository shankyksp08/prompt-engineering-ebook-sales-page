/**
 * Digital Govind — Prompt Engineering Handbook
 * Server-Side Single Active Session Store (One Active Device Per Customer)
 *
 * Maintains strictly ONE authoritative active session ID (`sessionId`) per verified
 * customer email. Logging in from any device atomically replaces the prior session ID,
 * immediately invalidating all previous browsers/devices on every protected API call.
 *
 * Storage tiers (automatic):
 * 1. Vercel KV / Upstash Redis REST API (when KV_REST_API_URL + KV_REST_API_TOKEN or
 *    UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars are configured)
 * 2. Persistent server-side JSON file (private_storage/.data/active-sessions.json,
 *    with automatic fallback to os.tmpdir()/dg-active-sessions/active-sessions.json)
 * 3. Serialized per-email promise lock in memory to prevent concurrent login races
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface CustomerSessionRecord {
  customerEmail: string;
  activeSessionId: string | null;
  orderId: string;
  paymentId: string;
  deviceLabel: string;
  issuedAt: number;
  lastActiveAt: number;
  expiresAt: number;
  invalidatedReason?: 'REPLACED' | 'LOGGED_OUT';
  updatedAt: number;
}

export type SessionValidationResult =
  | { valid: true; session: CustomerSessionRecord }
  | {
      valid: false;
      code: 'SESSION_REPLACED' | 'SESSION_ENDED' | 'SESSION_REQUIRED';
      message: string;
    };

const KV_SESSION_PREFIX = 'dg:session:v1:';
const DEFAULT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const SESSION_REPLACED_MESSAGE =
  'Your account was signed in on another device. This session has ended. Please sign in again.';
export const SESSION_ENDED_MESSAGE =
  'Your session has ended. Please sign in again.';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getKvConfig(): { url: string; token: string } | null {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (url && token) {
    return { url: url.replace(/\/+$/, ''), token };
  }
  return null;
}

class ActiveSessionStore {
  private memoryCache: Map<string, CustomerSessionRecord> = new Map();
  private emailLocks: Map<string, Promise<unknown>> = new Map();
  private customFilePath: string | null = null;
  private diskHydrated = false;

  public setStorageFilePathForTests(filePath: string | null): void {
    this.customFilePath = filePath;
    this.diskHydrated = false;
    this.memoryCache.clear();
  }

  public clearMemoryForTests(): void {
    this.memoryCache.clear();
    this.diskHydrated = false;
  }

  private async withEmailLock<T>(email: string, fn: () => Promise<T>): Promise<T> {
    const key = normalizeEmail(email);
    const prev = this.emailLocks.get(key) || Promise.resolve();
    const next = prev.then(fn, fn);
    this.emailLocks.set(
      key,
      next.catch(() => {})
    );
    try {
      return await next;
    } finally {
      if (this.emailLocks.get(key) === next) {
        this.emailLocks.delete(key);
      }
    }
  }

  private resolveStorageFilePath(): string {
    if (this.customFilePath) {
      return this.customFilePath;
    }
    if (process.env.ACTIVE_SESSION_FILE?.trim()) {
      return path.resolve(process.env.ACTIVE_SESSION_FILE.trim());
    }

    const privateDataDir = path.resolve(process.cwd(), 'private_storage', '.data');
    try {
      fs.mkdirSync(privateDataDir, { recursive: true });
      fs.accessSync(privateDataDir, fs.constants.W_OK);
      return path.join(privateDataDir, 'active-sessions.json');
    } catch {
      const tmpDir = path.join(os.tmpdir(), 'dg-active-sessions');
      fs.mkdirSync(tmpDir, { recursive: true });
      return path.join(tmpDir, 'active-sessions.json');
    }
  }

  private hydrateFromDisk(): void {
    if (this.diskHydrated) return;
    this.diskHydrated = true;

    try {
      const filePath = this.resolveStorageFilePath();
      if (!fs.existsSync(filePath)) return;

      const raw = fs.readFileSync(filePath, 'utf8');
      if (!raw.trim()) return;

      const parsed = JSON.parse(raw) as Record<string, CustomerSessionRecord>;
      if (!parsed || typeof parsed !== 'object') return;

      for (const [email, rec] of Object.entries(parsed)) {
        const key = normalizeEmail(email);
        if (key && rec && typeof rec === 'object') {
          this.memoryCache.set(key, rec);
        }
      }
    } catch (err: any) {
      console.warn('[SessionStore] Unable to read active sessions file:', err?.message || err);
    }
  }

  private flushToDisk(): void {
    try {
      const filePath = this.resolveStorageFilePath();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      const obj: Record<string, CustomerSessionRecord> = {};
      for (const [email, rec] of this.memoryCache.entries()) {
        obj[email] = rec;
      }

      const tmpPath = `${filePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(obj, null, 2), 'utf8');
      fs.renameSync(tmpPath, filePath);
    } catch (err: any) {
      console.warn('[SessionStore] Unable to write active sessions file:', err?.message || err);
    }
  }

  private async readFromKv(email: string): Promise<CustomerSessionRecord | null> {
    const kv = getKvConfig();
    if (!kv) return null;

    const key = encodeURIComponent(`${KV_SESSION_PREFIX}${normalizeEmail(email)}`);
    try {
      const res = await fetch(`${kv.url}/get/${key}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${kv.token}` },
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { result?: string | CustomerSessionRecord | null };
      if (!body || body.result == null) return null;
      const parsed = typeof body.result === 'string' ? JSON.parse(body.result) : body.result;
      return parsed && typeof parsed === 'object' ? (parsed as CustomerSessionRecord) : null;
    } catch (err: any) {
      console.warn('[SessionStore] KV read warning:', err?.message || err);
      return null;
    }
  }

  private async writeToKv(email: string, record: CustomerSessionRecord): Promise<void> {
    const kv = getKvConfig();
    if (!kv) return;

    const key = encodeURIComponent(`${KV_SESSION_PREFIX}${normalizeEmail(email)}`);
    try {
      await fetch(`${kv.url}/set/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kv.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
    } catch (err: any) {
      console.warn('[SessionStore] KV write warning:', err?.message || err);
    }
  }

  private async getRecord(email: string): Promise<CustomerSessionRecord | null> {
    const key = normalizeEmail(email);
    if (!key) return null;

    this.hydrateFromDisk();
    const localRec = this.memoryCache.get(key) || null;
    const kvRec = await this.readFromKv(key);

    if (kvRec && (!localRec || kvRec.updatedAt >= localRec.updatedAt)) {
      this.memoryCache.set(key, kvRec);
      return kvRec;
    }
    return localRec;
  }

  /**
   * Atomically creates ONE new active session for this verified customer,
   * automatically invalidating any previously active browser/device session.
   */
  public async issueSingleSession(params: {
    customerEmail: string;
    orderId: string;
    paymentId: string;
    deviceLabel?: string;
    ttlMs?: number;
  }): Promise<CustomerSessionRecord> {
    const key = normalizeEmail(params.customerEmail);
    if (!key) {
      throw new Error('Customer email is required to issue an active session.');
    }

    return this.withEmailLock(key, async () => {
      this.hydrateFromDisk();
      const now = Date.now();
      const sessionId = crypto.randomBytes(24).toString('base64url');
      const ttl = typeof params.ttlMs === 'number' ? params.ttlMs : DEFAULT_SESSION_TTL_MS;

      const record: CustomerSessionRecord = {
        customerEmail: key,
        activeSessionId: sessionId,
        orderId: params.orderId.trim(),
        paymentId: params.paymentId.trim(),
        deviceLabel: (params.deviceLabel || 'Web Browser').trim().slice(0, 80),
        issuedAt: now,
        lastActiveAt: now,
        expiresAt: now + ttl,
        updatedAt: now,
      };

      this.memoryCache.set(key, record);
      this.flushToDisk();
      await this.writeToKv(key, record);
      return record;
    });
  }

  /**
   * Validates whether the caller's sessionId (`sid`) is still the single active session
   * for this customer account. Does NOT rotate or mint a new session (safe on page refresh).
   */
  public async validateSession(
    customerEmail: string,
    sessionId: string | undefined | null
  ): Promise<SessionValidationResult> {
    const key = normalizeEmail(customerEmail);
    if (!key || !sessionId || typeof sessionId !== 'string') {
      return {
        valid: false,
        code: 'SESSION_REQUIRED',
        message: SESSION_ENDED_MESSAGE,
      };
    }

    const record = await this.getRecord(key);
    if (!record) {
      return {
        valid: false,
        code: 'SESSION_ENDED',
        message: SESSION_ENDED_MESSAGE,
      };
    }

    if (!record.activeSessionId) {
      return {
        valid: false,
        code: record.invalidatedReason === 'REPLACED' ? 'SESSION_REPLACED' : 'SESSION_ENDED',
        message:
          record.invalidatedReason === 'REPLACED'
            ? SESSION_REPLACED_MESSAGE
            : SESSION_ENDED_MESSAGE,
      };
    }

    if (Date.now() > record.expiresAt) {
      return {
        valid: false,
        code: 'SESSION_ENDED',
        message: SESSION_ENDED_MESSAGE,
      };
    }

    // Constant-time comparison between token sid and active server session ID
    const providedBuf = Buffer.from(sessionId.trim(), 'utf8');
    const activeBuf = Buffer.from(record.activeSessionId, 'utf8');
    const matches =
      providedBuf.length === activeBuf.length &&
      crypto.timingSafeEqual(providedBuf, activeBuf);

    if (!matches) {
      return {
        valid: false,
        code: 'SESSION_REPLACED',
        message: SESSION_REPLACED_MESSAGE,
      };
    }

    return { valid: true, session: record };
  }

  /**
   * Updates lastActiveAt timestamp for the currently valid active session without changing sessionId.
   */
  public async touchSession(customerEmail: string, sessionId: string): Promise<void> {
    const key = normalizeEmail(customerEmail);
    if (!key || !sessionId) return;

    await this.withEmailLock(key, async () => {
      const record = await this.getRecord(key);
      if (!record || record.activeSessionId !== sessionId.trim()) return;

      const now = Date.now();
      // Throttle disk writes to once every 30s on repeated reads
      if (now - record.lastActiveAt < 30_000) return;

      const updated: CustomerSessionRecord = {
        ...record,
        lastActiveAt: now,
        updatedAt: now,
      };
      this.memoryCache.set(key, updated);
      this.flushToDisk();
      await this.writeToKv(key, updated);
    });
  }

  /**
   * Invalidates the active server-side session when the customer manually signs out
   * (or when revoking access). Future logins remain allowed normally.
   */
  public async revokeSession(
    customerEmail: string,
    sessionId?: string | null
  ): Promise<boolean> {
    const key = normalizeEmail(customerEmail);
    if (!key) return false;

    return this.withEmailLock(key, async () => {
      const record = await this.getRecord(key);
      if (!record) return false;

      // Do not allow an already-replaced old session to accidentally log out the NEW device!
      if (sessionId && record.activeSessionId && record.activeSessionId !== sessionId.trim()) {
        return false;
      }

      const now = Date.now();
      const updated: CustomerSessionRecord = {
        ...record,
        activeSessionId: null,
        invalidatedReason: 'LOGGED_OUT',
        updatedAt: now,
      };

      this.memoryCache.set(key, updated);
      this.flushToDisk();
      await this.writeToKv(key, updated);
      return true;
    });
  }
}

export const activeSessionStore = new ActiveSessionStore();
