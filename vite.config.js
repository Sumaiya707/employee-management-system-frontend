import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Development proxy: the browser only talks to http://localhost:5173, and Vite
// forwards every request that starts with /api to the EMS backend. The browser
// sees one origin, so the login cookie and the backend's CORS/CSRF checks work
// without hard-coding the backend address in the app.
//
// EMS_API_TARGET changes where /api goes (default: the backend on port 5000),
// e.g. EMS_API_TARGET=http://localhost:5001 npm run dev
const apiTarget = process.env.EMS_API_TARGET || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The backend only accepts browser requests from its CLIENT_URL
    // (http://localhost:5173), so do not silently move to another port.
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        // Keep the browser's Host and Origin headers: the backend's CSRF check
        // compares Origin with CLIENT_URL.
        changeOrigin: false,
      },
    },
  },
})
