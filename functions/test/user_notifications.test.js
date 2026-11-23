const assert = require('node:assert/strict');
const { test, beforeEach, afterEach, mock } = require('node:test');

process.env.GCLOUD_PROJECT = 'demo-mapeei';
const {
  registerDeviceToken,
  unregisterDeviceToken,
  onChatMessageCreated,
  onForumCommentCreated,
  onForumPostUpdated,
} = require('../index');
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
    'chats/chat_123': {
      participants: [validUser.uid, recipientId],
    },
    'posts/post_abc': {
      authorId: recipientId,
      likedBy: [],
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

test('onChatMessageCreated: envia notificação no chat ao outro participante', async () => {
  const event = {
    params: { chatId: 'chat_123', messageId: 'msg_001' },
    data: {
      data: () => ({ authorId: validUser.uid, text: 'Olá!' }),
    },
  };

  const result = await onChatMessageCreated.run(event);
  assert.equal(result.sent, 2);
  assert.equal(multicastMock.mock.callCount(), 1);

  const callArg = multicastMock.mock.calls[0].arguments[0];
  assert.equal(callArg.tokens.length, 2);
  assert.equal(callArg.notification.title, 'mapeei — Chat');
  assert.equal(callArg.notification.body, 'Você recebeu uma nova mensagem');
  assert.deepEqual(callArg.data, {
    type: 'chat',
    chatId: 'chat_123',
    senderId: validUser.uid,
  });
});

test('onForumCommentCreated: envia notificação ao autor do post ao receber comentário', async () => {
  const event = {
    params: { postId: 'post_abc', commentId: 'comm_001' },
    data: {
      data: () => ({ authorId: validUser.uid, body: 'Excelente post!' }),
    },
  };

  const result = await onForumCommentCreated.run(event);
  assert.equal(result.sent, 2);
  assert.equal(multicastMock.mock.callCount(), 1);

  const callArg = multicastMock.mock.calls[0].arguments[0];
  assert.equal(callArg.notification.title, 'mapeei — Fórum');
  assert.equal(callArg.notification.body, 'Alguém respondeu o seu post no fórum');
  assert.deepEqual(callArg.data, {
    type: 'forum-comment',
    postId: 'post_abc',
  });
});

test('onForumCommentCreated: não notifica se o autor do comentário for o próprio autor do post', async () => {
  const event = {
    params: { postId: 'post_abc', commentId: 'comm_002' },
    data: {
      data: () => ({ authorId: recipientId, body: 'Meu próprio comentário' }),
    },
  };

  const result = await onForumCommentCreated.run(event);
  assert.equal(result, null);
  assert.equal(multicastMock.mock.callCount(), 0);
});

test('onForumPostUpdated: notifica autor do post quando houver nova curtida', async () => {
  const event = {
    params: { postId: 'post_abc' },
    data: {
      before: {
        data: () => ({ authorId: recipientId, likedBy: [] }),
      },
      after: {
        data: () => ({ authorId: recipientId, likedBy: [validUser.uid] }),
      },
    },
  };

  const result = await onForumPostUpdated.run(event);
  assert.equal(result.sent, 2);
  assert.equal(multicastMock.mock.callCount(), 1);

  const callArg = multicastMock.mock.calls[0].arguments[0];
  assert.equal(callArg.notification.title, 'mapeei — Fórum');
  assert.equal(callArg.notification.body, 'Alguém curtiu o seu post');
  assert.deepEqual(callArg.data, {
    type: 'forum-like',
    postId: 'post_abc',
  });
});

test('onForumPostUpdated: não notifica se o próprio autor curtiu seu post', async () => {
  const event = {
    params: { postId: 'post_abc' },
    data: {
      before: {
        data: () => ({ authorId: recipientId, likedBy: [] }),
      },
      after: {
        data: () => ({ authorId: recipientId, likedBy: [recipientId] }),
      },
    },
  };

  const result = await onForumPostUpdated.run(event);
  assert.equal(result, null);
  assert.equal(multicastMock.mock.callCount(), 0);
});
