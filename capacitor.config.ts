import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ednless67runner.app',
  appName: 'Endless67',
  webDir: 'dist',

  // ⚠️ DEV ONLY: Live reload from localhost
  // This is ONLY active when you run: npm run cap:dev
  // Production builds ignore this completely!
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false, // We hide it manually in Boot.js
      backgroundColor: "#000000", // Black background to match game
      showSpinner: false, // Hide spinner for cleaner look (or keep true if preferred)
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    }
  },
  ...(process.env.CAP_DEV_MODE === 'true' && {
    server: {
      url: 'http://192.168.40.4:3000', // Tu IP local detectada
      cleartext: true,
      androidScheme: 'http'
    }
  })
};

export default config;
