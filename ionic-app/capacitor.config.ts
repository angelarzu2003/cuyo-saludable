import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cuyosaludable.app',
  appName: 'Cuyo Saludable',
  webDir: 'www',
  server: {
    // La API de XAMPP usa http (no https): se permite el tráfico sin cifrar en la red local
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
