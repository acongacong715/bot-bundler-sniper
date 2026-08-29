import { Connection, clusterApiUrl } from '@solana/web3.js';
import { Logger } from '../utils/logger';

/**
 * Solana RPC Connections Manager
 * Mengelola koneksi ke Solana network (mainnet, devnet, testnet)
 */

export class SolanaConnections {
  private static connections: Map<string, Connection> = new Map();

  /**
   * Initialize Solana connection
   */
  static async initializeConnection(network: 'mainnet' | 'devnet' | 'testnet' = 'mainnet'): Promise<Connection> {
    try {
      let rpcEndpoint: string;

      if (network === 'mainnet') {
        rpcEndpoint = process.env.SOLANA_RPC_MAINNET || clusterApiUrl('mainnet-beta');
      } else if (network === 'devnet') {
        rpcEndpoint = process.env.SOLANA_RPC_DEVNET || clusterApiUrl('devnet');
      } else {
        rpcEndpoint = clusterApiUrl('testnet');
      }

      const connection = new Connection(rpcEndpoint, 'processed');

      // Test connection
      const version = await connection.getVersion();
      Logger.info(`Connected to ${network} - Version: ${version['solana-core']}`);

      this.connections.set(network, connection);
      return connection;
    } catch (error) {
      Logger.error(`Failed to connect to ${network} network`, error as Error);
      throw error;
    }
  }

  /**
   * Get existing connection
   */
  static getConnection(network: string = 'mainnet'): Connection | undefined {
    return this.connections.get(network);
  }

  /**
   * Get or create connection
   */
  static async getOrCreateConnection(network: 'mainnet' | 'devnet' | 'testnet' = 'mainnet'): Promise<Connection> {
    const existing = this.getConnection(network);
    if (existing) {
      return existing;
    }
    return this.initializeConnection(network);
  }

  /**
   * Close all connections
   */
  static async closeAll(): Promise<void> {
    for (const [network, connection] of this.connections.entries()) {
      Logger.info(`Closing connection to ${network}`);
      // Note: Connection doesn't have a close method in web3.js
    }
    this.connections.clear();
  }
}

export default SolanaConnections;
