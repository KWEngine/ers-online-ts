import { resolve } from 'path'
import { defineConfig } from 'vite'

//const root = '/';
//console.log(__dirname);

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        forum: resolve(__dirname, 'forum/index.html'),
        bblock0: resolve(__dirname, 'b-block/index.html'),
        cblock0: resolve(__dirname, 'c-block/index.html'),
        cblock1: resolve(__dirname, 'c-block/1/index.html')
      },
    },
  },
})