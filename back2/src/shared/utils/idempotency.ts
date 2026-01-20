import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique idempotency key for transactions
 */
export function generateIdempotencyKey(): string {
  return uuidv4();
}

/**
 * Creates an idempotency key from user ID and timestamp
 */
export function createIdempotencyKey(userId: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const base = `${userId}-${timestamp}-${random}`;
  return prefix ? `${prefix}-${base}` : base;
}
