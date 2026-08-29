import { v4 as uuidv4 } from 'uuid';
import DatabaseManager from './database';
import { Settings } from '../types';
import { DATABASE } from '../config/constants';
import { Logger } from '../utils/logger';

/**
 * Settings Repository
 * Mengelola CRUD operations untuk settings
 */

export class SettingsRepository {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Create new settings
   */
  async create(
    key: string,
    value: any,
    description?: string,
    category?: string
  ): Promise<Settings> {
    try {
      const id = uuidv4();
      const now = new Date();

      const settings: Settings = {
        id,
        key,
        value,
        description,
        category,
        createdAt: now,
        updatedAt: now,
      };

      this.db.exec(
        `INSERT INTO ${DATABASE.TABLES.SETTINGS} 
        (id, key, value, description, category, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, key, JSON.stringify(value), description || null, category || null, now, now]
      );

      Logger.info(`Settings created: ${id} (${key})`);
      return settings;
    } catch (error) {
      Logger.error('Failed to create settings', error as Error);
      throw error;
    }
  }

  /**
   * Get settings by ID
   */
  async getById(id: string): Promise<Settings | null> {
    try {
      const row = this.db.get(
        `SELECT * FROM ${DATABASE.TABLES.SETTINGS} WHERE id = ?`,
        [id]
      );

      if (!row) return null;

      return this.mapRowToSettings(row);
    } catch (error) {
      Logger.error(`Failed to get settings by ID: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Get settings by key
   */
  async getByKey(key: string): Promise<Settings | null> {
    try {
      const row = this.db.get(
        `SELECT * FROM ${DATABASE.TABLES.SETTINGS} WHERE key = ?`,
        [key]
      );

      if (!row) return null;

      return this.mapRowToSettings(row);
    } catch (error) {
      Logger.error(`Failed to get settings by key: ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * Get all settings
   */
  async getAll(): Promise<Settings[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.SETTINGS} ORDER BY key ASC`
      );

      return rows.map(row => this.mapRowToSettings(row));
    } catch (error) {
      Logger.error('Failed to get all settings', error as Error);
      throw error;
    }
  }

  /**
   * Get settings by category
   */
  async getByCategory(category: string): Promise<Settings[]> {
    try {
      const rows = this.db.all(
        `SELECT * FROM ${DATABASE.TABLES.SETTINGS} WHERE category = ? ORDER BY key ASC`,
        [category]
      );

      return rows.map(row => this.mapRowToSettings(row));
    } catch (error) {
      Logger.error(`Failed to get settings by category: ${category}`, error as Error);
      throw error;
    }
  }

  /**
   * Get value by key
   */
  async getValue(key: string): Promise<any> {
    try {
      const settings = await this.getByKey(key);
      return settings?.value || null;
    } catch (error) {
      Logger.error(`Failed to get value for key: ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * Set/Update settings value
   */
  async set(key: string, value: any, description?: string, category?: string): Promise<Settings> {
    try {
      const existing = await this.getByKey(key);
      const now = new Date();

      if (existing) {
        this.db.exec(
          `UPDATE ${DATABASE.TABLES.SETTINGS} 
          SET value = ?, description = ?, category = ?, updated_at = ? 
          WHERE key = ?`,
          [JSON.stringify(value), description || existing.description || null, category || existing.category || null, now, key]
        );

        Logger.info(`Settings updated: ${key}`);
        return this.getByKey(key) as Promise<Settings>;
      } else {
        return this.create(key, value, description, category);
      }
    } catch (error) {
      Logger.error(`Failed to set settings: ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * Update settings
   */
  async update(
    id: string,
    updates: Partial<Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Settings | null> {
    try {
      const settings = await this.getById(id);
      if (!settings) return null;

      const fields: string[] = [];
      const values: any[] = [];
      const now = new Date();

      if (updates.value !== undefined) {
        fields.push('value = ?');
        values.push(JSON.stringify(updates.value));
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
      }
      if (updates.category !== undefined) {
        fields.push('category = ?');
        values.push(updates.category);
      }

      if (fields.length === 0) return settings;

      fields.push('updated_at = ?');
      values.push(now);
      values.push(id);

      this.db.exec(
        `UPDATE ${DATABASE.TABLES.SETTINGS} SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      Logger.info(`Settings updated: ${id}`);
      return this.getById(id);
    } catch (error) {
      Logger.error(`Failed to update settings: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Delete settings
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.db.exec(
        `DELETE FROM ${DATABASE.TABLES.SETTINGS} WHERE id = ?`,
        [id]
      );

      Logger.info(`Settings deleted: ${id}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to delete settings: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Delete settings by key
   */
  async deleteByKey(key: string): Promise<boolean> {
    try {
      this.db.exec(
        `DELETE FROM ${DATABASE.TABLES.SETTINGS} WHERE key = ?`,
        [key]
      );

      Logger.info(`Settings deleted by key: ${key}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to delete settings by key: ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * Count settings
   */
  async count(): Promise<number> {
    try {
      const result = this.db.get(
        `SELECT COUNT(*) as count FROM ${DATABASE.TABLES.SETTINGS}`
      );

      return result?.count || 0;
    } catch (error) {
      Logger.error('Failed to count settings', error as Error);
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = this.db.get(
        `SELECT COUNT(*) as count FROM ${DATABASE.TABLES.SETTINGS} WHERE key = ?`,
        [key]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      Logger.error(`Failed to check settings existence: ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * Get all as object
   */
  async getAllAsObject(): Promise<Record<string, any>> {
    try {
      const settings = await this.getAll();
      const result: Record<string, any> = {};

      settings.forEach(s => {
        result[s.key] = s.value;
      });

      return result;
    } catch (error) {
      Logger.error('Failed to get all settings as object', error as Error);
      throw error;
    }
  }

  /**
   * Get category as object
   */
  async getCategoryAsObject(category: string): Promise<Record<string, any>> {
    try {
      const settings = await this.getByCategory(category);
      const result: Record<string, any> = {};

      settings.forEach(s => {
        result[s.key] = s.value;
      });

      return result;
    } catch (error) {
      Logger.error(`Failed to get category settings as object: ${category}`, error as Error);
      throw error;
    }
  }

  /**
   * Bulk set settings
   */
  async bulkSet(data: Record<string, any>, category?: string): Promise<void> {
    try {
      for (const [key, value] of Object.entries(data)) {
        await this.set(key, value, undefined, category);
      }

      Logger.info(`Bulk settings set: ${Object.keys(data).length} items`);
    } catch (error) {
      Logger.error('Failed to bulk set settings', error as Error);
      throw error;
    }
  }

  /**
   * Map database row to Settings object
   */
  private mapRowToSettings(row: any): Settings {
    return {
      id: row.id,
      key: row.key,
      value: JSON.parse(row.value),
      description: row.description,
      category: row.category,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export default SettingsRepository;
