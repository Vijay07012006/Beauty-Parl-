import { ValueTransformer } from 'typeorm';
import * as crypto from 'crypto';

export class EncryptionTransformer implements ValueTransformer {
  private key: Buffer;
  
  constructor() {
    // DB_ENCRYPTION_KEY should be 32 bytes/characters.
    // If not set or invalid length, we fall back to a default key for seamless development.
    const secret = process.env.DB_ENCRYPTION_KEY || 'default_beauty_parle_secret_key_32bytes!';
    this.key = Buffer.alloc(32);
    const secretBuf = Buffer.from(secret, 'utf8');
    secretBuf.copy(this.key, 0, 0, Math.min(secretBuf.length, 32));
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
