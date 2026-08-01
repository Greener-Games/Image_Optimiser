import type { App, Plugin } from 'vue';
import CacheImage from './components/CacheImage.vue';
import { ImageCacheService } from './services/imageCache';
import { ImageOptimiser } from './services/imageOptimizer';
import { 
  setupMediaOptimizerConfig, 
  type MediaOptimizerConfigData,
  type ImageSize,
  type ICmsOptimizer,
  type ICmsCacheIdentifier
} from './services/MediaOptimizerConfig';

export * from './services/imageCache';
export * from './services/imageOptimizer';
export * from './services/MediaOptimizerConfig';
export * from './composables/useImageOptimizer';
export * from './providers';
export * from './services/Logger';

export const createMediaOptimizerPlugin = (
  config: Partial<Omit<MediaOptimizerConfigData, 'optimizers' | 'cacheIdentifiers'> & { optimizers?: ICmsOptimizer[], cacheIdentifiers?: ICmsCacheIdentifier[] }> = {}
): Plugin => {
  return {
    install(app: App) {
      setupMediaOptimizerConfig(config);
      app.component('CacheImage', CacheImage);
    }
  };
};

export { ImageCacheService, ImageOptimiser, type ImageSize, CacheImage };
