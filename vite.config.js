import { resolve } from 'path'
import { defineConfig } from 'vite'

//const root = '/';
//console.log(__dirname);

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nested: resolve(__dirname, 'forum/index.html'),
      },
    },
  },
})