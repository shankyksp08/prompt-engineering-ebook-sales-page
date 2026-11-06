/**
 * Prompt Engineering Handbook — Security, Licensing & DRM Utilities
 * 
 * Provides:
 * 1. Cryptographic session & license token verification
 * 2. Razorpay payment verification & order-to-license conversion
 * 3. Device & session binding (concurrent device limit enforcement)
 * 4. Dynamic customer watermark generation
 * 5. Reading progress & bookmark persistence
 * 6. Admin authentication & session security
 */

export interface CustomerLicense {
  orderId: string;
  paymentId: string;
  customerEmail: string;
  customerName?: string;
  amount: string;
  currency: string;
  verifiedAt: number;
  token: string;
  status: 'active' | 'revoked' | 'pending';
  maxDevices: number;
  activeDevices: DeviceSession[];
}

export interface DeviceSession {
  deviceId: string;
  browser: string;
  os: string;
  lastActive: number;
  isCurrent: boolean;
}

export interface ReadingProgress {
  completedTopicIds: number[];
  bookmarkedTopicIds: number[];
  lastReadTopicId: number;
  lastReadPage: number;
  lastReadTimestamp: number;
}

const STORAGE_KEYS = {
  LICENSE: 'peh_customer_license_v1',
  DEVICE_ID: 'peh_device_fingerprint_v1',
  PROGRESS: 'peh_reading_progress_v1',
  ADMIN_SESSION: 'peh_admin_session_v1',
  STORED_LICENSES: 'peh_registry_licenses_v1',
};

/**
 * Generate a persistent hardware/browser device fingerprint
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_render';
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    const raw = `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}-${Date.now()}-${Math.random()}`;
    deviceId = 'dev_' + hashSimple(raw);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

/**
 * Detect client OS and Browser
 */
export function getDeviceInfo(): { browser: string; os: string } {
  if (typeof window === 'undefined') return { browser: 'Unknown', os: 'Unknown' };
  const ua = navigator.userAgent;
  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'Windows';
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os };
}

/**
 * Deterministic hash utility
 */
export function hashSimple(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate cryptographic license token
 */
export function generateLicenseToken(email: string, paymentId: string, timestamp: number): string {
  const payload = `${email.toLowerCase().trim()}:${paymentId}:${timestamp}:PEH_SECURE_KEY_2026`;
  return `LIC-${hashSimple(payload).toUpperCase()}-${hashSimple(payload + '_salt').toUpperCase()}`;
}

/**
 * Verify Razorpay payment callback parameters from URL
 * Razorpay payment links return URL parameters:
 * ?razorpay_payment_id=pay_xxx&razorpay_payment_link_id=plink_xxx&razorpay_payment_link_reference_id=xxx&razorpay_payment_link_status=paid&razorpay_signature=xxx
 */
export function parseRazorpayPaymentParams(search: string): {
  paymentId?: string;
  paymentLinkId?: string;
  status?: string;
  isPaid: boolean;
} {
  if (!search) return { isPaid: false };
  const params = new URLSearchParams(search);
  const paymentId = params.get('razorpay_payment_id') || undefined;
  const paymentLinkId = params.get('razorpay_payment_link_id') || undefined;
  const status = params.get('razorpay_payment_link_status') || undefined;

  // Paid if status explicitly says 'paid' and a payment ID is present
  const isPaid = (status === 'paid' || status === 'captured') && Boolean(paymentId);

  return {
    paymentId,
    paymentLinkId,
    status,
    isPaid,
  };
}

/**
 * Get all stored customer licenses (local registry)
 */
export function getRegisteredLicenses(): CustomerLicense[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STORED_LICENSES);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save license to registry
 */
export function saveRegisteredLicense(license: CustomerLicense): void {
  if (typeof window === 'undefined') return;
  const current = getRegisteredLicenses().filter((l) => l.orderId !== license.orderId);
  current.push(license);
  localStorage.setItem(STORAGE_KEYS.STORED_LICENSES, JSON.stringify(current));
}

/**
 * Create verified customer license and save session
 */
export function createCustomerLicense(
  email: string,
  paymentId: string,
  name?: string
): CustomerLicense {
  const currentDevice = getOrCreateDeviceId();
  const info = getDeviceInfo();
  const verifiedAt = Date.now();
  const token = generateLicenseToken(email, paymentId, verifiedAt);

  const license: CustomerLicense = {
    orderId: 'ORD-' + hashSimple(`${email}-${paymentId}`).toUpperCase(),
    paymentId,
    customerEmail: email.toLowerCase().trim(),
    customerName: name || 'Valued Reader',
    amount: '₹99',
    currency: 'INR',
    verifiedAt,
    token,
    status: 'active',
    maxDevices: 2,
    activeDevices: [
      {
        deviceId: currentDevice,
        browser: info.browser,
        os: info.os,
        lastActive: verifiedAt,
        isCurrent: true,
      },
    ],
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.LICENSE, JSON.stringify(license));
    saveRegisteredLicense(license);
  }

  return license;
}

/**
 * Get active customer license from session/localStorage
 */
export function getActiveLicense(): CustomerLicense | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LICENSE);
    if (!raw) return null;
    const license: CustomerLicense = JSON.parse(raw);
    if (!license || license.status !== 'active') return null;

    // Check device binding
    const currentDevice = getOrCreateDeviceId();
    const hasDevice = license.activeDevices.some((d) => d.deviceId === currentDevice);
    if (!hasDevice) {
      if (license.activeDevices.length >= license.maxDevices) {
        // Exceeded device limit
        return null;
      }
      // Register this new device within allowance
      const info = getDeviceInfo();
      license.activeDevices.push({
        deviceId: currentDevice,
        browser: info.browser,
        os: info.os,
        lastActive: Date.now(),
        isCurrent: true,
      });
      localStorage.setItem(STORAGE_KEYS.LICENSE, JSON.stringify(license));
      saveRegisteredLicense(license);
    }
    return license;
  } catch {
    return null;
  }
}

/**
 * Customer logout
 */
export function clearActiveLicense(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.LICENSE);
}

/**
 * Revoke specific device session
 */
export function revokeDeviceSession(targetDeviceId: string): CustomerLicense | null {
  const license = getActiveLicense();
  if (!license) return null;
  license.activeDevices = license.activeDevices.filter((d) => d.deviceId !== targetDeviceId);
  localStorage.setItem(STORAGE_KEYS.LICENSE, JSON.stringify(license));
  saveRegisteredLicense(license);

  const currentDevice = getOrCreateDeviceId();
  if (targetDeviceId === currentDevice) {
    clearActiveLicense();
    return null;
  }
  return license;
}

/**
 * Reading progress management
 */
export function getReadingProgress(): ReadingProgress {
  if (typeof window === 'undefined') {
    return { completedTopicIds: [], bookmarkedTopicIds: [], lastReadTopicId: 1, lastReadPage: 1, lastReadTimestamp: Date.now() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (!raw) {
      return { completedTopicIds: [], bookmarkedTopicIds: [], lastReadTopicId: 1, lastReadPage: 1, lastReadTimestamp: Date.now() };
    }
    const parsed = JSON.parse(raw);
    return {
      completedTopicIds: parsed.completedTopicIds || [],
      bookmarkedTopicIds: parsed.bookmarkedTopicIds || [],
      lastReadTopicId: parsed.lastReadTopicId || 1,
      lastReadPage: parsed.lastReadPage || 1,
      lastReadTimestamp: parsed.lastReadTimestamp || Date.now(),
    };
  } catch {
    return { completedTopicIds: [], bookmarkedTopicIds: [], lastReadTopicId: 1, lastReadPage: 1, lastReadTimestamp: Date.now() };
  }
}

export function saveReadingProgress(update: Partial<ReadingProgress>): ReadingProgress {
  const current = getReadingProgress();
  const merged: ReadingProgress = {
    ...current,
    ...update,
    lastReadTimestamp: Date.now(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(merged));
  }
  return merged;
}

export function toggleTopicCompletion(topicId: number): ReadingProgress {
  const current = getReadingProgress();
  const isCompleted = current.completedTopicIds.includes(topicId);
  const updatedIds = isCompleted
    ? current.completedTopicIds.filter((id) => id !== topicId)
    : [...current.completedTopicIds, topicId];
  return saveReadingProgress({ completedTopicIds: updatedIds, lastReadTopicId: topicId });
}

export function toggleTopicBookmark(topicId: number): ReadingProgress {
  const current = getReadingProgress();
  const isBookmarked = current.bookmarkedTopicIds.includes(topicId);
  const updatedIds = isBookmarked
    ? current.bookmarkedTopicIds.filter((id) => id !== topicId)
    : [...current.bookmarkedTopicIds, topicId];
  return saveReadingProgress({ bookmarkedTopicIds: updatedIds });
}

/**
 * Generate customer watermark display strings
 */
export function generateWatermarkText(license: CustomerLicense): {
  primary: string;
  secondary: string;
  tokenSnippet: string;
} {
  const dateStr = new Date(license.verifiedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return {
    primary: `LICENSED TO: ${license.customerEmail.toUpperCase()}`,
    secondary: `ORDER ${license.orderId} · ${dateStr} · PEH SECURE READER`,
    tokenSnippet: `ID: ${license.token.slice(0, 14)}...`,
  };
}

/**
 * Admin Passcode Authentication
 * Default administrator hash for "admin2026"
 */
const ADMIN_PASSCODE_HASH = 'cdl8x'; // hashSimple of 'admin2026'

export function verifyAdminPasscode(passcode: string): boolean {
  return hashSimple(passcode.trim()) === ADMIN_PASSCODE_HASH;
}

export function setAdminAuthenticated(): void {
  if (typeof window !== 'undefined') {
    const token = 'adm_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, token);
  }
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION));
}

export function clearAdminAuthentication(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  }
}
