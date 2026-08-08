import { describe, it, expect } from 'vitest';
import { HygraphCacheIdentifier } from './HygraphCacheIdentifier';

describe('HygraphCacheIdentifier', () => {
  const identifier = new HygraphCacheIdentifier();

  it('handles cdn.hygraph.com and graphassets.com urls only', () => {
    expect(identifier.canHandle('https://cdn.hygraph.com/abc')).toBe(true);
    expect(identifier.canHandle('https://media.graphassets.com/env/abc')).toBe(true);
    expect(identifier.canHandle('https://example.com/abc')).toBe(false);
  });

  it('extracts base and width from a cdn.hygraph.com url', () => {
    const info = identifier.getAssetInfo('https://cdn.hygraph.com/abc123?width=800&quality=90');
    expect(info.base).toBe('https://cdn.hygraph.com/abc123');
    expect(info.width).toBe(800);
    expect(info.name).toBe('abc123');
  });

  it('defaults width to 0 when a cdn.hygraph.com url has no width param', () => {
    const info = identifier.getAssetInfo('https://cdn.hygraph.com/abc123');
    expect(info.width).toBe(0);
  });

  it('extracts base and width from a transformed graphassets.com url', () => {
    const info = identifier.getAssetInfo(
      'https://media.graphassets.com/env1/resize=width:800,height:600/handle123'
    );
    expect(info.base).toBe('https://media.graphassets.com/env1/handle123');
    expect(info.width).toBe(800);
    expect(info.name).toBe('handle123');
  });

  it('defaults width to 0 for an untransformed graphassets.com url', () => {
    const info = identifier.getAssetInfo('https://media.graphassets.com/env1/handle123');
    expect(info.width).toBe(0);
  });
});
