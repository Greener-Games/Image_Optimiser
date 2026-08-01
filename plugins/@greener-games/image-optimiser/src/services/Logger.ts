import { useMediaOptimizerConfig } from './MediaOptimizerConfig';

export class Logger {
  private static readonly PREFIX = '[ImageOptimiser]';

  private static get level() {
    return useMediaOptimizerConfig().logLevel;
  }

  static info(...args: any[]): void {
    if (this.level === 'high') {
      console.log(this.PREFIX, ...args);
    }
  }

  static warn(...args: any[]): void {
    if (this.level === 'low' || this.level === 'high') {
      console.warn(this.PREFIX, ...args);
    }
  }

  static error(...args: any[]): void {
    if (this.level === 'low' || this.level === 'high') {
      console.error(this.PREFIX, ...args);
    }
  }
}
