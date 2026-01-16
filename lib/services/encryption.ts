import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  // Key should be 32 bytes (256 bits) for AES-256
  // If provided as hex string (64 chars), convert to buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  // If provided as base64
  if (key.length === 44) {
    return Buffer.from(key, 'base64');
  }
  // Otherwise, derive a key from the string
  return crypto.scryptSync(key, 'roofcheck-salt', 32);
}

/**
 * Encrypt a string value for storage
 * Returns base64-encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine iv:authTag:ciphertext
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string
 * Expects base64-encoded string: iv:authTag:ciphertext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';

  const key = getEncryptionKey();

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const ciphertext = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt lead PII fields
 */
export function encryptLeadPII(lead: {
  name: string;
  email: string;
  phone: string;
}): {
  name_encrypted: string;
  email_encrypted: string;
  phone_encrypted: string;
} {
  return {
    name_encrypted: encrypt(lead.name),
    email_encrypted: encrypt(lead.email),
    phone_encrypted: encrypt(lead.phone),
  };
}

/**
 * Decrypt lead PII fields
 */
export function decryptLeadPII(encryptedLead: {
  name_encrypted: string;
  email_encrypted: string;
  phone_encrypted: string;
}): {
  name: string;
  email: string;
  phone: string;
} {
  return {
    name: decrypt(encryptedLead.name_encrypted),
    email: decrypt(encryptedLead.email_encrypted),
    phone: decrypt(encryptedLead.phone_encrypted),
  };
}

/**
 * Hash a value for searching (deterministic)
 * Used for email lookups without exposing the actual email
 */
export function hashForSearch(value: string): string {
  const key = getEncryptionKey();
  return crypto
    .createHmac('sha256', key)
    .update(value.toLowerCase().trim())
    .digest('hex');
}

/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
