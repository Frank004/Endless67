import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // Ensures relative paths for GitHub Pages / subfolders
    server: {
        port: 3000,
        open: true,
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: './index.html'
            }
        }
    }
});
