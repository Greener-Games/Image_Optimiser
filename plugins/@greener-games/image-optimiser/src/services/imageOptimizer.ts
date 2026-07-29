import {
  useMediaOptimizerConfig,
  type ImageSize,
  type ICmsOptimizer
} from './MediaOptimizerConfig';

export class ImageOptimiser {
  static getOptimizedUrl(url: string, size: ImageSize = 'm'): string {
    const config = useMediaOptimizerConfig();
    
    if (!url || !config.enableOptimization) return url || '';

    const options = config.imageSizeMap[this.getConstrainedSize(size)];
    
    // Iterate through user-injected optimizers
    const activeOptimizer = config.optimizers.find(opt => opt.canHandle(url));
    
    if (activeOptimizer) {
      return activeOptimizer.optimize(url, options);
    }

    // No optimizer matched, return original URL
    return url;
  }

  static getViewportLimit(): ImageSize {
    if (typeof window === 'undefined') {
      return 'lg';
    }

    const config = useMediaOptimizerConfig();
    const width = window.innerWidth * window.devicePixelRatio;

    // Get all sizes that have a defined width, sorted by that width
    const sortedSizes = (Object.keys(config.imageSizeMap) as ImageSize[])
      .filter((size) => config.imageSizeMap[size].width !== undefined)
      .sort(
        (a, b) =>
          (config.imageSizeMap[a].width || 0) -
          (config.imageSizeMap[b].width || 0)
      );

    // Find the first size that is large enough for the viewport
    const limit = sortedSizes.find(
      (size) => (config.imageSizeMap[size].width || 0) >= width
    );

    // Fallback to the largest available size if viewport is huge, or '2xl' if nothing found
    return limit || sortedSizes[sortedSizes.length - 1] || '2xl';
  }

  static getConstrainedSize(requestedSize: ImageSize): ImageSize {
    if (requestedSize === 'full' || requestedSize === 'xs') return requestedSize;

    const limit = this.getViewportLimit();
    const sizePriority: ImageSize[] = ['xs', 's', 'm', 'lg', 'xl', '2xl', 'full'];
    
    const requestedIdx = sizePriority.indexOf(requestedSize);
    const limitIdx = sizePriority.indexOf(limit);

    if (requestedIdx > limitIdx) {
      return limit;
    }

    return requestedSize;
  }
}
