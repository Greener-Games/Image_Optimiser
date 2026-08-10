import { useMediaOptimizerConfig } from './MediaOptimizerConfig';

export class Logger {
  private static readonly PREFIX = '[ImageOptimiser]';

  private static get level() {
    return useMediaOptimizerConfig().logLevel;
  }

  static info(...args: unknown[]): void {
    if (this.level === 'high') {
      console.log(this.PREFIX, ...args);
    }
  }

  static warn(...args: unknown[]): void {
    if (this.level === 'low' || this.level === 'high') {
      console.warn(this.PREFIX, ...args);
    }
  }

  static error(...args: unknown[]): void {
    if (this.level === 'low' || this.level === 'high') {
      console.error(this.PREFIX, ...args);
    }
  }
}
