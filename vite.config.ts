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
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
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
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/save-object': {
        target: `${NODE_SERVICE}:3000`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/drop-object': {
        target: `${NODE_SERVICE}:3000`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/drop': {
        target: `${NODE_SERVICE}:3000`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/update-object': {
        target: `${NODE_SERVICE}:3000`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/query': {
        target: `${NODE_SERVICE}:3001`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/get-list': {
        target: `${NODE_SERVICE}:3001`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/colList': {
        target: `${NODE_SERVICE}:3001`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/get-object-schema': {
        target: `${NODE_SERVICE}:3001`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/html-to-pdf': {
        target: `${NODE_SERVICE}:3001`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/read': {
        target: `${NODE_SERVICE}:3002`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/upload': {
        target: `${NODE_SERVICE}:3002`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/chat': {
        target: `${NODE_SERVICE}:3003`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/chat/register': {
        target: `${NODE_SERVICE}:3003`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
      },
      '/api/loadChatUser': {
        target: `${NODE_SERVICE}:3003`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Vite Proxy] Incoming API Call -> Method: ${req.method}, Original URL: ${req.url}, Forwarding to Target: ${options.target}${proxyReq.path}`);
          });
        },
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