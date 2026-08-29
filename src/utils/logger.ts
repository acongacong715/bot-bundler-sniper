import pino from 'pino';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Logger utility dengan Pino
 * Support untuk file logging dan console output
 */

const logDir = process.env.LOG_FILE_PATH || './logs';

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logLevel = process.env.LOG_LEVEL || 'info';

// Configure Pino logger
const logger = pino(
  {
    level: logLevel,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  },
  pino.destination(path.join(logDir, 'bot.log'))
);

export class Logger {
  static debug(msg: string, obj?: any) {
    logger.debug(obj || {}, msg);
  }

  static info(msg: string, obj?: any) {
    logger.info(obj || {}, msg);
  }

  static warn(msg: string, obj?: any) {
    logger.warn(obj || {}, msg);
  }

  static error(msg: string, error?: Error | any) {
    if (error instanceof Error) {
      logger.error(
        {
          err: error,
          stack: error.stack,
        },
        msg
      );
    } else {
      logger.error(error || {}, msg);
    }
  }

  static fatal(msg: string, error?: Error | any) {
    if (error instanceof Error) {
      logger.fatal(
        {
          err: error,
          stack: error.stack,
        },
        msg
      );
    } else {
      logger.fatal(error || {}, msg);
    }
  }

  /**
   * Log transaksi untuk audit trail
   */
  static logTransaction(txSignature: string, details: any) {
    logger.info(
      {
        txSignature,
        ...details,
      },
      'Transaction Logged'
    );
  }

  /**
   * Log error transaksi
   */
  static logTransactionError(txSignature: string, error: Error) {
    logger.error(
      {
        txSignature,
        err: error,
        stack: error.stack,
      },
      'Transaction Error'
    );
  }
}

export default Logger;
