import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/nghe-rung-ke/',
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        story: resolve(__dirname, 'story.html'),
        join: resolve(__dirname, 'join.html'),
        team: resolve(__dirname, 'team.html'),
        thankYou: resolve(__dirname, 'thank-you.html'),
      },
    },
  },
});
