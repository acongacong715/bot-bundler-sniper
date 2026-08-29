import { v4 as uuidv4 } from 'uuid';
import DatabaseManager from './database';
import { Token } from '../types';
import { DATABASE } from '../config/constants';
import { Logger } from '../utils/logger';

/**
 * Token Repository
 * Mengelola CRUD operations untuk token
 */

export class TokenRepository {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Create new token
   */
  async create(
    mint: string,
    symbol: string,
    name: string,
    decimals: number,
    supply: number,
    owner: string,
    authority?: string,
    freezeAuthority?: string
  ): Promise<Token> {
    try {
      const id = uuidv4();
      const now = new Date();

      const token: Token = {
        id,
        mint,
        symbol,
        name,
        decimals,
        supply,
        owner,
        authority,
        freezeAuthority,
        createdAt: now,
      };

      this.db.exec(
        `INSERT INTO ${DATABASE.TABLES.TOKENS} 
        (id, mint, symbol, name, decimals, supply, owner, authority, freeze_authority, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, mint, symbol, name, decimals, supply, owner, authority || null, freezeAuthority || null, now]
      );

      Logger.info(`Token created: ${id} (${symbol})`);
      return token;
    } catch (error) {
      Logger.error('Failed to create token', error as Error);
      throw error;
    }
  }

  /**
   * Get token by ID
   */
  async getById(id: string): Promise<Token | null> {
    try {
      const row = this.db.get(
        `SELECT * FROM ${DATABASE.TABLES.TOKENS} WHERE id = ?`,
        [id]
      );

      if (!row) return null;

      return this.mapRowToToken(row);
    } catch (error) {
      Logger.error(`Failed to get token by ID: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Get token by mint
   */
  async getByMint(mint: string): Promise<Token | null> {
    try {
      const row = this.db.get(
        `SELECT * FROM ${DATABASE.TABLES.TOKENS} WHERE mint = ?`,
        [mint]
      );

      if (!row) return null;

      return this.mapRowToToken(row);
    } catch (error) {
      Logger.error(`Failed to get token by mint: ${mint}`, error as Error);
      throw error;
    }
  }

  /**
   * Get token by symbol
   */
  async getBySymbol(symbol: string): Promise<Token | null> {
    try {
      const row = this.db.get(
        `SELECT * FROM ${DATABASE.TABLES.TOKENS} WHERE symbol = ?`,
        [symbol]
      );

      if (!row) return null;

      return this.mapRowToToken(row);
    } catch (error) {
      Logger.error(`Failed to get token by symbol: ${symbol}`, error as Error);
      throw error;
    }
  }

  /**
   * Get all tokens
   */
  async getAll(): Promise<Token[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TOKENS} ORDER BY created_at DESC`
      );

      return rows.map(row => this.mapRowToToken(row));
    } catch (error) {
      Logger.error('Failed to get all tokens', error as Error);
      throw error;
    }
  }

  /**
   * Get tokens by owner
   */
  async getByOwner(owner: string): Promise<Token[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TOKENS} WHERE owner = ? ORDER BY created_at DESC`,
        [owner]
      );

      return rows.map(row => this.mapRowToToken(row));
    } catch (error) {
      Logger.error(`Failed to get tokens by owner: ${owner}`, error as Error);
      throw error;
    }
  }

  /**
   * Search tokens by name
   */
  async searchByName(name: string): Promise<Token[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TOKENS} WHERE name LIKE ? ORDER BY created_at DESC`,
        [`%${name}%`]
      );

      return rows.map(row => this.mapRowToToken(row));
    } catch (error) {
      Logger.error(`Failed to search tokens by name: ${name}`, error as Error);
      throw error;
    }
  }

  /**
   * Search tokens by symbol
   */
  async searchBySymbol(symbol: string): Promise<Token[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TOKENS} WHERE symbol LIKE ? ORDER BY created_at DESC`,
        [`%${symbol}%`]
      );

      return rows.map(row => this.mapRowToToken(row));
    } catch (error) {
      Logger.error(`Failed to search tokens by symbol: ${symbol}`, error as Error);
      throw error;
    }
  }

  /**
   * Update token
   */
  async update(
    id: string,
    updates: Partial<Omit<Token, 'id' | 'createdAt'>>
  ): Promise<Token | null> {
    try {
      const token = await this.getById(id);
      if (!token) return null;

      const fields: string[] = [];
      const values: any[] = [];

      if (updates.supply !== undefined) {
        fields.push('supply = ?');
        values.push(updates.supply);
      }
      if (updates.symbol !== undefined) {
        fields.push('symbol = ?');
        values.push(updates.symbol);
      }
      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.authority !== undefined) {
        fields.push('authority = ?');
        values.push(updates.authority);
      }
      if (updates.freezeAuthority !== undefined) {
        fields.push('freeze_authority = ?');
        values.push(updates.freezeAuthority);
      }

      if (fields.length === 0) return token;

      values.push(id);

      this.db.exec(
        `UPDATE ${DATABASE.TABLES.TOKENS} SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      Logger.info(`Token updated: ${id}`);
      return this.getById(id);
    } catch (error) {
      Logger.error(`Failed to update token: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Delete token
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.db.exec(
        `DELETE FROM ${DATABASE.TABLES.TOKENS} WHERE id = ?`,
        [id]
      );

      Logger.info(`Token deleted: ${id}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to delete token: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Count tokens
   */
  async count(): Promise<number> {
    try {
      const result = this.db.get(
        `SELECT COUNT(*) as count FROM ${DATABASE.TABLES.TOKENS}`
      );

      return result?.count || 0;
    } catch (error) {
      Logger.error('Failed to count tokens', error as Error);
      throw error;
    }
  }

  /**
   * Check if token exists
   */
  async exists(mint: string): Promise<boolean> {
    try {
      const result = this.db.get(
        `SELECT COUNT(*) as count FROM ${DATABASE.TABLES.TOKENS} WHERE mint = ?`,
        [mint]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      Logger.error(`Failed to check token existence: ${mint}`, error as Error);
      throw error;
    }
  }

  /**
   * Get token supply
   */
  async getSupply(mint: string): Promise<number | null> {
    try {
      const token = await this.getByMint(mint);
      return token?.supply || null;
    } catch (error) {
      Logger.error(`Failed to get token supply: ${mint}`, error as Error);
      throw error;
    }
  }

  /**
   * Update token supply
   */
  async updateSupply(mint: string, supply: number): Promise<Token | null> {
    try {
      const token = await this.getByMint(mint);
      if (!token) return null;

      return this.update(token.id, { supply });
    } catch (error) {
      Logger.error(`Failed to update token supply: ${mint}`, error as Error);
      throw error;
    }
  }

  /**
   * Get top tokens by supply
   */
  async getTopBySupply(limit: number = 10): Promise<Token[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TOKENS} ORDER BY supply DESC LIMIT ?`,
        [limit]
      );

      return rows.map(row => this.mapRowToToken(row));
    } catch (error) {
      Logger.error('Failed to get top tokens by supply', error as Error);
      throw error;
    }
  }

  /**
   * Get recent tokens
   */
  async getRecent(limit: number = 10): Promise<Token[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.TOKENS} ORDER BY created_at DESC LIMIT ?`,
        [limit]
      );

      return rows.map(row => this.mapRowToToken(row));
    } catch (error) {
      Logger.error('Failed to get recent tokens', error as Error);
      throw error;
    }
  }

  /**
   * Map database row to Token object
   */
  private mapRowToToken(row: any): Token {
    return {
      id: row.id,
      mint: row.mint,
      symbol: row.symbol,
      name: row.name,
      decimals: row.decimals,
      supply: row.supply,
      owner: row.owner,
      authority: row.authority,
      freezeAuthority: row.freeze_authority,
      createdAt: new Date(row.created_at),
    };
  }
}

export default TokenRepository;
