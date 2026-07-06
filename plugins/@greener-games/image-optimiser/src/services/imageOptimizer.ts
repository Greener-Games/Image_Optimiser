/**
 * Utility to handle Hygraph image transformations.
 * Supports Modern (cdn.hygraph.com) and Legacy (*.graphassets.com) systems.
 */

/** Available logical image size presets. */
export type ImageSize = 'xs' | 's' | 'm' | 'lg' | 'xl' | '2xl' | 'full';

/**
 * Configuration options for image transformation.
 * Maps to Hygraph's asset transformation API properties.
 */
interface TransformOptions {
  /** Target width in pixels */
  width?: number;
  /** Target height in pixels */
  height?: number;
  /** Resize behavior (e.g., 'crop' to fill, 'max' to fit within bounds) */
  fit?: 'clip' | 'crop' | 'scale' | 'max';
  /** Targeted output format */
  format?: 'jpg' | 'png';
  /** Image compression quality (0-100) */
  quality?: number;
}

/**
 * LOGICAL SIZES:
 * xs: 200px (Thumbnails)
 * s:  600px (Curator Cards)
 * m:  900px (Project/Selection Cards)
 * lg: 1200px (Large Tablet / Small Desktop)
 * xl: 1600px (Standard Desktop)
 * 2xl: 1920px (Full Width Components)
 * full: Original quality
 */
export const SIZE_MAP: Record<ImageSize, TransformOptions> = {
  xs: { width: 200, height: 200, fit: 'crop', quality: 80 },
  s: { width: 600, fit: 'max', quality: 90 },
  m: { width: 900, fit: 'max', quality: 90 },
  lg: { width: 1200, fit: 'max', quality: 90 },
  xl: { width: 1600, fit: 'max', quality: 90 },
  '2xl': { width: 1920, fit: 'max', quality: 95 },
  full: { quality: 100 },
};

export class ImageOptimiser {
  /**
   * Transforms a Hygraph asset URL using the appropriate syntax for the domain.
   * Automatically caps the requested size based on the user's viewport limit.
   * 
   * @param url - The original Hygraph image URL.
   * @param size - The requested logical size preset (defaults to 'm').
   * @returns The optimized URL with transformation parameters applied.
   */
  static getOptimizedUrl(url: string, size: ImageSize = 'm'): string {
    if (!url) return '';
    
    // 1. Optimization: Don't request a size larger than the actual screen can display
    const constrainedSize = this.getConstrainedSize(size);
    const options = SIZE_MAP[constrainedSize];
    
    // 2. Handle Modern CDN System (*.cdn.hygraph.com)
    if (url.includes('cdn.hygraph.com')) {
      // Return original if transformations are already present via query parameters
      if (url.includes('?')) return url;

      const params = new URLSearchParams();
      if (options.width) params.append('width', options.width.toString());
      if (options.height) params.append('height', options.height.toString());
      if (options.fit) params.append('fit', options.fit);
      if (options.quality) params.append('quality', options.quality.toString());

      return `${url}?${params.toString()}`;
    }

    // 3. Handle Legacy System (*.graphassets.com)
    if (url.includes('graphassets.com')) {
      // Skip if legacy transformations are already applied in the path
      if (url.includes('resize=') || url.includes('output=')) return url;

      const urlObj = new URL(url);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      
      // Split the path to isolate the environment prefix and the asset handle
      const segments = urlObj.pathname.split('/').filter(Boolean);
      if (segments.length === 0) return url;

      // The last segment in graphassets is always the unique handle
      const handle = segments.pop();
      const envPrefix = segments.length > 0 ? `/${segments.join('/')}` : '';

      // Build the legacy transformation strings (path-based instead of query-based)
      const transforms: string[] = [];
      if (options.width || options.height) {
        const resizeParts: string[] = [];
        if (options.width) resizeParts.push(`width:${options.width}`);
        if (options.height) resizeParts.push(`height:${options.height}`);
        if (options.fit) resizeParts.push(`fit:${options.fit}`);
        transforms.push(`resize=${resizeParts.join(',')}`);
      }

      if (options.quality) {
        transforms.push(`quality=value:${options.quality}`);
      }

      const transformString = transforms.join('/');
      return `${baseUrl}${envPrefix}/${transformString}/${handle}`;
    }

    return url;
  }

  /**
   * Returns the maximum useful image size based on current viewport width and device pixel ratio.
   * Includes a fallback for Server-Side Rendering (SSR) environments.
   * 
   * @returns The calculated maximum logical size (`ImageSize`) needed for the current screen.
   */
  static getViewportLimit(): ImageSize {
    // Fallback for Server-Side Rendering (SSR) environments where `window` is undefined
    if (typeof window === 'undefined') {
      return 'lg'; // Provide a sensible default to avoid Layout Shift
    }

    // Calculate effective screen width considering high-DPI (Retina) displays
    const width = window.innerWidth * window.devicePixelRatio;
    if (width <= 200) return 'xs';
    if (width <= 600) return 's';
    if (width <= 900) return 'm';
    if (width <= 1200) return 'lg';
    if (width <= 1600) return 'xl';
    return '2xl';
  }

  /**
   * Ensures the requested size doesn't exceed what the current screen can actually display,
   * saving bandwidth on smaller screens.
   * 
   * @param requestedSize - The size originally requested by the component.
   * @returns The constrained size, capped at the maximum useful viewport size.
   */
  static getConstrainedSize(requestedSize: ImageSize): ImageSize {
    // Pass through un-constrainable sizes
    if (requestedSize === 'full' || requestedSize === 'xs') return requestedSize;

    const limit = this.getViewportLimit();
    const sizePriority: ImageSize[] = ['xs', 's', 'm', 'lg', 'xl', '2xl', 'full'];
    
    const requestedIdx = sizePriority.indexOf(requestedSize);
    const limitIdx = sizePriority.indexOf(limit);

    // If we are requesting a size larger than the screen's useful limit, 
    // step it down to the limit to save bandwidth.
    if (requestedIdx > limitIdx) {
      return limit;
    }

    return requestedSize;
  }
}
