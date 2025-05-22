 import { defineConfig } from 'vite';
 import react from '@vitejs/plugin-react';
 import { resolve } from 'path';
 
 // https://vitejs.dev/config/
 export default defineConfig({
   plugins: [react()],
   resolve: {
     alias: {
       '@': resolve(__dirname, './src'),
     },
   },
   define: {
     global: 'globalThis',
   },
   server: {
     port: 3001,
     host: true,
     // 하드코딩된 백엔드 API 프록시 설정
     proxy: {
       '/api': {
         target: 'http://localhost:3000',
         changeOrigin: true,
         secure: false,
       },
     },
   },
   build: {
     outDir: 'dist',
     assetsDir: 'assets',
     sourcemap: true,
     rollupOptions: {
       output: {
         manualChunks: {
           vendor: ['react', 'react-dom'],
           telegram: ['@telegram-apps/sdk'],
           web3: ['ethers'],
         },
       },
     },
   },
   optimizeDeps: {
     include: ['react', 'react-dom', '@telegram-apps/sdk', 'ethers'],
   },
 });
