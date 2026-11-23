module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    // No EAS, uma variável do tipo File contém o caminho do arquivo no worker.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || config.android.googleServicesFile,
    config: {
      ...config.android.config,
      googleMaps: {
        ...config.android.config?.googleMaps,
        apiKey: process.env.GOOGLE_MAPS_API_KEY || config.android.config?.googleMaps?.apiKey,
      },
    },
  },
});
