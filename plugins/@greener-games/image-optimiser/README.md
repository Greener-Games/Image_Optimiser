# @greener-games/image-Optimiser

A Vue 3 plugin that provides an optimized `<CacheImage>` component and associated services to cache and transform images fetched from Hygraph or standard CDNs.

## Features

- 🖼️ **Automated Sizing**: Intelligently requests the correct image size based on the user's current viewport width.
- 💾 **Smart Caching**: Caches downloaded images using the browser's Cache API to prevent redundant network requests.
- ♻️ **Cache Sibling Reuse**: If a larger version of an image is already cached, it reuses that blob instead of requesting a smaller one.
- 🧩 **Zero Config Component**: Includes the `<CacheImage>` Vue component which can be used as a drop-in replacement for `<img>`.

## Installation

```bash
npm install @greener-games/image-Optimiser
```

## Setup

Install the plugin in your Vue application instance:

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import ImageOptimiserPlugin from '@greener-games/image-Optimiser';

const app = createApp(App);
app.use(ImageOptimiserPlugin);
app.mount('#app');
```

## Usage

Use the component in your templates:

```vue
<template>
  <!-- Basic Usage -->
  <CacheImage src="https://cdn.hygraph.com/your-image-id" alt="Description" />
  
  <!-- Explicit Logical Size (xs, s, m, lg, xl, 2xl, full) -->
  <CacheImage src="https://cdn.hygraph.com/your-image-id" size="xl" />
</template>
```

You can also use the underlying services directly:

```typescript
import { ImageCacheService, ImageOptimiser } from '@greener-games/image-Optimiser';

// Get a transformed URL
const optimized = ImageOptimiser.getOptimizedUrl('...', 'lg');

// Fetch and cache the URL, returning a blob URL for immediate use
const blobUrl = await ImageCacheService.getImageUrl(optimized);
```
