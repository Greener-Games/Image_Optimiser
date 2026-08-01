import type { ICmsCacheIdentifier, AssetCacheInfo } from '../services/MediaOptimizerConfig';

export class HygraphCacheIdentifier implements ICmsCacheIdentifier {
  canHandle(url: string): boolean {
    return url.includes('cdn.hygraph.com') || url.includes('graphassets.com');
  }

  getAssetInfo(url: string): AssetCacheInfo {
    let width = 0;
    let base = url;
    const name = url.split('/').pop()?.split('?')[0] || 'unknown';

    if (url.includes('cdn.hygraph.com')) {
      const urlObj = new URL(url);
      width = parseInt(urlObj.searchParams.get('width') || '0', 10);
      base = urlObj.origin + urlObj.pathname;
    } else if (url.includes('graphassets.com')) {
      const urlObj = new URL(url);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      const handle = segments.pop() || '';
      const resizeMatch = url.match(/resize=width:(\d+)/);
      width = resizeMatch ? parseInt(resizeMatch[1], 10) : 0;
      base = `${urlObj.origin}/${segments[0] || ''}/${handle}`;
    }
    
    return { base, width, name };
  }
}
