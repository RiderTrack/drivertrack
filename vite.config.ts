import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: funciona en APK (Capacitor) y en cualquier hosting subruta/dominio
  base: './',
  plugins: [react(), tailwindcss()],
});
