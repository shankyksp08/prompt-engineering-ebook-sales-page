/**
 * Digital Govind — Prompt Engineering Handbook
 * Transactional Customer Thank-You SMS Template & Indian Phone Number Validator
 */

export interface ThankYouSmsData {
  customerName?: string;
  loginUrl?: string;
}

/**
 * Generate the exact DLT-compatible SMS copy
 */
export function generateThankYouSmsText(data: ThankYouSmsData): string {
  const namePrefix = data.customerName && data.customerName.trim()
    ? `Dear ${data.customerName.trim()}, `
    : '';

  return `${namePrefix}Thank you for purchasing the Prompt Engineering Handbook from Digital Govind! 🎉 Your payment is successful and your eBook access is ready. Log in to your account to start reading. Happy Learning!`;
}

/**
 * Validate and format Indian mobile number (E.164 format: +91XXXXXXXXXX)
 * Accepts formats:
 * - 9876543210
 * - 09876543210
 * - 919876543210
 * - +919876543210
 * - +91 98765 43210
 */
export function formatAndValidateIndianMobile(input: string): {
  isValid: boolean;
  formatted: string;
  clean10Digits: string;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return { isValid: false, formatted: '', clean10Digits: '', error: 'Mobile number is required' };
  }

  // Remove all non-digits except initial '+'
  const cleaned = input.trim().replace(/[\s\-\(\)\.]/g, '');
  
  // Extract digits only
  const digits = cleaned.replace(/\D/g, '');

  let clean10Digits = '';

  if (digits.length === 10) {
    clean10Digits = digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    clean10Digits = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    clean10Digits = digits.slice(2);
  } else {
    return {
      isValid: false,
      formatted: '',
      clean10Digits: '',
      error: `Invalid length: Expected 10-digit Indian mobile number, got ${digits.length} digits`,
    };
  }

  // Indian mobile numbers must start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(clean10Digits)) {
    return {
      isValid: false,
      formatted: '',
      clean10Digits: '',
      error: 'Invalid Indian mobile number: Must start with 6, 7, 8, or 9',
    };
  }

  return {
    isValid: true,
    formatted: `+91${clean10Digits}`,
    clean10Digits,
  };
}
