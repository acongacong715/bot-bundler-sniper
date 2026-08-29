import * as crypto from 'crypto';
import * as CryptoJS from 'crypto-js';

/**
 * Utility functions untuk enkripsi dan dekripsi
 * Menggunakan AES-256 untuk keamanan maksimal
 */

export class CryptoUtil {
  /**
   * Generate encryption key dari password
   */
  static deriveKey(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    }).toString();
  }

  /**
   * Encrypt data menggunakan AES-256
   */
  static encrypt(data: string, encryptionKey: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, encryptionKey).toString();
      return encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt data menggunakan AES-256
   */
  static decrypt(encryptedData: string, encryptionKey: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedStr) {
        throw new Error('Decryption returned empty result - wrong key or corrupted data');
      }
      return decryptedStr;
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Hash data menggunakan SHA-256
   */
  static hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Generate random hex string
   */
  static generateRandomHex(length: number): string {
    return crypto.randomBytes(length / 2).toString('hex');
  }

  /**
   * Generate secure random bytes
   */
  static generateRandomBytes(length: number): Buffer {
    return crypto.randomBytes(length);
  }

  /**
   * Verify HMAC signature
   */
  static verifyHMAC(data: string, signature: string, secret: string): boolean {
    const hash = CryptoJS.HmacSHA256(data, secret).toString();
    return hash === signature;
  }

  /**
   * Generate HMAC signature
   */
  static generateHMAC(data: string, secret: string): string {
    return CryptoJS.HmacSHA256(data, secret).toString();
  }
}

export default CryptoUtil;
