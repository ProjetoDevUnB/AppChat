const assert = require('node:assert/strict');
const { test, beforeEach, afterEach, mock } = require('node:test');

process.env.GCLOUD_PROJECT = 'demo-mapeei';
const { registerDeviceToken, unregisterDeviceToken, sendNotificationToUser } = require('../index');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

const token = 'a-valid-native-fcm-token-for-user-device';
const validUser = { uid: 'user-sender' };
const recipientId = 'user-recipient';

let storedData = {};
let docMock;
let multicastMock;

beforeEach(() => {
  storedData = {
    [`users/${recipientId}`]: {
      fcmTokens: [token, 'another-device-token-12345'],
    },
  };

  docMock = mock.method(getFirestore(), 'doc', (path) => ({
    get: async () => ({
      exists: Boolean(storedData[path]),
      data: () => storedData[path],
    }),
    set: async (data, options) => {
      if (options?.merge && storedData[path]) {
        storedData[path] = { ...storedData[path], ...data };
      } else {
        storedData[path] = data;
      }
    },
    update: async (data) => {
      storedData[path] = { ...(storedData[path] || {}), ...data };
    },
  }));

  multicastMock = mock.method(getMessaging(), 'sendEachForMulticast', async (payload) => ({
    successCount: payload.tokens.length,
    failureCount: 0,
    responses: payload.tokens.map(() => ({ success: true, messageId: 'msg-test' })),
  }));
});

afterEach(() => mock.restoreAll());

test('registerDeviceToken: recusa chamadas sem autenticação', async () => {
  await assert.rejects(
    registerDeviceToken.run({ data: { token, platform: 'android' } }),
    { code: 'unauthenticated' },
  );
});

test('registerDeviceToken: recusa token inválido ou plataforma não android', async () => {
  await assert.rejects(
    registerDeviceToken.run({ auth: validUser, data: { token: '', platform: 'android' } }),
    { code: 'invalid-argument' },
  );
  await assert.rejects(
    registerDeviceToken.run({ auth: validUser, data: { token, platform: 'ios' } }),
    { code: 'invalid-argument' },
  );
  await assert.rejects(
    registerDeviceToken.run({ auth: validUser, data: { token: 'ExpoPushToken[1234567890]', platform: 'android' } }),
    { code: 'invalid-argument' },
  );
});

test('registerDeviceToken: registra token válido com sucesso', async () => {
  const result = await registerDeviceToken.run({
    auth: validUser,
    data: { token, platform: 'android' },
  });
  assert.deepEqual(result, { success: true });
  assert.equal(docMock.mock.callCount() >= 1, true);
});

test('unregisterDeviceToken: recusa chamadas sem autenticação ou token inválido', async () => {
  await assert.rejects(
    unregisterDeviceToken.run({ data: { token } }),
    { code: 'unauthenticated' },
  );
  await assert.rejects(
    unregisterDeviceToken.run({ auth: validUser, data: { token: '' } }),
    { code: 'invalid-argument' },
  );
});

test('unregisterDeviceToken: remove token com sucesso', async () => {
  const result = await unregisterDeviceToken.run({
    auth: validUser,
    data: { token },
  });
  assert.deepEqual(result, { success: true });
});

test('sendNotificationToUser: recusa chamadas sem autenticação', async () => {
  await assert.rejects(
    sendNotificationToUser.run({
      data: { recipientUserId: recipientId, title: 'Chat', body: 'Nova mensagem' },
    }),
    { code: 'unauthenticated' },
  );
});

test('sendNotificationToUser: recusa dados incompletos', async () => {
  await assert.rejects(
    sendNotificationToUser.run({
      auth: validUser,
      data: { recipientUserId: '', title: 'Chat', body: 'Mensagem' },
    }),
    { code: 'invalid-argument' },
  );
  await assert.rejects(
    sendNotificationToUser.run({
      auth: validUser,
      data: { recipientUserId: recipientId, title: '', body: 'Mensagem' },
    }),
    { code: 'invalid-argument' },
  );
});

test('sendNotificationToUser: ignora envio para si mesmo', async () => {
  const result = await sendNotificationToUser.run({
    auth: validUser,
    data: { recipientUserId: validUser.uid, title: 'Chat', body: 'Mensagem' },
  });
  assert.equal(result.skipped, true);
  assert.equal(multicastMock.mock.callCount(), 0);
});

test('sendNotificationToUser: envia notificação para os tokens do destinatário', async () => {
  const result = await sendNotificationToUser.run({
    auth: validUser,
    data: {
      recipientUserId: recipientId,
      title: 'Chat',
      body: 'Você recebeu uma nova mensagem',
      data: { type: 'chat' },
    },
  });

  assert.equal(result.sent, 2);
  assert.equal(multicastMock.mock.callCount(), 1);
  const callArg = multicastMock.mock.calls[0].arguments[0];
  assert.equal(callArg.tokens.length, 2);
  assert.equal(callArg.notification.title, 'Chat');
  assert.equal(callArg.notification.body, 'Você recebeu uma nova mensagem');
  assert.equal(callArg.android.notification.channelId, 'default');
  assert.deepEqual(callArg.data, { type: 'chat' });
});

test('sendNotificationToUser: limpa tokens inválidos retornados pelo FCM', async () => {
  multicastMock.mock.mockImplementation(async (payload) => ({
    successCount: 1,
    failureCount: 1,
    responses: [
      { success: true, messageId: 'msg-1' },
      {
        success: false,
        error: Object.assign(new Error('not registered'), {
          code: 'messaging/registration-token-not-registered',
        }),
      },
    ],
  }));

  const result = await sendNotificationToUser.run({
    auth: validUser,
    data: {
      recipientUserId: recipientId,
      title: 'Fórum',
      body: 'Alguém respondeu o seu post no fórum',
    },
  });

  assert.equal(result.sent, 1);
  assert.equal(result.failed, 1);
});
