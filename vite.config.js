import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // Ensures relative paths for GitHub Pages / subfolders
    server: {
        port: 3000,
        open: true,
        // Disable caching in development
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        },
        // Force reload on file changes
        watch: {
            usePolling: true
        }
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
