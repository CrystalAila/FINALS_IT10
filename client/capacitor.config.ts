import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.poultrylink.app',
  appName: 'PoultryLink',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
