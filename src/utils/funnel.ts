/**
 * Pure utility functions for the sales funnel and download workflows.
 * Decoupled from React UI components for testability.
 */

export interface ReadingPath {
  id: '30-minute' | 'practical' | 'builder';
  title: string;
  targetAudience: string;
  recommendedTopics: string[];
  description: string;
}

export const READING_PATHS: ReadingPath[] = [
  {
    id: '30-minute',
    title: 'The 30-Minute Path',
    targetAudience: 'Busy professionals needing immediate quality jumps',
    recommendedTopics: [
      'Topic 1: What Is Prompt Engineering?',
      'Topic 10: Your First Good Prompt: Before and After',
      'Topic 11: The Core Elements of a Prompt',
      'Topic 12: Be Clear and Direct',
      'Topic 16: Set the Output Format',
      'Topic 25: Zero-Shot Prompting',
      'Topic 26: One-Shot and Few-Shot Prompting',
      'Topic 99: Twelve Common Prompting Mistakes',
      'Appendix A: One-Page Prompt Cheat Sheet',
    ],
    description: 'Read the foundation, essential anatomy, few-shot recipes, and the cheat sheet to instantly eliminate vague responses.',
  },
  {
    id: 'practical',
    title: 'The Practical Path',
    targetAudience: 'Everyday knowledge workers, marketers, writers, and analysts',
    recommendedTopics: [
      'Part 1: Foundations (Topics 1-10)',
      'Part 2: Anatomy of a Great Prompt (Topics 11-24)',
      'Part 3: Core Prompting Techniques (Topics 25-42)',
      'Part 7: Prompts for Real Work (Topics 71-86)',
      'Appendix B: 10 Ready-to-Use Prompt Templates',
    ],
    description: 'Master the rules of clear instruction, then jump straight into role-specific workflows for writing, data analysis, coding, research, and support.',
  },
  {
    id: 'builder',
    title: 'The Builder Path',
    targetAudience: 'Software engineers, AI builders, and product teams',
    recommendedTopics: [
      'Part 4: Reasoning, Tools and Agents (Topics 43-54)',
      'Part 5: Structured Output and Formatting (Topics 55-62)',
      'Part 6: Working With Different Models (Topics 63-70)',
      'Part 8: Context, Evaluation and Production (Topics 87-94)',
      'Part 9: Safety, Ethics and the Road Ahead (Topics 95-100)',
      'Appendix D: Your Four-Week Learning Plan',
    ],
    description: 'Go deep into ReAct agents, JSON schema, model steerability, context compaction, test sets, LLM-as-judge, and prompt injection defense.',
  },
];

/**
 * Checks if a given checkout URL is a live external URL
 */
export function isValidCheckoutUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed.includes('REPLACE_WITH_MY_PAYMENT_CHECKOUT_URL')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks if download URL is valid and points to a file or endpoint
 */
export function isValidDownloadUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed.includes('REPLACE_WITH_YOUR_EBOOK_DOWNLOAD_URL')) {
    return false;
  }
  return trimmed.endsWith('.pdf') || trimmed.startsWith('/') || trimmed.startsWith('http');
}

/**
 * Extracts a numeric value from a price string like "$29" -> 29
 */
export function parsePriceNumber(priceStr: string): number | null {
  const match = priceStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(match);
  return isNaN(num) ? null : num;
}

/**
 * Calculates discount percentage if original price is provided
 */
export function calculateDiscountPercent(currentPrice: string, originalPrice?: string): number | null {
  if (!originalPrice) return null;
  const current = parsePriceNumber(currentPrice);
  const orig = parsePriceNumber(originalPrice);
  if (!current || !orig || orig <= current) return null;
  return Math.round(((orig - current) / orig) * 100);
}

/**
 * Validates email format for support links
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Formats byte size to human readable (KB, MB)
 */
export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
