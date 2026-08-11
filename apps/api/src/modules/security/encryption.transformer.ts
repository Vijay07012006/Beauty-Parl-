import { ValueTransformer } from 'typeorm';
import * as crypto from 'crypto';

export class EncryptionTransformer implements ValueTransformer {
  private key: Buffer;

  constructor() {
    // DB_ENCRYPTION_KEY must be set and exactly 32 bytes — no insecure fallback key.
    const secret = process.env.DB_ENCRYPTION_KEY || '';
    if (!secret || Buffer.byteLength(secret, 'utf8') !== 32) {
      throw new Error(
        'DB_ENCRYPTION_KEY must be set to exactly 32 characters. Refusing to start with a weak/default key.',
      );
    }
    this.key = Buffer.from(secret, 'utf8');
  }

  // Encrypt value before saving to database
  to(value: string | null | undefined): string | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption failed, saving raw value:', error);
      return value;
    }
  }

  // Decrypt value after loading from database
  from(value: string | null | undefined): string | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }
    // Check if the value fits the "iv:encrypted" format (hex-encoded string split by a colon)
    if (!value.includes(':')) {
      return value; // Legacy unencrypted data
    }
    try {
      const parts = value.split(':');
      if (parts.length !== 2) {
        return value;
      }
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      // If decryption fails (e.g. not encrypted, or wrong key), return raw value
      return value;
    }
  }
}
