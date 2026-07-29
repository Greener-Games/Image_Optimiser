import type { ICmsOptimizer, TransformOptions } from '../services/MediaOptimizerConfig';

export class HygraphOptimizer implements ICmsOptimizer {
  canHandle(url: string): boolean {
    return url.includes('cdn.hygraph.com') || url.includes('graphassets.com');
  }

  optimize(url: string, options: TransformOptions): string {
    if (url.includes('cdn.hygraph.com')) {
      if (url.includes('?')) return url;

      const params = new URLSearchParams();
      if (options.width) params.append('width', options.width.toString());
      if (options.height) params.append('height', options.height.toString());
      if (options.fit) params.append('fit', options.fit);
      if (options.quality) params.append('quality', options.quality.toString());
      if (options.format) params.append('format', options.format);

      return `${url}?${params.toString()}`;
    }

    if (url.includes('graphassets.com')) {
      if (url.includes('resize=') || url.includes('output=')) return url;

      const urlObj = new URL(url);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      
      const segments = urlObj.pathname.split('/').filter(Boolean);
      if (segments.length === 0) return url;

      const handle = segments.pop();
      const envPrefix = segments.length > 0 ? `/${segments.join('/')}` : '';

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
      
      if (options.format) {
        transforms.push(`output=format:${options.format}`);
      }

      const transformString = transforms.join('/');
      return `${baseUrl}${envPrefix}/${transformString}/${handle}`;
    }

    return url;
  }
}
