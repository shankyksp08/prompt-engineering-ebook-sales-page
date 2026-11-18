/**
 * Digital Govind — Prompt Engineering Handbook
 * Server-Side Customer Learning Toolkit Progress Store
 *
 * Persists 4-week toolkit progress against the authenticated customer account (email)
 * so verified customers restore their exact checklist, completed weeks, and last activity
 * when signing in from another device or session.
 *
 * Storage tiers (automatic):
 * 1. Vercel KV / Upstash Redis REST API (when KV_REST_API_URL + KV_REST_API_TOKEN or
 *    UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars are configured)
 * 2. Persistent server-side JSON file (private_storage/.data/toolkit-progress.json,
 *    with automatic fallback to os.tmpdir()/dg-toolkit-progress.json on read-only serverless FS)
 * 3. In-memory synchronized Map cache
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ToolkitProgressState,
  createEmptyToolkitProgress,
  sanitizeToolkitProgress,
  selectAuthoritativeProgress,
} from '../../utils/toolkitProgress.ts';

const KV_KEY_PREFIX = 'dg:toolkit:v1:';

function normalizeCustomerKey(email: string): string {
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

class ToolkitProgressStore {
  private memoryCache: Map<string, ToolkitProgressState> = new Map();
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

  private resolveStorageFilePath(): string {
    if (this.customFilePath) {
      return this.customFilePath;
    }
    if (process.env.TOOLKIT_PROGRESS_FILE?.trim()) {
      return path.resolve(process.env.TOOLKIT_PROGRESS_FILE.trim());
    }

    const privateDataDir = path.resolve(process.cwd(), 'private_storage', '.data');
    try {
      fs.mkdirSync(privateDataDir, { recursive: true });
      fs.accessSync(privateDataDir, fs.constants.W_OK);
      return path.join(privateDataDir, 'toolkit-progress.json');
    } catch {
      const tmpDir = path.join(os.tmpdir(), 'dg-toolkit-progress');
      fs.mkdirSync(tmpDir, { recursive: true });
      return path.join(tmpDir, 'toolkit-progress.json');
    }
  }

  private hydrateFromDisk(): void {
    if (this.diskHydrated) return;
    this.diskHydrated = true;

    try {
      const filePath = this.resolveStorageFilePath();
      if (!fs.existsSync(filePath)) return;

      const rawText = fs.readFileSync(filePath, 'utf8');
      if (!rawText.trim()) return;

      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') return;

      for (const [email, value] of Object.entries(parsed)) {
        const key = normalizeCustomerKey(email);
        if (key) {
          this.memoryCache.set(key, sanitizeToolkitProgress(value));
        }
      }
    } catch (err: any) {
      console.warn('[ToolkitStore] Unable to read persisted progress file:', err?.message || err);
    }
  }

  private flushToDisk(): void {
    try {
      const filePath = this.resolveStorageFilePath();
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });

      const serialized: Record<string, ToolkitProgressState> = {};
      for (const [key, value] of this.memoryCache.entries()) {
        serialized[key] = value;
      }

      const tmpPath = `${filePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(serialized, null, 2), 'utf8');
      fs.renameSync(tmpPath, filePath);
    } catch (err: any) {
      console.warn('[ToolkitStore] Unable to write progress file:', err?.message || err);
    }
  }

  private async readFromKv(customerEmail: string): Promise<ToolkitProgressState | null> {
    const kv = getKvConfig();
    if (!kv) return null;

    const key = encodeURIComponent(`${KV_KEY_PREFIX}${normalizeCustomerKey(customerEmail)}`);
    try {
      const res = await fetch(`${kv.url}/get/${key}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${kv.token}`,
        },
      });
      if (!res.ok) return null;

      const body = (await res.json()) as { result?: string | ToolkitProgressState | null };
      if (!body || body.result == null) return null;

      const parsed = typeof body.result === 'string' ? JSON.parse(body.result) : body.result;
      return sanitizeToolkitProgress(parsed);
    } catch (err: any) {
      console.warn('[ToolkitStore] KV read warning:', err?.message || err);
      return null;
    }
  }

  private async writeToKv(customerEmail: string, progress: ToolkitProgressState): Promise<void> {
    const kv = getKvConfig();
    if (!kv) return;

    const key = `${KV_KEY_PREFIX}${normalizeCustomerKey(customerEmail)}`;
    try {
      await fetch(`${kv.url}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kv.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progress),
      });
    } catch (err: any) {
      console.warn('[ToolkitStore] KV write warning:', err?.message || err);
    }
  }

  public async getProgress(customerEmail: string): Promise<ToolkitProgressState> {
    const key = normalizeCustomerKey(customerEmail);
    if (!key) {
      return createEmptyToolkitProgress();
    }

    this.hydrateFromDisk();
    const localProgress = this.memoryCache.get(key) || createEmptyToolkitProgress();

    const kvProgress = await this.readFromKv(key);
    if (kvProgress) {
      const authoritative = selectAuthoritativeProgress(localProgress, kvProgress);
      this.memoryCache.set(key, authoritative);
      return authoritative;
    }

    return localProgress;
  }

  public async saveProgress(
    customerEmail: string,
    incomingRaw: unknown
  ): Promise<ToolkitProgressState> {
    const key = normalizeCustomerKey(customerEmail);
    if (!key) {
      throw new Error('Customer email is required to persist toolkit progress.');
    }

    this.hydrateFromDisk();
    const sanitized = sanitizeToolkitProgress(incomingRaw);
    const stamped: ToolkitProgressState = {
      ...sanitized,
      updatedAt: sanitized.updatedAt > 0 ? sanitized.updatedAt : Date.now(),
    };

    this.memoryCache.set(key, stamped);
    this.flushToDisk();
    await this.writeToKv(key, stamped);

    return stamped;
  }
}

export const toolkitProgressStore = new ToolkitProgressStore();
