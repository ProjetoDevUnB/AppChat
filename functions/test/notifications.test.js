const assert = require('node:assert/strict');
const { test, beforeEach, afterEach, mock } = require('node:test');

process.env.GCLOUD_PROJECT = 'demo-mapeei';
const { sendFcmTestNotification } = require('../index');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

const token = 'a-valid-native-fcm-token-for-testing';
const request = { auth: { uid: 'test-user' }, data: { token, platform: 'android' } };
let send;
let transaction;
let limit;

beforeEach(() => {
  limit = undefined;
  transaction = mock.method(getFirestore(), 'runTransaction', async (callback) => callback({
    get: async () => ({ data: () => limit }),
    set: (_reference, data) => { limit = data; },
  }));
  send = mock.method(getMessaging(), 'send', async () => 'projects/demo-mapeei/messages/test');
});
afterEach(() => mock.restoreAll());

test('recusa chamadas sem autenticação antes de acessar Firestore ou FCM', async () => {
  await assert.rejects(sendFcmTestNotification.run({ data: request.data }), { code: 'unauthenticated' });
  assert.equal(transaction.mock.callCount(), 0);
  assert.equal(send.mock.callCount(), 0);
});

test('recusa tokens Expo, tokens ausentes e plataformas que não usam FCM neste setup', async () => {
  for (const data of [null, {}, { token: 'ExpoPushToken[abcdefghijklmnop]', platform: 'android' },
    { token, platform: 'ios' }, { token: `${token} bad`, platform: 'android' },
    { token: 'x'.repeat(4097), platform: 'android' }]) {
    await assert.rejects(sendFcmTestNotification.run({ auth: request.auth, data }), { code: 'invalid-argument' });
  }
  assert.equal(transaction.mock.callCount(), 0);
  assert.equal(send.mock.callCount(), 0);
});

test('envia apenas ao token informado, com conteúdo fixo e o canal Android do app', async () => {
  const result = await sendFcmTestNotification.run({
    ...request, data: { ...request.data, title: 'conteúdo não autorizado', topic: 'todos' },
  });
  assert.equal(result.messageId, 'projects/demo-mapeei/messages/test');
  const message = send.mock.calls[0].arguments[0];
  assert.equal(message.token, token);
  assert.equal(message.notification.title, 'mapeei — Notificação de teste');
  assert.equal(message.android.notification.channelId, 'test-notifications');
  assert.equal(message.android.priority, 'high');
  assert.equal(message.topic, undefined);
  assert.deepEqual(message.data, { type: 'fcm-test' });
});

test('bloqueia novo envio durante os 30 segundos de intervalo', async () => {
  await sendFcmTestNotification.run(request);
  await assert.rejects(sendFcmTestNotification.run(request), { code: 'resource-exhausted' });
  assert.equal(send.mock.callCount(), 1);
});

test('permite novo teste quando o intervalo termina', async () => {
  limit = { nextAllowedAt: Timestamp.fromMillis(Date.now() - 1000) };
  await sendFcmTestNotification.run(request);
  assert.equal(send.mock.callCount(), 1);
  assert.ok(limit.nextAllowedAt.toMillis() > Date.now());
});

test('traduz token FCM expirado sem expor detalhes do provedor', async () => {
  send.mock.mockImplementation(async () => {
    throw Object.assign(new Error('detalhe privado do provedor'), { code: 'messaging/registration-token-not-registered' });
  });
  await assert.rejects(sendFcmTestNotification.run(request), (error) => {
    assert.equal(error.code, 'failed-precondition');
    assert.equal(error.message.includes('detalhe privado'), false);
    return true;
  });
});

test('não envia se o Firestore não confirmar o controle de intervalo', async () => {
  transaction.mock.mockImplementation(async () => { throw Object.assign(new Error('sem acesso'), { code: 'unavailable' }); });
  mock.method(require('firebase-functions/logger'), 'error', () => {});
  await assert.rejects(sendFcmTestNotification.run(request), { code: 'internal' });
  assert.equal(send.mock.callCount(), 0);
});
