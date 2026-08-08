import { describe, it, expect, beforeEach } from 'vitest';
import {
  setupMediaOptimizerConfig,
  useMediaOptimizerConfig,
  DEFAULT_SIZE_MAP,
  type ImageSize,
  type TransformOptions,
  type ICmsOptimizer,
  type ICmsCacheIdentifier,
} from './MediaOptimizerConfig';

const resetConfig = () => {
  const config = useMediaOptimizerConfig();
  config.enableCaching = true;
  config.enableOptimization = true;
  config.imageSizeMap = { ...DEFAULT_SIZE_MAP };
  config.optimizers = [];
  config.cacheIdentifiers = [];
  config.cacheName = 'cd-image-cache-v1';
  config.expirationDays = 7;
  config.logLevel = 'off';
};

describe('setupMediaOptimizerConfig', () => {
  beforeEach(resetConfig);

  it('merges simple config values over the defaults', () => {
    setupMediaOptimizerConfig({ enableCaching: false, expirationDays: 30 });
    const config = useMediaOptimizerConfig();
    expect(config.enableCaching).toBe(false);
    expect(config.expirationDays).toBe(30);
    expect(config.enableOptimization).toBe(true);
  });

  it('merges a partial imageSizeMap with the defaults instead of replacing it', () => {
    // setupMediaOptimizerConfig merges per-key at runtime even though the
    // public type declares a full map; cast to reflect that real usage.
    const partialMap = { m: { width: 42 } } as Partial<Record<ImageSize, TransformOptions>> as Record<
      ImageSize,
      TransformOptions
    >;
    setupMediaOptimizerConfig({ imageSizeMap: partialMap });
    const config = useMediaOptimizerConfig();
    expect(config.imageSizeMap.m).toEqual({ width: 42 });
    expect(config.imageSizeMap.lg).toEqual(DEFAULT_SIZE_MAP.lg);
  });

  it('prepends injected optimizers so custom ones take precedence', () => {
    const custom: ICmsOptimizer = { canHandle: () => true, optimize: (url) => url };
    const other: ICmsOptimizer = { canHandle: () => true, optimize: (url) => url };

    setupMediaOptimizerConfig({ optimizers: [custom] });
    setupMediaOptimizerConfig({ optimizers: [other] });

    const config = useMediaOptimizerConfig();
    expect(config.optimizers).toEqual([other, custom]);
  });

  it('prepends injected cache identifiers so custom ones take precedence', () => {
    const identifier: ICmsCacheIdentifier = {
      canHandle: () => true,
      getAssetInfo: (url) => ({ base: url, width: 0, name: url }),
    };

    setupMediaOptimizerConfig({ cacheIdentifiers: [identifier] });

    const config = useMediaOptimizerConfig();
    expect(config.cacheIdentifiers).toEqual([identifier]);
  });
});
