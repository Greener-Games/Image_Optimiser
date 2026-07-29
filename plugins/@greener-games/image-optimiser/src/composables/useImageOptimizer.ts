import { ref, watch, computed } from 'vue';
import { ImageOptimiser } from '../services/imageOptimizer';
import { ImageCacheService } from '../services/imageCache';
import type { ImageSize } from '../services/MediaOptimizerConfig';

export const useImageOptimizer = () => {
  const getOptimizedUrl = (src: string, size: ImageSize = 'm') => {
    return ImageOptimiser.getOptimizedUrl(src, size);
  };

  const getCachedUrl = async (url: string) => {
    try {
      return await ImageCacheService.getImageUrl(url);
    } catch (e) {
      console.error('useImageOptimizer: Failed to resolve cached image', e);
      return url;
    }
  };

  /**
   * One-off async call to get an optimized and cached image URL
   */
  const getOptimizedImage = async (
    src: string,
    size: ImageSize = 'm'
  ): Promise<string> => {
    if (!src) return '';
    const optimized = getOptimizedUrl(src, size);
    return await getCachedUrl(optimized);
  };

  /**
   * Helper to handle the common logic of getting an optimized and cached URL
   */
  const useOptimizedImage = (
    src: string | (() => string),
    size: ImageSize | (() => ImageSize) = 'm'
  ) => {
    const displayUrl = ref('');

    const srcVal = computed(() => (typeof src === 'function' ? src() : src));
    const sizeVal = computed(() => (typeof size === 'function' ? size() : size));

    const updateUrl = async () => {
      if (!srcVal.value) {
        displayUrl.value = '';
        return;
      }

      const optimized = getOptimizedUrl(srcVal.value, sizeVal.value);
      displayUrl.value = await getCachedUrl(optimized);
    };

    watch([srcVal, sizeVal], updateUrl, { immediate: true });

    return {
      displayUrl,
    };
  };

  /**
   * Helper to handle multiple images simultaneously
   * @param imageConfigs - A reactive object or ref containing image configurations
   */
  const useOptimizedImages = <T extends string>(
    imageConfigs:
      | Record<T, { src: string; size?: ImageSize }>
      | (() => Record<T, { src: string; size?: ImageSize }>)
  ) => {
    const displayUrls = ref<Record<string, string>>({}) as import('vue').Ref<
      Record<T, string>
    >;

    const configsVal = computed(() =>
      typeof imageConfigs === 'function' ? imageConfigs() : imageConfigs
    );

    const updateUrls = async () => {
      const keys = Object.keys(configsVal.value) as T[];
      const results: Partial<Record<T, string>> = {};

      await Promise.all(
        keys.map(async (key) => {
          const { src, size = 'm' } = configsVal.value[key];
          if (!src) {
            results[key] = '';
            return;
          }
          const optimized = getOptimizedUrl(src, size);
          results[key] = await getCachedUrl(optimized);
        })
      );

      displayUrls.value = results as Record<T, string>;
    };

    watch(configsVal, updateUrls, { immediate: true, deep: true });

    return {
      displayUrls,
    };
  };

  return {
    getOptimizedUrl,
    getCachedUrl,
    getOptimizedImage,
    useOptimizedImage,
    useOptimizedImages,
  };
};
