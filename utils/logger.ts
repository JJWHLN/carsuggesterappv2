/**
 * 🔧 Production-Safe Logging Service
 * Replaces console.log with conditional, optimized logging
 */

const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

export class Logger {
  private static instance: Logger;
  private enabled: boolean = isDevelopment;
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`🔧 ${message}`, ...args);
    }
  }
  
  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`ℹ️  ${message}`, ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    if (this.enabled || __DEV__) {
      console.warn(`⚠️  ${message}`, ...args);
    }
  }
  
  error(message: string, error?: any, ...args: any[]): void {
    if (this.enabled) {
      console.error(`❌ ${message}`, error, ...args);
    } else {
      console.error(`❌ ${message}`, error?.message || 'Error occurred');
    }
  }
  
  performance(operation: string, duration: number): void {
    if (this.enabled) {
      console.log(`📊 ${operation}: ${duration}ms`);
    }
  }
}

export const logger = Logger.getInstance();
