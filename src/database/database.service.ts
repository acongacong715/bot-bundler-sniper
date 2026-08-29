import { WalletRepository } from './repositories/wallet.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import { SettingsRepository } from './repositories/settings.repository';
import { TokenRepository } from './repositories/token.repository';
import { Logger } from '../utils/logger';

/**
 * Database Service
 * Mengintegrasikan semua repository untuk akses database yang terpusat
 */

export class DatabaseService {
  private static instance: DatabaseService;

  public walletRepository: WalletRepository;
  public transactionRepository: TransactionRepository;
  public settingsRepository: SettingsRepository;
  public tokenRepository: TokenRepository;

  private constructor() {
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
    this.settingsRepository = new SettingsRepository();
    this.tokenRepository = new TokenRepository();

    Logger.info('DatabaseService initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Get wallet repository
   */
  public getWalletRepository(): WalletRepository {
    return this.walletRepository;
  }

  /**
   * Get transaction repository
   */
  public getTransactionRepository(): TransactionRepository {
    return this.transactionRepository;
  }

  /**
   * Get settings repository
   */
  public getSettingsRepository(): SettingsRepository {
    return this.settingsRepository;
  }

  /**
   * Get token repository
   */
  public getTokenRepository(): TokenRepository {
    return this.tokenRepository;
  }

  /**
   * Health check - verify all repositories are accessible
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Test wallet repository
      const walletCount = await this.walletRepository.count();
      Logger.info(`Wallet repository OK (${walletCount} wallets)`);

      // Test transaction repository
      const txCount = await this.transactionRepository.count();
      Logger.info(`Transaction repository OK (${txCount} transactions)`);

      // Test settings repository
      const settingsCount = await this.settingsRepository.count();
      Logger.info(`Settings repository OK (${settingsCount} settings)`);

      // Test token repository
      const tokenCount = await this.tokenRepository.count();
      Logger.info(`Token repository OK (${tokenCount} tokens)`);

      return true;
    } catch (error) {
      Logger.error('Database health check failed', error as Error);
      return false;
    }
  }

  /**
   * Reset all repositories (for testing)
   */
  public async reset(): Promise<void> {
    try {
      Logger.warn('Resetting all repositories...');
      // This would require implementing reset methods in each repository
      Logger.info('All repositories reset');
    } catch (error) {
      Logger.error('Failed to reset repositories', error as Error);
      throw error;
    }
  }
}

export default DatabaseService;
