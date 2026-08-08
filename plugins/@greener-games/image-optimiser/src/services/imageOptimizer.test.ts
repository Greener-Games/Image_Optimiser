import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImageOptimiser } from './imageOptimizer';
import { setupMediaOptimizerConfig, useMediaOptimizerConfig, DEFAULT_SIZE_MAP, type ICmsOptimizer } from './MediaOptimizerConfig';

const resetConfig = () => {
  const config = useMediaOptimizerConfig();
  config.enableCaching = true;
  config.enableOptimization = true;
  config.imageSizeMap = { ...DEFAULT_SIZE_MAP };
  config.optimizers = [];
  config.cacheIdentifiers = [];
  config.expirationDays = 7;
  config.logLevel = 'off';
};

const setViewport = (width: number, dpr = 1) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: dpr });
};

describe('ImageOptimiser', () => {
  beforeEach(resetConfig);
  afterEach(() => vi.restoreAllMocks());

  describe('getOptimizedUrl', () => {
    it('returns the raw url when optimization is disabled', async () => {
      setupMediaOptimizerConfig({ enableOptimization: false });
      expect(await ImageOptimiser.getOptimizedUrl('https://example.com/a.jpg')).toBe(
        'https://example.com/a.jpg'
      );
    });

    it('returns an empty string for an empty url', async () => {
      expect(await ImageOptimiser.getOptimizedUrl('')).toBe('');
    });

    it('uses the first optimizer whose canHandle returns true', async () => {
      const skip: ICmsOptimizer = { canHandle: () => false, optimize: (url) => `SKIP:${url}` };
      const match: ICmsOptimizer = { canHandle: () => true, optimize: (url) => `MATCH:${url}` };
      setupMediaOptimizerConfig({ optimizers: [match] });
      setupMediaOptimizerConfig({ optimizers: [skip] });

      const result = await ImageOptimiser.getOptimizedUrl('https://example.com/a.jpg');
      expect(result).toBe('MATCH:https://example.com/a.jpg');
    });

    it('falls back to the original url when no optimizer matches', async () => {
      const skip: ICmsOptimizer = { canHandle: () => false, optimize: (url) => `SKIP:${url}` };
      setupMediaOptimizerConfig({ optimizers: [skip] });
      expect(await ImageOptimiser.getOptimizedUrl('https://example.com/a.jpg')).toBe(
        'https://example.com/a.jpg'
      );
    });
  });

  describe('getViewportLimit / getConstrainedSize', () => {
    it('picks the smallest defined size whose width covers the viewport', () => {
      setViewport(500, 1);
      // 500 * 1 = 500 -> smallest size with width >= 500 is 's' (600)
      expect(ImageOptimiser.getViewportLimit()).toBe('s');
    });

    it('accounts for devicePixelRatio when computing the effective viewport width', () => {
      setViewport(500, 2);
      // 500 * 2 = 1000 -> smallest size with width >= 1000 is 'lg' (1200)
      expect(ImageOptimiser.getViewportLimit()).toBe('lg');
    });

    it('falls back to the largest sized entry when the viewport exceeds all sizes', () => {
      setViewport(10000, 1);
      expect(ImageOptimiser.getViewportLimit()).toBe('2xl');
    });

    it('never constrains "xs" or "full" regardless of viewport', () => {
      setViewport(100, 1);
      expect(ImageOptimiser.getConstrainedSize('xs')).toBe('xs');
      expect(ImageOptimiser.getConstrainedSize('full')).toBe('full');
    });

    it('downgrades a requested size larger than the viewport limit', () => {
      setViewport(500, 1); // limit = 's'
      expect(ImageOptimiser.getConstrainedSize('2xl')).toBe('s');
    });

    it('keeps a requested size that is already within the viewport limit', () => {
      setViewport(2000, 1); // limit = '2xl'
      expect(ImageOptimiser.getConstrainedSize('m')).toBe('m');
    });
  });
});
