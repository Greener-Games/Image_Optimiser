# @greener-games/image-optimiser

A modular Vue 3 plugin that provides an optimized `<CacheImage>` component, reactive composables, and associated services to cache and transform images fetched from Hygraph, standard CDNs, or custom providers.

## Features

- 🖼️ **Automated Sizing**: Intelligently requests the correct image size based on the user's current viewport width.
- 💾 **Smart Caching**: Caches downloaded images using the browser's Cache API to prevent redundant network requests.
- ♻️ **Cache Sibling Reuse**: If a larger version of an image is already cached, it reuses that blob instead of requesting a smaller one.
- 🧩 **Zero Config Component**: Includes the `<CacheImage>` Vue component which can be used as a drop-in replacement for `<img>`.
- 🔌 **Extensible Optimizers**: Easily inject your own `ICmsOptimizer` logic for custom image transformations (e.g. Cloudinary, AWS, SharePoint).
- 🛠️ **Vue Composables**: Built-in `useImageOptimizer` composable for fetching and resolving cached images reactively within `<script setup>`.

## Installation

```bash
npm install @greener-games/image-optimiser
```

## Setup & Configuration

Install the plugin in your Vue application instance using `createMediaOptimizerPlugin()`. You can pass in a configuration object to override defaults and inject custom optimizers.

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { createMediaOptimizerPlugin, HygraphOptimizer } from '@greener-games/image-optimiser';

const app = createApp(App);

// Initialize the plugin with optional configuration
app.use(createMediaOptimizerPlugin({
  enableCaching: true,
  enableOptimization: true,
  // Note: The plugin ships with NO active optimizers by default.
  // You MUST inject the optimizers you wish to use.
  optimizers: [new HygraphOptimizer()] 
}));

app.mount('#app');
```

## Creating a Custom Optimizer

The plugin ships with a `HygraphOptimizer` and a `DefaultFallbackOptimizer`. You can easily add your own by implementing the `ICmsOptimizer` interface and injecting it into the plugin configuration. The system will automatically use the first optimizer whose `canHandle` method returns `true`.

```typescript
import type { ICmsOptimizer, TransformOptions } from '@greener-games/image-optimiser';

export class CustomCloudinaryOptimizer implements ICmsOptimizer {
  canHandle(url: string): boolean {
    return url.includes('res.cloudinary.com');
  }

  optimize(url: string, options: TransformOptions): string {
    // Implement your own URL transformation logic here!
    const widthParam = options.width ? `w_${options.width}` : '';
    // ... parse URL and inject parameters ...
    return `${url}?transform=${widthParam}`; 
  }
}
```

## Usage

### 1. Template Component
Use the component in your templates as a simple drop-in replacement:

```vue
<template>
  <!-- Basic Usage (defaults to 'm' size) -->
  <CacheImage src="https://cdn.hygraph.com/your-image-id" alt="Description" />
  
  <!-- Explicit Logical Size (xs, s, m, lg, xl, 2xl, full) -->
  <CacheImage src="https://cdn.hygraph.com/your-image-id" size="xl" />
</template>
```

### 2. Vue Composable (Reactive)
If you need to resolve an image programmatically within your logic, use the provided composable:

```vue
<script setup lang="ts">
import { useImageOptimizer } from '@greener-games/image-optimiser';

const { displayUrl } = useImageOptimizer().useOptimizedImage('https://cdn.hygraph.com/your-image-id', 'lg');
</script>

<template>
  <div :style="{ backgroundImage: `url(${displayUrl})` }"></div>
</template>
```

### 3. Direct Services (Async)
You can also bypass the Vue reactivity system and use the services directly:

```typescript
import { ImageCacheService, ImageOptimiser } from '@greener-games/image-optimiser';

// Get a transformed URL based on the active optimizers
const optimized = ImageOptimiser.getOptimizedUrl('https://...', 'lg');

// Fetch and cache the URL, returning a blob URL for immediate use
const blobUrl = await ImageCacheService.getImageUrl(optimized);
```
