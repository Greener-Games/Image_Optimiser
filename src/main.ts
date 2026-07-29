import { createApp } from 'vue'
import App from '@/App.vue'

import '@/assets/main.css'

import router from '@/router'
import { createPinia } from 'pinia'
import { logger } from '@/utils/logger';
import { createMediaOptimizerPlugin, HygraphOptimizer } from '@greener-games/image-optimiser';
import { CustomCloudinaryOptimizer } from '@/CustomCloudinaryOptimizer';

// Example usage of the custom logger
logger.info('Application initializing...');
logger.debug('Debug mode is active.');

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Initialize the Media Optimizer Plugin with custom configuration
app.use(createMediaOptimizerPlugin({
  enableCaching: true,
  expirationDays: 30, // Custom expiration
  optimizers: [
    new HygraphOptimizer(), 
    new CustomCloudinaryOptimizer()
  ] // Explicitly injecting optimizers (no built-ins)
}))

app.mount('#app')
logger.info('Application successfully mounted.');
