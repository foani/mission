 import { defineConfig } from 'vite'
 import react from '@vitejs/plugin-react'
 import path from 'path'
 
 // CreataChain Mission Game Admin Dashboard - Vite 설정
 export default defineConfig({
   plugins: [react()],
   
   // 개발 서버 설정
   server: {
     port: 3001, // 프론트엔드(3000), 백엔드(3000)와 공존
     host: true,
     open: true,
     cors: true,
     proxy: {
       // 백엔드 API 프록시
       '/api': {
         target: 'http://localhost:3000',
         changeOrigin: true,
         secure: false
       }
     }
   },
   
   // 빌드 설정
   build: {
     outDir: 'dist',
     sourcemap: false, // 프로덕션에서는 false
     minify: 'esbuild',
     target: 'esnext',
     rollupOptions: {
       output: {
         manualChunks: {
           vendor: ['react', 'react-dom'],
           admin: ['react-admin', 'ra-data-simple-rest'],
           utils: ['axios', 'ethers', 'dayjs']
         }
       }
     }
   },
   
   // 모듈 해석 설정
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
       '@components': path.resolve(__dirname, './src/components'),
       '@services': path.resolve(__dirname, './src/services'),
       '@types': path.resolve(__dirname, './src/types')
     }
   },
   
   // 환경 변수 설정
   define: {
     // 하드코딩된 CreataChain 설정
     __CATENA_RPC_URL__: JSON.stringify('https://cvm.node.creatachain.com'),
     __CHAIN_ID__: JSON.stringify('1000'),
     __BLOCK_EXPLORER__: JSON.stringify('https://catena.explorer.creatachain.com')
   },
   
   // CSS 전처리기 설정
   css: {
     preprocessorOptions: {
       scss: {
         additionalData: `@import "@/styles/variables.scss";`
       }
     },
     modules: {
       localsConvention: 'camelCase'
     }
   },
   
   // 최적화 설정
   optimizeDeps: {
     include: [
       'react',
       'react-dom',
       'react-admin',
       'axios',
       'ethers'
     ],
     exclude: ['vite']
   },
   
   // 미리보기 설정
   preview: {
     port: 3001,
     host: true,
     cors: true
   }
 })
