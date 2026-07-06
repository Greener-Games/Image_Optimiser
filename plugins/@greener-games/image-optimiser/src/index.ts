import type { App, Plugin } from 'vue';
import CacheImage from './components/CacheImage.vue';
import { ImageCacheService } from './services/imageCache';
import { ImageOptimiser, type ImageSize } from './services/imageOptimiser';

const ImageOptimiserPlugin: Plugin = {
  install(app: App) {
    app.component('CacheImage', CacheImage);
  }
};

export { ImageCacheService, ImageOptimiser, type ImageSize, CacheImage };
export default ImageOptimiserPlugin;
