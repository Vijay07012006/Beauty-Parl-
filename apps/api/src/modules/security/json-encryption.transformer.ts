import { ValueTransformer } from 'typeorm';
import * as crypto from 'crypto';

/**
 * Encrypts an array/json value at rest (AES-256-CBC with DB_ENCRYPTION_KEY).
 * Supports legacy plaintext rows (returns them as-is) so existing data keeps working.
 * Used for 2FA backup codes — a DB leak must not expose single-factor-equivalent credentials.
 */
export class JsonEncryptionTransformer implements ValueTransformer {
  private getKey(): Buffer | null {
    const secret = process.env.DB_ENCRYPTION_KEY || '';
    if (!secret || Buffer.byteLength(secret, 'utf8') !== 32) {
      return null;
    }
    return Buffer.from(secret, 'utf8');
  }

  to(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }
    const key = this.getKey();
    if (!key) {
      return value;
    }
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  from(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }
    const key = this.getKey();
    // Legacy plaintext data: a jsonb value arrives as a parsed array
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      // Plaintext JSON string (non-encrypted legacy)
      if (!value.includes(':')) {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      if (!key) {
        return [];
      }
      const parts = value.split(':');
      if (parts.length !== 2) {
        return [];
      }
      try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(parts[0], 'hex'));
        let decrypted = decipher.update(parts[1], 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        const parsed = JSON.parse(decrypted);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return value;
  }
}
