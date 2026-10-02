// Build para el APK (Capacitor). En el celular "localhost" es el propio teléfono,
// así que se usa la IP de la PC donde corre XAMPP (ambos en la misma red WiFi).
// También se puede cambiar desde la app: Perfil -> Servidor.
export const environment = {
  production: true,
  apiUrl: 'http://192.168.1.50/proyecto/api',
  serviceWorker: false, // en el APK los archivos ya están en el celular
};
