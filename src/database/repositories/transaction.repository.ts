import { v4 as uuidv4 } from 'uuid';
import DatabaseManager from './database';
import { TransactionRequest, TransactionResponse } from '../types';
import { DATABASE } from '../config/constants';
import { Logger } from '../utils/logger';

/**
 * Transaction Repository
 * Mengelola CRUD operations untuk transaction
 */

export class TransactionRepository {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Create new transaction
   */
  async create(
    fromWallet: string,
    amount: number,
    type: 'buy' | 'sell' | 'transfer',
    toWallet?: string,
    mint?: string,
    slippage?: number,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<TransactionRequest> {
    try {
      const id = uuidv4();
      const now = new Date();

      const transaction: TransactionRequest = {
        id,
        fromWallet,
        toWallet,
        mint,
        amount,
        type,
        status: 'pending',
        slippage,
        priority,
        createdAt: now,
      };

      this.db.exec(
        `INSERT INTO ${DATABASE.TABLES.TRANSACTIONS} 
        (id, from_wallet, to_wallet, mint, amount, type, status, slippage, priority, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, fromWallet, toWallet || null, mint || null, amount, type, 'pending', slippage || null, priority, now]
      );

      Logger.info(`Transaction created: ${id} (${type})`);
      return transaction;
    } catch (error) {
      Logger.error('Failed to create transaction', error as Error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getById(id: string): Promise<TransactionRequest | null> {
    try {
      const row = this.db.get(
        `SELECT * FROM ${DATABASE.TABLES.TRANSACTIONS} WHERE id = ?`,
        [id]
      );

      if (!row) return null;

      return this.mapRowToTransaction(row);
    } catch (error) {
      Logger.error(`Failed to get transaction by ID: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Get transaction by signature
   */
  async getBySignature(signature: string): Promise<TransactionRequest | null> {
    try {
      const row = this.db.get(
        `SELECT * FROM ${DATABASE.TABLES.TRANSACTIONS} WHERE signature = ?`,
        [signature]
      );

      if (!row) return null;

      return this.mapRowToTransaction(row);
    } catch (error) {
      Logger.error(`Failed to get transaction by signature: ${signature}`, error as Error);
      throw error;
    }
  }

  /**
   * Get all transactions
   */
  async getAll(): Promise<TransactionRequest[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TRANSACTIONS} ORDER BY created_at DESC`
      );

      return rows.map(row => this.mapRowToTransaction(row));
    } catch (error) {
      Logger.error('Failed to get all transactions', error as Error);
      throw error;
    }
  }

  /**
   * Get transactions by wallet
   */
  async getByWallet(wallet: string): Promise<TransactionRequest[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TRANSACTIONS} WHERE from_wallet = ? ORDER BY created_at DESC`,
        [wallet]
      );

      return rows.map(row => this.mapRowToTransaction(row));
    } catch (error) {
      Logger.error(`Failed to get transactions by wallet: ${wallet}`, error as Error);
      throw error;
    }
  }

  /**
   * Get transactions by mint
   */
  async getByMint(mint: string): Promise<TransactionRequest[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TRANSACTIONS} WHERE mint = ? ORDER BY created_at DESC`,
        [mint]
      );

      return rows.map(row => this.mapRowToTransaction(row));
    } catch (error) {
      Logger.error(`Failed to get transactions by mint: ${mint}`, error as Error);
      throw error;
    }
  }

  /**
   * Get transactions by status
   */
  async getByStatus(status: 'pending' | 'confirmed' | 'failed'): Promise<TransactionRequest[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TRANSACTIONS} WHERE status = ? ORDER BY created_at DESC`,
        [status]
      );

      return rows.map(row => this.mapRowToTransaction(row));
    } catch (error) {
      Logger.error(`Failed to get transactions by status: ${status}`, error as Error);
      throw error;
    }
  }

  /**
   * Get transactions by type
   */
  async getByType(type: 'buy' | 'sell' | 'transfer'): Promise<TransactionRequest[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TRANSACTIONS} WHERE type = ? ORDER BY created_at DESC`,
        [type]
      );

      return rows.map(row => this.mapRowToTransaction(row));
    } catch (error) {
      Logger.error(`Failed to get transactions by type: ${type}`, error as Error);
      throw error;
    }
  }

  /**
   * Get pending transactions
   */
  async getPending(): Promise<TransactionRequest[]> {
    return this.getByStatus('pending');
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    id: string,
    status: 'pending' | 'confirmed' | 'failed',
    signature?: string,
    error?: string
  ): Promise<TransactionRequest | null> {
    try {
      const confirmedAt = status === 'confirmed' ? new Date() : null;

      let sql = `UPDATE ${DATABASE.TABLES.TRANSACTIONS} SET status = ?`;
      const params: any[] = [status];

      if (signature) {
        sql += `, signature = ?`;
        params.push(signature);
      }

      if (error) {
        sql += `, error = ?`;
        params.push(error);
      }

      if (confirmedAt) {
        sql += `, confirmed_at = ?`;
        params.push(confirmedAt);
      }

      sql += ` WHERE id = ?`;
      params.push(id);

      this.db.exec(sql, params);

      Logger.info(`Transaction updated: ${id} -> ${status}`);
      return this.getById(id);
    } catch (error) {
      Logger.error(`Failed to update transaction status: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Delete transaction
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.db.exec(
        `DELETE FROM ${DATABASE.TABLES.TRANSACTIONS} WHERE id = ?`,
        [id]
      );

      Logger.info(`Transaction deleted: ${id}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to delete transaction: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Count transactions
   */
  async count(): Promise<number> {
    try {
      const result = this.db.get(
        `SELECT COUNT(*) as count FROM ${DATABASE.TABLES.TRANSACTIONS}`
      );

      return result?.count || 0;
    } catch (error) {
      Logger.error('Failed to count transactions', error as Error);
      throw error;
    }
  }

  /**
   * Count confirmed transactions
   */
  async countConfirmed(): Promise<number> {
    try {
      const result = this.db.get(
        `SELECT COUNT(*) as count FROM ${DATABASE.TABLES.TRANSACTIONS} WHERE status = 'confirmed'`
      );

      return result?.count || 0;
    } catch (error) {
      Logger.error('Failed to count confirmed transactions', error as Error);
      throw error;
    }
  }

  /**
   * Count failed transactions
   */
  async countFailed(): Promise<number> {
    try {
      const result = this.db.get(
        `SELECT COUNT(*) as count FROM ${DATABASE.TABLES.TRANSACTIONS} WHERE status = 'failed'`
      );

      return result?.count || 0;
    } catch (error) {
      Logger.error('Failed to count failed transactions', error as Error);
      throw error;
    }
  }

  /**
   * Get total volume by wallet
   */
  async getTotalVolumeByWallet(wallet: string): Promise<number> {
    try {
      const result = this.db.get(
        `SELECT SUM(amount) as total FROM ${DATABASE.TABLES.TRANSACTIONS} WHERE from_wallet = ? AND status = 'confirmed'`,
        [wallet]
      );

      return result?.total || 0;
    } catch (error) {
      Logger.error(`Failed to get total volume by wallet: ${wallet}`, error as Error);
      throw error;
    }
  }

  /**
   * Get total volume by mint
   */
  async getTotalVolumeByMint(mint: string): Promise<number> {
    try {
      const result = this.db.get(
        `SELECT SUM(amount) as total FROM ${DATABASE.TABLES.TRANSACTIONS} WHERE mint = ? AND status = 'confirmed'`,
        [mint]
      );

      return result?.total || 0;
    } catch (error) {
      Logger.error(`Failed to get total volume by mint: ${mint}`, error as Error);
      throw error;
    }
  }

  /**
   * Get transactions within date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<TransactionRequest[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TRANSACTIONS} 
        WHERE created_at BETWEEN ? AND ? 
        ORDER BY created_at DESC`,
        [startDate, endDate]
      );

      return rows.map(row => this.mapRowToTransaction(row));
    } catch (error) {
      Logger.error('Failed to get transactions by date range', error as Error);
      throw error;
    }
  }

  /**
   * Map database row to TransactionRequest object
   */
  private mapRowToTransaction(row: any): TransactionRequest {
    return {
      id: row.id,
      fromWallet: row.from_wallet,
      toWallet: row.to_wallet,
      mint: row.mint,
      amount: row.amount,
      type: row.type,
      status: row.status,
      signature: row.signature,
      error: row.error,
      slippage: row.slippage,
      priority: row.priority,
      createdAt: new Date(row.created_at),
      confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : undefined,
    };
  }
}

export default TransactionRepository;
