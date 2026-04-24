import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Using './' as base so the build works at any GitHub Pages URL
// without needing to configure the repo name.
export default defineConfig({
  base: './',
  plugins: [react()],
});
