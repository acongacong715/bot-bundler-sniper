import { PublicKey } from '@solana/web3.js';

/**
 * Type Definitions untuk Bot Bundler Sniper
 */

// ============ WALLET TYPES ============
export interface Wallet {
  id: string;
  address: PublicKey;
  publicKey: string;
  encryptedPrivateKey: string;
  isMainWallet: boolean;
  createdAt: Date;
  updatedAt: Date;
  balance?: number;
  status: 'active' | 'inactive' | 'locked';
}

export interface WalletBalance {
  wallet: string;
  solBalance: number;
  tokenBalances: Map<string, number>;
}

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

// ============ TOKEN TYPES ============
export interface Token {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: number;
  owner: string;
  authority?: string;
  freezeAuthority?: string;
  createdAt: Date;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
}

export interface HolderBalance {
  mint: string;
  owner: string;
  amount: number;
  decimals: number;
  uiAmount: number;
}

// ============ TRANSACTION TYPES ============
export interface TransactionRequest {
  id: string;
  fromWallet: string;
  toWallet?: string;
  mint?: string;
  amount: number;
  type: 'buy' | 'sell' | 'transfer';
  status: 'pending' | 'confirmed' | 'failed';
  signature?: string;
  error?: string;
  createdAt: Date;
  confirmedAt?: Date;
  slippage?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface TransactionResponse {
  signature: string;
  status: 'success' | 'failed' | 'pending';
  blockTime?: number;
  slot?: number;
  error?: string;
}

// ============ SNIPING TYPES ============
export interface SnipeConfig {
  enabled: boolean;
  buySolAmount: number;
  walletCount: number;
  slippageBps: number;
  autosell: boolean;
  autosellPercent?: number;
  autosellDelay?: number;
  priorityFee: number;
  maxRetries: number;
}

export interface SnipeTarget {
  mint: string;
  bondingCurve: string;
  associatedBondingCurve: string;
  displayName?: string;
  timestamp: Date;
  status: 'pending' | 'sniped' | 'failed';
}

export interface SnipeResult {
  success: boolean;
  mint: string;
  walletsBought: string[];
  totalSpent: number;
  tokensBought: number;
  averagePrice: number;
  signatures: string[];
  errors?: string[];
}

// ============ SELLING TYPES ============
export interface SellStrategy {
  type: 'market' | 'limit' | 'mixed';
  takeProfitPercent?: number;
  stopLossPercent?: number;
  dripPercent?: number;
  dripInterval?: number;
}

export interface SellOrder {
  id: string;
  mint: string;
  wallet: string;
  tokenAmount: number;
  strategy: SellStrategy;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  filledAmount: number;
  createdAt: Date;
  completedAt?: Date;
}

// ============ PERFORMANCE TYPES ============
export interface PerformanceMetrics {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnL: number;
  winRate: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  timestamp: Date;
}

export interface TradeHistory {
  id: string;
  mint: string;
  buyPrice: number;
  sellPrice: number;
  pnl: number;
  pnlPercent: number;
  quantity: number;
  buyTime: Date;
  sellTime: Date;
  duration: number;
}

// ============ SETTINGS TYPES ============
export interface BotSettings {
  id: string;
  mainWallet: string;
  network: 'mainnet' | 'devnet' | 'testnet';
  rpcEndpoint: string;
  snipeConfig: SnipeConfig;
  sellStrategy: SellStrategy;
  autoStartSnipe: boolean;
  telegramNotifications: boolean;
  twitterTracking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============ NOTIFICATION TYPES ============
export interface Notification {
  id: string;
  type: 'snipe' | 'sell' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// ============ ERROR TYPES ============
export interface BotError {
  code: string;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}

// ============ API RESPONSE TYPES ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============ MARKET DATA TYPES ============
export interface MarketData {
  mint: string;
  price: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  liquidity: number;
  lastUpdate: Date;
}

export interface PricePoint {
  mint: string;
  price: number;
  timestamp: Date;
}

export default {
  Wallet,
  WalletBalance,
  KeyPair,
  Token,
  TokenMetadata,
  HolderBalance,
  TransactionRequest,
  TransactionResponse,
  SnipeConfig,
  SnipeTarget,
  SnipeResult,
  SellStrategy,
  SellOrder,
  PerformanceMetrics,
  TradeHistory,
  BotSettings,
  Notification,
  BotError,
  ApiResponse,
  PaginatedResponse,
  MarketData,
  PricePoint,
};
