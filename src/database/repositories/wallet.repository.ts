import { PublicKey } from '@solana/web3.js';
import { v4 as uuidv4 } from 'uuid';
import DatabaseManager from './database';
import { Wallet } from '../types';
import { DATABASE } from '../config/constants';
import { Logger } from '../utils/logger';

/**
 * Wallet Repository
 * Mengelola CRUD operations untuk wallet
 */

export class WalletRepository {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Create new wallet
   */
  async create(
    address: PublicKey,
    encryptedPrivateKey: string,
    isMainWallet: boolean = false
  ): Promise<Wallet> {
    try {
      const id = uuidv4();
      const now = new Date();

      const wallet: Wallet = {
        id,
        address,
        publicKey: address.toString(),
        encryptedPrivateKey,
        isMainWallet,
        createdAt: now,
        updatedAt: now,
        status: 'active',
      };

      this.db.exec(
        `INSERT INTO ${DATABASE.TABLES.WALLETS} 
        (id, address, public_key, encrypted_private_key, is_main_wallet, status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, address.toString(), address.toString(), encryptedPrivateKey, isMainWallet ? 1 : 0, 'active', now, now]
      );

      Logger.info(`Wallet created: ${id} (${address.toString()})`);
      return wallet;
    } catch (error) {
      Logger.error('Failed to create wallet', error as Error);
      throw error;
    }
  }

  /**
   * Get wallet by ID
   */
  async getById(id: string): Promise<Wallet | null> {
    try {
      const row = this.db.get(
        `SELECT * FROM ${DATABASE.TABLES.WALLETS} WHERE id = ?`,
        [id]
      );

      if (!row) return null;

      return this.mapRowToWallet(row);
    } catch (error) {
      Logger.error(`Failed to get wallet by ID: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Get wallet by address
   */
  async getByAddress(address: string): Promise<Wallet | null> {
    try {
      const row = this.db.get(
        `SELECT * FROM ${DATABASE.TABLES.WALLETS} WHERE address = ?`,
        [address]
      );

      if (!row) return null;

      return this.mapRowToWallet(row);
    } catch (error) {
      Logger.error(`Failed to get wallet by address: ${address}`, error as Error);
      throw error;
    }
  }

  /**
   * Get all wallets
   */
  async getAll(): Promise<Wallet[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.WALLETS} ORDER BY created_at DESC`
      );

      return rows.map(row => this.mapRowToWallet(row));
    } catch (error) {
      Logger.error('Failed to get all wallets', error as Error);
      throw error;
    }
  }

  /**
   * Get main wallet
   */
  async getMainWallet(): Promise<Wallet | null> {
    try {
      const row = this.db.get(
        `SELECT * FROM ${DATABASE.TABLES.WALLETS} WHERE is_main_wallet = 1`
      );

      if (!row) return null;

      return this.mapRowToWallet(row);
    } catch (error) {
      Logger.error('Failed to get main wallet', error as Error);
      throw error;
    }
  }

  /**
   * Get active wallets
   */
  async getActiveWallets(): Promise<Wallet[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.WALLETS} WHERE status = 'active' ORDER BY created_at DESC`
      );

      return rows.map(row => this.mapRowToWallet(row));
    } catch (error) {
      Logger.error('Failed to get active wallets', error as Error);
      throw error;
    }
  }

  /**
   * Get wallets by status
   */
  async getByStatus(status: 'active' | 'inactive' | 'locked'): Promise<Wallet[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.WALLETS} WHERE status = ? ORDER BY created_at DESC`,
        [status]
      );

      return rows.map(row => this.mapRowToWallet(row));
    } catch (error) {
      Logger.error(`Failed to get wallets by status: ${status}`, error as Error);
      throw error;
    }
  }

  /**
   * Update wallet status
   */
  async updateStatus(id: string, status: 'active' | 'inactive' | 'locked'): Promise<Wallet | null> {
    try {
      const now = new Date();

      this.db.exec(
        `UPDATE ${DATABASE.TABLES.WALLETS} SET status = ?, updated_at = ? WHERE id = ?`,
        [status, now, id]
      );

      return this.getById(id);
    } catch (error) {
      Logger.error(`Failed to update wallet status: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Update encrypted private key
   */
  async updateEncryptedKey(id: string, encryptedPrivateKey: string): Promise<Wallet | null> {
    try {
      const now = new Date();

      this.db.exec(
        `UPDATE ${DATABASE.TABLES.WALLETS} SET encrypted_private_key = ?, updated_at = ? WHERE id = ?`,
        [encryptedPrivateKey, now, id]
      );

      return this.getById(id);
    } catch (error) {
      Logger.error(`Failed to update wallet encrypted key: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Delete wallet
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = this.db.exec(
        `DELETE FROM ${DATABASE.TABLES.WALLETS} WHERE id = ?`,
        [id]
      );

      Logger.info(`Wallet deleted: ${id}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to delete wallet: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Count wallets
   */
  async count(): Promise<number> {
    try {
      const result = this.db.get(
        `SELECT COUNT(*) as count FROM ${DATABASE.TABLES.WALLETS}`
      );

      return result?.count || 0;
    } catch (error) {
      Logger.error('Failed to count wallets', error as Error);
      throw error;
    }
  }

  /**
   * Check if wallet exists
   */
  async exists(address: string): Promise<boolean> {
    try {
      const result = this.db.get(
        `SELECT COUNT(*) as count FROM ${DATABASE.TABLES.WALLETS} WHERE address = ?`,
        [address]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      Logger.error(`Failed to check wallet existence: ${address}`, error as Error);
      throw error;
    }
  }

  /**
   * Map database row to Wallet object
   */
  private mapRowToWallet(row: any): Wallet {
    return {
      id: row.id,
      address: new PublicKey(row.address),
      publicKey: row.public_key,
      encryptedPrivateKey: row.encrypted_private_key,
      isMainWallet: row.is_main_wallet === 1,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export default WalletRepository;
