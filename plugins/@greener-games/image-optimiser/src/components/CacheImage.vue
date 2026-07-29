<template>
  <img v-if="optimizedUrl" :src="optimizedUrl" :alt="alt" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { ImageCacheService } from '../services/imageCache';
import { ImageOptimiser } from '../services/imageOptimizer';
import type { ImageSize } from '../services/MediaOptimizerConfig';

const props = withDefaults(defineProps<{
  src?: string;
  size?: ImageSize;
  alt?: string;
}>(), {
  src: '',
  size: 'm',
  alt: ''
});

const optimizedUrl = ref<string>('');

const loadImage = async () => {
  if (!props.src) {
    optimizedUrl.value = '';
    return;
  }
  
  const urlToFetch = ImageOptimiser.getOptimizedUrl(props.src, props.size);
  optimizedUrl.value = await ImageCacheService.getImageUrl(urlToFetch);
};

watch(() => props.src, loadImage);
onMounted(loadImage);
</script>
