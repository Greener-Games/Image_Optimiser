import { reactive } from 'vue';

export type ImageSize = 'xs' | 's' | 'm' | 'lg' | 'xl' | '2xl' | 'full';

export interface TransformOptions {
  width?: number;
  height?: number;
  fit?: 'clip' | 'crop' | 'scale' | 'max';
  format?: 'jpg' | 'png' | 'webp';
  quality?: number;
}

export interface ICmsOptimizer {
  /**
   * Determine if this optimizer can handle the given URL.
   * By returning true, the system will use this optimizer for the image.
   */
  canHandle(url: string): boolean | Promise<boolean>;
  /**
   * Apply transformations to the URL.
   */
  optimize(url: string, options: TransformOptions): string | Promise<string>;
}

export interface AssetCacheInfo {
  base: string;
  width: number;
  name: string;
}

export interface ICmsCacheIdentifier {
  canHandle(url: string): boolean;
  getAssetInfo(url: string): AssetCacheInfo;
}

export interface MediaOptimizerConfigData {
  enableCaching: boolean;
  enableOptimization: boolean;
  imageSizeMap: Record<ImageSize, TransformOptions>;
  /** 
   * A registry of available optimizers. 
   * Custom optimizers can be injected here. 
   */
  optimizers: ICmsOptimizer[];
  /** 
   * A registry of available cache identifiers. 
   */
  cacheIdentifiers: ICmsCacheIdentifier[];
  cacheName: string;
  expirationDays: number;
  /**
   * Log level for the internal logger.
   * 'off': no logs
   * 'low': errors and warnings only
   * 'high': all logs (including cache hits/misses)
   */
  logLevel: 'off' | 'low' | 'high';
}

export const DEFAULT_SIZE_MAP: Record<ImageSize, TransformOptions> = {
  xs: { width: 200, height: 200, fit: 'crop', quality: 80 },
  s: { width: 600, fit: 'max', quality: 90 },
  m: { width: 900, fit: 'max', quality: 90 },
  lg: { width: 1200, fit: 'max', quality: 90 },
  xl: { width: 1600, fit: 'max', quality: 90 },
  '2xl': { width: 1920, fit: 'max', quality: 95 },
  full: { quality: 100 },
};

const config = reactive<MediaOptimizerConfigData>({
  enableCaching: true,
  enableOptimization: true,
  imageSizeMap: DEFAULT_SIZE_MAP,
  optimizers: [],
  cacheIdentifiers: [],
  cacheName: 'cd-image-cache-v1',
  expirationDays: 7,
  logLevel: 'off',
});

export const setupMediaOptimizerConfig = (
  newConfig: Partial<Omit<MediaOptimizerConfigData, 'optimizers' | 'cacheIdentifiers'> & { optimizers?: ICmsOptimizer[], cacheIdentifiers?: ICmsCacheIdentifier[] }>
) => {
  const { imageSizeMap, optimizers, cacheIdentifiers, ...rest } = newConfig;

  // Merge the rest of the simple config
  Object.assign(config, rest);

  // If imageSizeMap is provided, merge it with defaults to ensure all required sizes exist
  if (imageSizeMap) {
    const mergedMap = { ...DEFAULT_SIZE_MAP };
    (Object.keys(DEFAULT_SIZE_MAP) as ImageSize[]).forEach((size) => {
      if (imageSizeMap[size]) {
        mergedMap[size] = imageSizeMap[size];
      }
    });
    config.imageSizeMap = mergedMap;
  }

  // If custom optimizers are provided, add them to the beginning of the list 
  // so they take precedence over built-in ones
  if (optimizers && optimizers.length > 0) {
    config.optimizers.unshift(...optimizers);
  }

  if (cacheIdentifiers && cacheIdentifiers.length > 0) {
    config.cacheIdentifiers.unshift(...cacheIdentifiers);
  }
};

export const useMediaOptimizerConfig = () => {
  return config;
};
