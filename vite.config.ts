import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    __DEV__: JSON.stringify(true),
    'process.env': JSON.stringify({ NODE_ENV: 'development' }),
  },
  optimizeDeps: {
    force: true,
    include: [
      'react-native-web',
      'invariant'
    ],
    exclude: [
      'react-native-vector-icons',
      'expo-modules-core',
      'expo-asset',
      'expo-constants',
      'fsevents'
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.ts': 'ts',
        '.tsx': 'tsx',
      },
    },
  },
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'rn-shim.js'),
      '@react-native/assets-registry/registry': path.resolve(__dirname, 'rn-shim.js'),
    },
  },
});