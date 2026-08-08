import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImageCacheService } from './imageCache';
import { setupMediaOptimizerConfig, useMediaOptimizerConfig, type ICmsCacheIdentifier } from './MediaOptimizerConfig';

const createFakeCache = () => {
  const store = new Map<string, { blob: unknown }>();
  return {
    store,
    match: vi.fn((key: string | { url: string }) => {
      const url = typeof key === 'string' ? key : key.url;
      const entry = store.get(url);
      if (!entry) return Promise.resolve(undefined);
      return Promise.resolve({ blob: () => Promise.resolve(entry.blob) });
    }),
    keys: vi.fn(() => Promise.resolve(Array.from(store.keys()).map((url) => ({ url })))),
    put: vi.fn(async (url: string, response: { blob: () => Promise<unknown> }) => {
      store.set(url, { blob: await response.blob() });
    }),
    delete: vi.fn((url: string) => Promise.resolve(store.delete(url))),
  };
};

const fakeResponse = (blob: unknown, ok = true) => {
  const resp = { ok, blob: () => Promise.resolve(blob), clone: () => resp };
  return resp;
};

const setCacheMeta = (url: string, ageDays: number) => {
  localStorage.setItem(
    `cache_meta_${url}`,
    JSON.stringify({ url, timestamp: Date.now() - ageDays * 24 * 60 * 60 * 1000 })
  );
};

const sizedAssetIdentifier: ICmsCacheIdentifier = {
  canHandle: () => true,
  getAssetInfo: (url) => {
    const match = url.match(/-(\d+)\.jpg$/);
    return {
      base: url.replace(/-\d+\.jpg$/, ''),
      width: match ? Number(match[1]) : 0,
      name: url,
    };
  },
};

describe('ImageCacheService', () => {
  let fakeCache: ReturnType<typeof createFakeCache>;

  beforeEach(() => {
    localStorage.clear();
    fakeCache = createFakeCache();
    vi.stubGlobal('caches', { open: vi.fn(() => Promise.resolve(fakeCache)) });

    let counter = 0;
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(
      () => `blob:mock-${counter++}`
    );
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();

    const config = useMediaOptimizerConfig();
    config.enableCaching = true;
    config.cacheIdentifiers = [];
    config.expirationDays = 7;
    config.cacheName = 'test-cache';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('bypasses caching entirely when disabled', async () => {
    setupMediaOptimizerConfig({ enableCaching: false });
    const result = await ImageCacheService.getImageUrl('https://example.com/disabled.jpg');
    expect(result).toBe('https://example.com/disabled.jpg');
  });

  it('fetches from the network and caches a new asset', async () => {
    const url = 'https://example.com/new-asset.jpg';
    const fetchMock = vi.fn(() => Promise.resolve(fakeResponse('network-blob')));
    vi.stubGlobal('fetch', fetchMock);

    const result = await ImageCacheService.getImageUrl(url);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result).toBe('blob:mock-0');
    expect(fakeCache.put).toHaveBeenCalledWith(url, expect.anything());
    expect(localStorage.getItem(`cache_meta_${url}`)).toBeTruthy();
  });

  it('returns a fresh exact cache match without hitting the network', async () => {
    const url = 'https://example.com/fresh-asset.jpg';
    fakeCache.store.set(url, { blob: 'cached-blob' });
    setCacheMeta(url, 1); // 1 day old, within the 7 day expiration

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await ImageCacheService.getImageUrl(url);

    expect(result).toBe('blob:mock-0');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('evicts a stale exact match instead of reusing it, then re-fetches', async () => {
    const url = 'https://example.com/stale-asset.jpg';
    fakeCache.store.set(url, { blob: 'old-blob' });
    setCacheMeta(url, 30); // older than the 7 day expiration

    const fetchMock = vi.fn(() => Promise.resolve(fakeResponse('fresh-blob')));
    vi.stubGlobal('fetch', fetchMock);

    await ImageCacheService.getImageUrl(url);

    expect(fakeCache.delete).toHaveBeenCalledWith(url);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fakeCache.put).toHaveBeenCalledWith(url, expect.anything());

    const metadata = JSON.parse(localStorage.getItem(`cache_meta_${url}`)!) as { timestamp: number };
    expect(Date.now() - metadata.timestamp).toBeLessThan(5000);
  });

  it('reuses a larger cached sibling instead of fetching a smaller size', async () => {
    setupMediaOptimizerConfig({ cacheIdentifiers: [sizedAssetIdentifier] });

    const largeUrl = 'https://example.com/photo-1200.jpg';
    const smallUrl = 'https://example.com/photo-600.jpg';
    fakeCache.store.set(largeUrl, { blob: 'large-blob' });
    setCacheMeta(largeUrl, 1);

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await ImageCacheService.getImageUrl(smallUrl);

    expect(result).toBe('blob:mock-0');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('evicts a stale sibling and falls through to the network instead of reusing it', async () => {
    setupMediaOptimizerConfig({ cacheIdentifiers: [sizedAssetIdentifier] });

    const largeUrl = 'https://example.com/photo2-1200.jpg';
    const smallUrl = 'https://example.com/photo2-600.jpg';
    fakeCache.store.set(largeUrl, { blob: 'stale-large-blob' });
    setCacheMeta(largeUrl, 30);

    const fetchMock = vi.fn(() => Promise.resolve(fakeResponse('fresh-small-blob')));
    vi.stubGlobal('fetch', fetchMock);

    const result = await ImageCacheService.getImageUrl(smallUrl);

    expect(fakeCache.delete).toHaveBeenCalledWith(largeUrl);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fakeCache.put).toHaveBeenCalledWith(smallUrl, expect.anything());
    expect(result).toBe('blob:mock-0');
  });

  it('falls back to the original url when the network fetch fails', async () => {
    const url = 'https://example.com/broken.jpg';
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(fakeResponse(null, false)))
    );

    const result = await ImageCacheService.getImageUrl(url);
    expect(result).toBe(url);
  });
});
