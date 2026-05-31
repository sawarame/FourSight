import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import ToastService from 'primevue/toastservice';
import 'primeicons/primeicons.css';

import Dashboard from './Dashboard.vue';

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#eef4ff',
            100: '#dce8ff',
            200: '#b9d1ff',
            300: '#96bbff',
            400: '#73a5ff',
            500: '#0969da', // GitHub Blue
            600: '#0758c0',
            700: '#0648a3',
            800: '#043785',
            900: '#032666',
            950: '#021845'
        }
    }
});

const app = createApp(Dashboard);
app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      darkModeSelector: 'system'
    }
  }
});
app.use(ToastService);
app.mount('#app');
