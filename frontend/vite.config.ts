import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const API_URL = 'http://localhost:3000';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': API_URL,
    },
  },
});
