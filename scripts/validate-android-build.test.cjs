const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validateAndroidBuild } = require('./validate-android-build.cjs');

function fixture() {
  return {
    env: {
      EXPO_PUBLIC_FIREBASE_API_KEY: 'fake-client-key',
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-test.firebaseapp.com',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'demo-test',
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-test.firebasestorage.app',
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456',
      EXPO_PUBLIC_FIREBASE_APP_ID: '1:123456:web:client',
      GOOGLE_MAPS_API_KEY: 'fake-android-maps-key',
    },
    config: { android: { package: 'com.example.test' } },
    googleServices: {
      project_info: { project_id: 'demo-test', project_number: '123456' },
      client: [{ client_info: {
        mobilesdk_app_id: '1:123456:android:client',
        android_client_info: { package_name: 'com.example.test' },
      } }],
    },
  };
}

test('aceita Firebase JS e Android do mesmo projeto com app IDs distintos', () => {
  assert.doesNotThrow(() => validateAndroidBuild(fixture()));
});

test('recusa configuração incompleta ou valores do .env.example', () => {
  for (const value of [undefined, '', ' ', 'your_api_key_here']) {
    const input = fixture();
    input.env.EXPO_PUBLIC_FIREBASE_API_KEY = value;
    assert.throws(() => validateAndroidBuild(input), /EXPO_PUBLIC_FIREBASE_API_KEY/);
  }
  const input = fixture();
  delete input.env.GOOGLE_MAPS_API_KEY;
  assert.throws(() => validateAndroidBuild(input), /GOOGLE_MAPS_API_KEY/);
});

test('recusa a conta de serviço no lugar do arquivo Android sem revelar a chave', () => {
  const input = fixture();
  input.googleServices = { type: 'service_account', private_key: 'DO-NOT-LOG' };
  assert.throws(() => validateAndroidBuild(input), error => {
    assert.match(error.message, /conta de serviço/);
    assert.ok(!error.message.includes('DO-NOT-LOG'));
    return true;
  });
});

test('recusa pacote Android, projeto ou sender ID incompatíveis', () => {
  const wrongPackage = fixture();
  wrongPackage.config.android.package = 'com.example.other';
  assert.throws(() => validateAndroidBuild(wrongPackage), /pacote Android/);
  const wrongProject = fixture();
  wrongProject.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'another-project';
  assert.throws(() => validateAndroidBuild(wrongProject), /projeto Firebase/);
  const wrongSender = fixture();
  wrongSender.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '987654';
  assert.throws(() => validateAndroidBuild(wrongSender), /sender ID/);
});
