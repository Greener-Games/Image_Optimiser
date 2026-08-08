import { describe, it, expect } from 'vitest';
import { DefaultFallbackOptimizer } from './DefaultFallbackOptimizer';
import { DefaultFallbackCacheIdentifier } from './DefaultFallbackCacheIdentifier';

describe('DefaultFallbackOptimizer', () => {
  const optimizer = new DefaultFallbackOptimizer();

  it('handles any url', () => {
    expect(optimizer.canHandle('anything')).toBe(true);
  });

  it('returns the url unchanged', () => {
    expect(optimizer.optimize('https://example.com/a.jpg', {})).toBe(
      'https://example.com/a.jpg'
    );
  });
});

describe('DefaultFallbackCacheIdentifier', () => {
  const identifier = new DefaultFallbackCacheIdentifier();

  it('handles any url', () => {
    expect(identifier.canHandle('anything')).toBe(true);
  });

  it('derives the file name and treats the whole url as the base', () => {
    const info = identifier.getAssetInfo('https://example.com/path/photo.jpg?w=100');
    expect(info.base).toBe('https://example.com/path/photo.jpg?w=100');
    expect(info.width).toBe(0);
    expect(info.name).toBe('photo.jpg');
  });
});
