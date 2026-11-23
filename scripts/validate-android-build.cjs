const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function validateAndroidBuild({ env, config, googleServices }) {
  const required = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
    'GOOGLE_MAPS_API_KEY',
  ];
  const missing = required.filter(name => !env[name]?.trim() || env[name].startsWith('your_'));
  if (missing.length) {
    throw new Error(`Configure as variáveis de build: ${missing.join(', ')}`);
  }
  assert.ok(!googleServices.private_key && googleServices.type !== 'service_account',
    'Use o google-services.json do app Android; uma chave de conta de serviço não pode entrar no APK.');
  const client = googleServices.client?.find(
    entry => entry.client_info?.android_client_info?.package_name === config.android.package,
  );
  assert.ok(client, 'O google-services.json não contém o pacote Android configurado no app.json.');
  assert.equal(googleServices.project_info?.project_id === env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    true, 'O projeto Firebase do .env/EAS difere do google-services.json.');
  assert.equal(String(googleServices.project_info?.project_number) === env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    true, 'O sender ID FCM do .env/EAS difere do google-services.json.');
  // APP_ID é o do cliente JS/web e pode diferir do mobilesdk_app_id Android.
}

if (require.main === module) {
  if (process.env.EAS_BUILD_PLATFORM && process.env.EAS_BUILD_PLATFORM !== 'android') {
    console.log('Validação Android ignorada nesta plataforma.');
  } else {
    try {
      const config = require('../app.config')({ config: require('../app.json').expo });
      const file = path.resolve(__dirname, '..', config.android.googleServicesFile);
      let googleServices;
      try {
        googleServices = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {
        throw new Error('google-services.json ausente ou inválido. Configure GOOGLE_SERVICES_JSON como File no EAS ou disponibilize o arquivo local.');
      }
      validateAndroidBuild({ env: process.env, config, googleServices });
      console.log('Configuração Android/Firebase validada, sem exibir credenciais.');
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}

module.exports = { validateAndroidBuild };
