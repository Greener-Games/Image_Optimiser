import { useMediaOptimizerConfig } from './MediaOptimizerConfig';
import { Logger } from './Logger';


interface CacheMetadata {
  timestamp: number;
  url: string;
}

export class ImageCacheService {
  private static blobGuiRegistry = new Map<string, string>();
  private static pendingRequests = new Map<string, Promise<string>>();

  /**
   * Helper to format bytes to a readable size
   */
  private static formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = 2;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  private static getBaseAssetInfo(url: string): { base: string, width: number, name: string } {
    const config = useMediaOptimizerConfig();
    const identifier = config.cacheIdentifiers?.find(id => id.canHandle(url));
    
    if (identifier) {
      return identifier.getAssetInfo(url);
    }

    // Default Fallback
    try {
      const name = url.split('/').pop()?.split('?')[0] || 'unknown';
      return { base: url, width: 0, name };
    } catch {
      return { base: url, width: 0, name: 'unknown' };
    }
  }

  /**
   * Returns a local Blob URL for a cached image, or fetches/caches it if missing.
   * SMART: If a larger version of this same image exists in cache, it uses that instead.
   */
  static async getImageUrl(url: string): Promise<string> {
    if (!url) return '';

    const config = useMediaOptimizerConfig();
    if (!config.enableCaching) {
      return url;
    }

    // 1. Check Registry (Synchronous check)
    if (this.blobGuiRegistry.has(url)) {
      return this.blobGuiRegistry.get(url)!;
    }

    // 2. Check for Pending Request (Deduplication)
    // If another component is already fetching this URL, wait for that same promise.
    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url)!;
    }

    // Create a new request promise
    const requestPromise = this.fetchAndCache(url);
    this.pendingRequests.set(url, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up pending tracker regardless of success/failure
      this.pendingRequests.delete(url);
    }
  }

  /**
   * Internal fetch logic with retry and fallback
   */
  private static async fetchAndCache(url: string): Promise<string> {
    const { base, width: requestedWidth, name } = this.getBaseAssetInfo(url);

    try {
      const config = useMediaOptimizerConfig();
      const cache = await caches.open(config.cacheName);

      // 1. Check for exact match first
      const exactMatch = await cache.match(url);
      if (exactMatch) {
        if (!this.isStale(url)) {
          const blob = await exactMatch.blob();
          Logger.info(`Exact match found: ${name}`);
          return this.createBlobUrl(url, blob);
        }
        // Stale: evict so it doesn't linger in the Cache API/localStorage forever
        await this.evictCacheEntry(cache, url);
      }

      // 2. SMART CACHE CHECK: Look for siblings (same asset, different size)
      const keys = await cache.keys();
      for (const request of keys) {
        const cachedUrl = request.url;
        const { base: cachedBase, width: cachedWidth } = this.getBaseAssetInfo(cachedUrl);

        if (base === cachedBase && cachedWidth >= requestedWidth && requestedWidth > 0) {
          if (this.isStale(cachedUrl)) {
            await this.evictCacheEntry(cache, cachedUrl);
            continue;
          }
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            Logger.info(`Smart match found: ${name} (Using ${cachedWidth}px for ${requestedWidth}px request)`);
            return this.createBlobUrl(url, blob);
          }
        }
      }

      // 3. Fetch from Network
      Logger.info(`Fetching from network: ${name}`);
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'same-origin'
      });

      if (response.ok) {
        const responseClone = response.clone();
        const blobForSize = await response.clone().blob();

        await cache.put(url, responseClone);
        this.updateMetadata(url);

        Logger.info(`Cached new asset: ${name} (${this.formatSize(blobForSize.size)})`);

        const blob = await response.blob();
        return this.createBlobUrl(url, blob);
      }

      // Fallback to direct URL if fetch fails
      return url;
    } catch (e) {
      Logger.error('Failed to fetch/cache image:', name, e);
      return url; // Return original URL so image can still try to load via <img> tag
    }
  }

  private static createBlobUrl(originalUrl: string, blob: Blob): string {
    const existing = this.blobGuiRegistry.get(originalUrl);
    if (existing) {
      URL.revokeObjectURL(existing);
    }
    const blobUrl = URL.createObjectURL(blob);
    this.blobGuiRegistry.set(originalUrl, blobUrl);
    return blobUrl;
  }

  /**
   * Removes a stale entry from the Cache API and its associated localStorage
   * metadata so both stores don't grow unbounded with dead entries.
   */
  private static async evictCacheEntry(cache: Cache, url: string): Promise<void> {
    await cache.delete(url);
    localStorage.removeItem(`cache_meta_${url}`);
  }

  /**
   * Preloads an array of images and returns when all are ready
   */
  static async preloadImages(urls: string[]): Promise<void[]> {
    const uniqueUrls = [...new Set(urls)].filter(Boolean);
    return Promise.all(uniqueUrls.map(url => this.getImageUrl(url).then(u => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = u;
      });
    })));
  }

  private static isStale(url: string): boolean {
    const metadata = localStorage.getItem(`cache_meta_${url}`);
    if (!metadata) return true;

    try {
      const { timestamp } = JSON.parse(metadata) as CacheMetadata;
      const now = Date.now();
      const diffDays = (now - timestamp) / (1000 * 60 * 60 * 24);
      const config = useMediaOptimizerConfig();
      return diffDays > config.expirationDays;
    } catch {
      return true;
    }
  }

  private static updateMetadata(url: string) {
    const metadata: CacheMetadata = {
      timestamp: Date.now(),
      url
    };
    localStorage.setItem(`cache_meta_${url}`, JSON.stringify(metadata));
  }
}
