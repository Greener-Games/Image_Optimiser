import type { ICmsCacheIdentifier, AssetCacheInfo } from '../../services/MediaOptimizerConfig';

export class DefaultFallbackCacheIdentifier implements ICmsCacheIdentifier {
  canHandle(_url: string): boolean {
    return true; // Catch-all
  }

  getAssetInfo(url: string): AssetCacheInfo {
    try {
      const name = url.split('/').pop()?.split('?')[0] || 'unknown';
      return { base: url, width: 0, name };
    } catch {
      return { base: url, width: 0, name: 'unknown' };
    }
  }
}
