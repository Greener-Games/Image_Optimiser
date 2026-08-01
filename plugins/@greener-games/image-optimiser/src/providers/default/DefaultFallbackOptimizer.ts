import type { ICmsOptimizer, TransformOptions } from '../../services/MediaOptimizerConfig';

export class DefaultFallbackOptimizer implements ICmsOptimizer {
  canHandle(_url: string): boolean {
    return true; // Catch-all
  }

  optimize(url: string, _options: TransformOptions): string {
    return url; // Returns original unoptimized URL
  }
}
