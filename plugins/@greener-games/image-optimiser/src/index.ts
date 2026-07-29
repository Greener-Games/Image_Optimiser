import type { App, Plugin } from 'vue';
import CacheImage from './components/CacheImage.vue';
import { ImageCacheService } from './services/imageCache';
import { ImageOptimiser } from './services/imageOptimizer';
import { 
  setupMediaOptimizerConfig, 
  useMediaOptimizerConfig,
  type MediaOptimizerConfigData,
  type ImageSize,
  type ICmsOptimizer
} from './services/MediaOptimizerConfig';
import { useImageOptimizer } from './composables/useImageOptimizer';

export * from './services/imageCache';
export * from './services/imageOptimizer';
export * from './services/MediaOptimizerConfig';
export * from './composables/useImageOptimizer';
export * from './providers';

export const createMediaOptimizerPlugin = (
  config: Partial<Omit<MediaOptimizerConfigData, 'optimizers'> & { optimizers?: ICmsOptimizer[] }> = {}
): Plugin => {
  return {
    install(app: App) {
      setupMediaOptimizerConfig(config);
      app.component('CacheImage', CacheImage);
    }
  };
};

export { ImageCacheService, ImageOptimiser, type ImageSize, CacheImage };
