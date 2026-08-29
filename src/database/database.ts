import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Logger } from '../utils/logger';
import { DATABASE } from '../config/constants';

/**
 * SQLite Database Manager
 * Mengelola semua operasi database untuk bot
 */

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(DATABASE.PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        Logger.info(`Created data directory: ${dataDir}`);
      }

      // Open database
      this.db = new Database(DATABASE.PATH);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');

      Logger.info(`Database initialized at ${DATABASE.PATH}`);

      // Create tables
      await this.createTables();
    } catch (error) {
      Logger.error('Failed to initialize database', error as Error);
      throw error;
    }
  }

  /**
   * Create all required tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Wallets table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${DATABASE.TABLES.WALLETS} (
          id TEXT PRIMARY KEY,
          address TEXT UNIQUE NOT NULL,
          public_key TEXT UNIQUE NOT NULL,
          encrypted_private_key TEXT NOT NULL,
          is_main_wallet BOOLEAN DEFAULT 0,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tokens table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${DATABASE.TABLES.TOKENS} (
          id TEXT PRIMARY KEY,
          mint TEXT UNIQUE NOT NULL,
          symbol TEXT NOT NULL,
          name TEXT NOT NULL,
          decimals INTEGER NOT NULL,
          supply REAL NOT NULL,
          owner TEXT NOT NULL,
          authority TEXT,
          freeze_authority TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Transactions table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${DATABASE.TABLES.TRANSACTIONS} (
          id TEXT PRIMARY KEY,
          from_wallet TEXT NOT NULL,
          to_wallet TEXT,
          mint TEXT,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          signature TEXT UNIQUE,
          error TEXT,
          slippage REAL,
          priority TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          confirmed_at DATETIME,
          FOREIGN KEY (from_wallet) REFERENCES ${DATABASE.TABLES.WALLETS}(address),
          FOREIGN KEY (mint) REFERENCES ${DATABASE.TABLES.TOKENS}(mint)
        )
      `);

      // Performance table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${DATABASE.TABLES.PERFORMANCE} (
          id TEXT PRIMARY KEY,
          total_trades INTEGER DEFAULT 0,
          successful_trades INTEGER DEFAULT 0,
          failed_trades INTEGER DEFAULT 0,
          total_pnl REAL DEFAULT 0,
          win_rate REAL DEFAULT 0,
          average_profit REAL DEFAULT 0,
          average_loss REAL DEFAULT 0,
          profit_factor REAL DEFAULT 0,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Settings table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${DATABASE.TABLES.SETTINGS} (
          id TEXT PRIMARY KEY,
          main_wallet TEXT NOT NULL,
          network TEXT DEFAULT 'mainnet',
          rpc_endpoint TEXT NOT NULL,
          snipe_config TEXT,
          sell_strategy TEXT,
          auto_start_snipe BOOLEAN DEFAULT 0,
          telegram_notifications BOOLEAN DEFAULT 0,
          twitter_tracking BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_wallets_status ON ${DATABASE.TABLES.WALLETS}(status);
        CREATE INDEX IF NOT EXISTS idx_tokens_mint ON ${DATABASE.TABLES.TOKENS}(mint);
        CREATE INDEX IF NOT EXISTS idx_transactions_status ON ${DATABASE.TABLES.TRANSACTIONS}(status);
        CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON ${DATABASE.TABLES.TRANSACTIONS}(from_wallet);
        CREATE INDEX IF NOT EXISTS idx_transactions_signature ON ${DATABASE.TABLES.TRANSACTIONS}(signature);
      `);

      Logger.info('Database tables created successfully');
    } catch (error) {
      Logger.error('Failed to create database tables', error as Error);
      throw error;
    }
  }

  /**
   * Get database instance
   */
  getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Execute query
   */
  exec(sql: string, params?: any[]): any {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(sql);
      if (params) {
        return stmt.run(...params);
      }
      return stmt.run();
    } catch (error) {
      Logger.error(`Failed to execute query: ${sql}`, error as Error);
      throw error;
    }
  }

  /**
   * Execute query and get first result
   */
  get(sql: string, params?: any[]): any {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(sql);
      if (params) {
        return stmt.get(...params);
      }
      return stmt.get();
    } catch (error) {
      Logger.error(`Failed to execute get query: ${sql}`, error as Error);
      throw error;
    }
  }

  /**
   * Execute query and get all results
   */
  all(sql: string, params?: any[]): any[] {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(sql);
      if (params) {
        return stmt.all(...params);
      }
      return stmt.all();
    } catch (error) {
      Logger.error(`Failed to execute all query: ${sql}`, error as Error);
      throw error;
    }
  }

  /**
   * Start transaction
   */
  beginTransaction(): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.exec('BEGIN TRANSACTION');
  }

  /**
   * Commit transaction
   */
  commit(): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.exec('COMMIT');
  }

  /**
   * Rollback transaction
   */
  rollback(): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.exec('ROLLBACK');
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      Logger.info('Database connection closed');
    }
  }

  /**
   * Backup database
   */
  backup(backupPath: string): void {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const backup = this.db.backup(backupPath);
      Logger.info(`Database backed up to ${backupPath}`);
    } catch (error) {
      Logger.error('Failed to backup database', error as Error);
      throw error;
    }
  }
}

export default DatabaseManager;
