import { Logger } from './logger';

/**
 * Input validators untuk semua parameter
 */

export class Validators {
  /**
   * Validate Solana public key format
   */
  static isValidPublicKey(pubkey: string): boolean {
    if (!pubkey || typeof pubkey !== 'string') return false;
    if (pubkey.length < 40 || pubkey.length > 44) return false;

    try {
      const decoded = Buffer.from(pubkey, 'base58');
      return decoded.length === 32;
    } catch {
      return false;
    }
  }

  /**
   * Validate Solana keypair JSON format
   */
  static isValidKeypairJSON(keypair: any): boolean {
    if (!Array.isArray(keypair) || keypair.length !== 64) return false;
    return keypair.every((byte) => typeof byte === 'number' && byte >= 0 && byte <= 255);
  }

  /**
   * Validate SOL amount
   */
  static isValidSolAmount(amount: number): boolean {
    return typeof amount === 'number' && amount > 0 && amount <= 1000000;
  }

  /**
   * Validate BPS (basis points)
   */
  static isValidBps(bps: number): boolean {
    return typeof bps === 'number' && bps >= 0 && bps <= 10000;
  }

  /**
   * Validate slippage (0-99%)
   */
  static isValidSlippage(slippage: number): boolean {
    return typeof slippage === 'number' && slippage >= 0 && slippage <= 99;
  }

  /**
   * Validate wallet count for sniping
   */
  static isValidWalletCount(count: number): boolean {
    return typeof count === 'number' && count >= 1 && count <= 50;
  }

  /**
   * Validate encryption key format (hex string)
   */
  static isValidEncryptionKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    // Should be hex string of even length (256 bit = 64 hex chars)
    return /^[a-f0-9]{64}$/i.test(key);
  }

  /**
   * Validate token metadata
   */
  static isValidTokenMetadata(metadata: any): boolean {
    if (!metadata || typeof metadata !== 'object') return false;

    const required = ['name', 'symbol', 'decimals', 'description'];
    for (const field of required) {
      if (!metadata[field]) return false;
    }

    if (typeof metadata.name !== 'string' || metadata.name.length > 32) return false;
    if (typeof metadata.symbol !== 'string' || metadata.symbol.length > 10) return false;
    if (typeof metadata.decimals !== 'number' || metadata.decimals > 9) return false;

    return true;
  }

  /**
   * Validate API key format
   */
  static isValidAPIKey(key: string): boolean {
    return typeof key === 'string' && key.length >= 20;
  }

  /**
   * Safe parse JSON dengan error handling
   */
  static safeParseJSON(jsonString: string): any | null {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      Logger.error(`JSON parse error: ${error}`);
      return null;
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export default Validators;
