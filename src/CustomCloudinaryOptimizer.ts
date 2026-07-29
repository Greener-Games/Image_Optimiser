import type { ICmsOptimizer, TransformOptions } from '@greener-games/image-optimiser';
import { logger } from '@/utils/logger';

export class CustomCloudinaryOptimizer implements ICmsOptimizer {
  canHandle(url: string): boolean {
    return url.includes('res.cloudinary.com');
  }

  optimize(url: string, options: TransformOptions): string {
    logger.info(`Optimizing Cloudinary image for width: ${options.width}`);
    
    // Simple example of converting options to Cloudinary URL parameters
    const transforms: string[] = [];
    if (options.width) transforms.push(`w_${options.width}`);
    if (options.height) transforms.push(`h_${options.height}`);
    if (options.quality) transforms.push(`q_${options.quality}`);
    
    if (transforms.length === 0) return url;
    
    // Assume simple URL structure for demonstration purposes:
    // https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg
    // Becomes:
    // https://res.cloudinary.com/demo/image/upload/w_400,q_80/v1234/sample.jpg
    
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
    }
    
    return url;
  }
}
