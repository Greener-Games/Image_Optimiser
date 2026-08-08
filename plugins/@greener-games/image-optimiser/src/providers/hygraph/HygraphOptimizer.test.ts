import { describe, it, expect, afterEach, vi } from 'vitest';
import { HygraphOptimizer } from './HygraphOptimizer';

describe('HygraphOptimizer', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('canHandle', () => {
    it('rejects urls from unrelated hosts', async () => {
      const optimizer = new HygraphOptimizer();
      expect(await optimizer.canHandle('https://example.com/a.jpg')).toBe(false);
    });

    it('rejects urls with an .svg extension without making a network request', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      const optimizer = new HygraphOptimizer();
      expect(await optimizer.canHandle('https://cdn.hygraph.com/logo.svg')).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('accepts a hygraph url whose content-type is not svg', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      } as Response);

      const optimizer = new HygraphOptimizer();
      expect(await optimizer.canHandle('https://cdn.hygraph.com/abc123')).toBe(true);
    });

    it('rejects a hygraph url whose content-type is svg', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        headers: new Headers({ 'content-type': 'image/svg+xml' }),
      } as Response);

      const optimizer = new HygraphOptimizer();
      expect(await optimizer.canHandle('https://cdn.hygraph.com/xyz789')).toBe(false);
    });

    it('assumes non-svg when the HEAD request fails', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
      const optimizer = new HygraphOptimizer();
      expect(await optimizer.canHandle('https://cdn.hygraph.com/offline')).toBe(true);
    });
  });

  describe('optimize', () => {
    it('appends transform params as querystring for cdn.hygraph.com', () => {
      const optimizer = new HygraphOptimizer();
      const result = optimizer.optimize('https://cdn.hygraph.com/abc123', {
        width: 800,
        fit: 'max',
        quality: 90,
      });
      const url = new URL(result);
      expect(url.origin + url.pathname).toBe('https://cdn.hygraph.com/abc123');
      expect(url.searchParams.get('width')).toBe('800');
      expect(url.searchParams.get('fit')).toBe('max');
      expect(url.searchParams.get('quality')).toBe('90');
    });

    it('leaves a cdn.hygraph.com url untouched if it already has query params', () => {
      const optimizer = new HygraphOptimizer();
      const input = 'https://cdn.hygraph.com/abc123?width=100';
      expect(optimizer.optimize(input, { width: 800 })).toBe(input);
    });

    it('builds a graphassets.com transform path', () => {
      const optimizer = new HygraphOptimizer();
      const result = optimizer.optimize('https://media.graphassets.com/env1/handle123', {
        width: 800,
        height: 600,
        fit: 'crop',
        quality: 80,
        format: 'webp',
      });
      expect(result).toBe(
        'https://media.graphassets.com/env1/resize=width:800,height:600,fit:crop/quality=value:80/output=format:webp/handle123'
      );
    });

    it('leaves a graphassets.com url untouched if already transformed', () => {
      const optimizer = new HygraphOptimizer();
      const input = 'https://media.graphassets.com/env1/resize=width:100/handle123';
      expect(optimizer.optimize(input, { width: 800 })).toBe(input);
    });

    it('returns unrecognized urls unchanged', () => {
      const optimizer = new HygraphOptimizer();
      expect(optimizer.optimize('https://example.com/a.jpg', { width: 800 })).toBe(
        'https://example.com/a.jpg'
      );
    });
  });
});
