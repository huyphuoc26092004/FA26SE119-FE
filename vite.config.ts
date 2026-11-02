import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    headers: { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' },
    open: true, // Tự động mở trình duyệt hệ thống bên ngoài khi khởi động dev server
  },
  preview: {
    headers: { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' },
  },
});
