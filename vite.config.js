import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 启用详细日志
  logLevel: 'info',
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: 'https://moelove.info',
        changeOrigin: true,
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      },
      '/api': {
        target: 'http://localhost:7860',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
