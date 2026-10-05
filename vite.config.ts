import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

const NODE_SERVICE = 'http://localhost';

export default defineConfig({
  server: {
    host: 'localhost',
    port: 80,
    https: false,
    allowedHosts: ['amgreat.id', '127.0.0.1', 'localhost'],
    proxy: {
      '/api/columns/': {
        target: `${NODE_SERVICE}:3000`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/query-object': {
        target: `${NODE_SERVICE}:3000`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/query-object-in-table': {
        target: `${NODE_SERVICE}:3000`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/save-object': {
        target: `${NODE_SERVICE}:3000`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/drop-object': {
        target: `${NODE_SERVICE}:3000`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/drop': {
        target: `${NODE_SERVICE}:3000`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/update-object': {
        target: `${NODE_SERVICE}:3000`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/query': {
        target: `${NODE_SERVICE}:3001`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/get-list': {
        target: `${NODE_SERVICE}:3001`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/colList': {
        target: `${NODE_SERVICE}:3001`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/get-object-schema': {
        target: `${NODE_SERVICE}:3001`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/html-to-pdf': {
        target: `${NODE_SERVICE}:3001`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/read': {
        target: `${NODE_SERVICE}:3002`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/upload': {
        target: `${NODE_SERVICE}:3002`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/chat': {
        target: `${NODE_SERVICE}:3003`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/chat/register': {
        target: `${NODE_SERVICE}:3003`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      },
      '/api/loadChatUser': {
        target: `${NODE_SERVICE}:3003`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path if your Node backend doesn't expect '/api' prefix
      }
    },
  },
  plugins: [react(), basicSsl()],
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