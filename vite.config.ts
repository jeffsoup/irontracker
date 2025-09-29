import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.browser': 'true',
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
  resolve: {
    alias: {
      stream: "stream-browserify",
      util: "./src/polyfills/util.ts",
      events: "events",
      buffer: "buffer",
      "util-inspect": "util-inspect",
      assert: "assert",
      path: "path-browserify",
      os: "os-browserify",
    },
  },
  optimizeDeps: {
    include: ['events', 'buffer', 'stream-browserify', 'util-inspect', 'assert', 'path-browserify', 'os-browserify', 'util-promisify'],
    esbuildOptions: {
      plugins: [NodeModulesPolyfillPlugin()]
    }
  }
});
