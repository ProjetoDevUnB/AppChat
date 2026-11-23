const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');

initializeApp();

exports.sendFcmTestNotification = onCall({
  region: 'southamerica-east1',
  maxInstances: 2,
  minInstances: 0,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Entre na sua conta para testar.');
  }

  const { token, platform } = request.data ?? {};
  if (platform !== 'android' || typeof token !== 'string'
      || token.length < 20 || token.length > 4096 || /\s/.test(token)
      || token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) {
    throw new HttpsError('invalid-argument', 'Informe um token nativo FCM Android válido.');
  }

  try {
    // A transação mantém o limite mesmo com requisições simultâneas em instâncias diferentes.
    // Esta coleção é exclusiva do servidor: veja as regras no README.
    const db = getFirestore();
    const limitRef = db.doc(`_notificationTestLimits/${request.auth.uid}`);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(limitRef);
      const nextAllowedAt = snapshot.data()?.nextAllowedAt;
      const now = Date.now();
      if (nextAllowedAt instanceof Timestamp && nextAllowedAt.toMillis() > now) {
        throw new HttpsError('resource-exhausted', 'Aguarde 30 segundos entre os testes.');
      }
      transaction.set(limitRef, { nextAllowedAt: Timestamp.fromMillis(now + 30000) });
    });

    // Conteúdo e destinatário único: o cliente não pode enviar campanhas ou conteúdo arbitrário.
    const messageId = await getMessaging().send({
      token,
      notification: {
        title: 'mapeei — Notificação de teste',
        body: 'Tudo certo! Esta notificação foi enviada diretamente pelo FCM.',
      },
      android: {
        priority: 'high',
        ttl: 60000,
        notification: { channelId: 'test-notifications', sound: 'default' },
      },
      data: { type: 'fcm-test' },
    });

    return { messageId };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    if (['messaging/registration-token-not-registered', 'messaging/invalid-registration-token',
      'messaging/mismatched-credential', 'messaging/sender-id-mismatch'].includes(error.code)) {
      throw new HttpsError('failed-precondition', 'Token FCM inválido ou de outro projeto.');
    }
    // Não registra tokens, credenciais ou payloads de erro do provedor.
    logger.error('Falha ao enviar o teste FCM.', { code: error.code ?? 'unknown' });
    throw new HttpsError('internal', 'Não foi possível enviar a notificação pelo FCM.');
  }
});

/** Registra ou atualiza um token nativo de push para o dispositivo atual do usuário. */
exports.registerDeviceToken = onCall({
  region: 'southamerica-east1',
  maxInstances: 10,
  minInstances: 0,
  timeoutSeconds: 15,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Entre na sua conta para registrar o dispositivo.');
  }

  const { token, platform } = request.data ?? {};
  if (platform !== 'android' || typeof token !== 'string'
      || token.length < 20 || token.length > 4096 || /\s/.test(token)
      || token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) {
    throw new HttpsError('invalid-argument', 'Informe um token nativo FCM Android válido.');
  }

  try {
    const db = getFirestore();
    await db.doc(`users/${request.auth.uid}`).set({
      fcmTokens: FieldValue.arrayUnion(token),
      updatedAt: Timestamp.now(),
    }, { merge: true });

    return { success: true };
  } catch (error) {
    logger.error('Falha ao registrar token do dispositivo.', { code: error.code ?? 'unknown' });
    throw new HttpsError('internal', 'Não foi possível registrar o token do dispositivo.');
  }
});

/** Remove o token de um dispositivo ao deslogar ou revogar permissões. */
exports.unregisterDeviceToken = onCall({
  region: 'southamerica-east1',
  maxInstances: 10,
  minInstances: 0,
  timeoutSeconds: 15,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Entre na sua conta para desregistrar o dispositivo.');
  }

  const { token } = request.data ?? {};
  if (typeof token !== 'string' || !token) {
    throw new HttpsError('invalid-argument', 'Token inválido.');
  }

  try {
    const db = getFirestore();
    await db.doc(`users/${request.auth.uid}`).set({
      fcmTokens: FieldValue.arrayRemove(token),
      updatedAt: Timestamp.now(),
    }, { merge: true });

    return { success: true };
  } catch (error) {
    logger.error('Falha ao desregistrar token do dispositivo.', { code: error.code ?? 'unknown' });
    throw new HttpsError('internal', 'Não foi possível desregistrar o token do dispositivo.');
  }
});

/** Auxiliar interno para envio seguro de push pelo backend com limpeza de tokens expirados. */
async function sendToUserTokens(userId, { title, body, data = {}, channelId = 'default' }) {
  if (!userId || typeof userId !== 'string') return { sent: 0 };

  const db = getFirestore();
  const userDoc = await db.doc(`users/${userId}`).get();
  if (!userDoc.exists) return { sent: 0, reason: 'user-not-found' };

  const userData = userDoc.data() || {};
  let rawTokens = [];
  if (Array.isArray(userData.fcmTokens)) {
    rawTokens = userData.fcmTokens;
  } else if (userData.fcmTokens && typeof userData.fcmTokens === 'object') {
    rawTokens = Object.keys(userData.fcmTokens);
  }

  const tokens = [...new Set(rawTokens.filter((t) => typeof t === 'string' && t.trim().length > 0))];
  if (tokens.length === 0) return { sent: 0, message: 'no-tokens' };

  const stringifiedData = {};
  for (const [key, val] of Object.entries(data)) {
    stringifiedData[key] = String(val);
  }

  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: title.trim().slice(0, 100),
        body: body.trim().slice(0, 250),
      },
      android: {
        priority: 'high',
        ttl: 86400000,
        notification: {
          channelId,
          sound: 'default',
        },
      },
      data: stringifiedData,
    });

    const invalidTokens = [];
    response.responses.forEach((res, index) => {
      if (!res.success && res.error) {
        const code = res.error.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      try {
        await db.doc(`users/${userId}`).update({
          fcmTokens: FieldValue.arrayRemove(...invalidTokens),
        });
      } catch (cleanError) {
        logger.warn('Falha ao limpar tokens expirados do usuário.', { userId, error: cleanError });
      }
    }

    return {
      sent: response.successCount,
      failed: response.failureCount,
    };
  } catch (error) {
    logger.error('Falha ao disparar envio de push para usuário.', { userId, code: error.code ?? 'unknown' });
    return { sent: 0, error: 'messaging-failed' };
  }
}

/**
 * Gatilho de Firestore acionado quando uma nova mensagem é criada em chats/{chatId}/messages/{messageId}.
 * O backend determina o destinatário a partir dos participantes do chat, sem intervenção do cliente.
 */
exports.onChatMessageCreated = onDocumentCreated({
  region: 'southamerica-east1',
  document: 'chats/{chatId}/messages/{messageId}',
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return null;

  const messageData = snapshot.data();
  const authorId = messageData?.authorId;
  const { chatId } = event.params;

  const db = getFirestore();
  const chatDoc = await db.doc(`chats/${chatId}`).get();
  if (!chatDoc.exists) return null;

  const chatData = chatDoc.data() || {};
  const participants = Array.isArray(chatData.participants) ? chatData.participants : [];
  const recipientId = participants.find((uid) => uid !== authorId);

  if (!recipientId) return null;

  return sendToUserTokens(recipientId, {
    title: 'mapeei — Chat',
    body: 'Você recebeu uma nova mensagem',
    data: {
      type: 'chat',
      chatId,
      senderId: authorId,
    },
  });
});

/**
 * Gatilho de Firestore acionado quando um comentário é criado em posts/{postId}/comments/{commentId}.
 * O backend busca o autor do post e dispara a notificação se quem comentou não for o próprio autor.
 */
exports.onForumCommentCreated = onDocumentCreated({
  region: 'southamerica-east1',
  document: 'posts/{postId}/comments/{commentId}',
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return null;

  const commentData = snapshot.data();
  const authorId = commentData?.authorId;
  const { postId } = event.params;

  const db = getFirestore();
  const postDoc = await db.doc(`posts/${postId}`).get();
  if (!postDoc.exists) return null;

  const postData = postDoc.data() || {};
  const postAuthorId = postData.authorId;

  // Não notifica se o autor do comentário for o próprio autor do post
  if (!postAuthorId || postAuthorId === authorId) return null;

  return sendToUserTokens(postAuthorId, {
    title: 'mapeei — Fórum',
    body: 'Alguém respondeu o seu post no fórum',
    data: {
      type: 'forum-comment',
      postId,
    },
  });
});

/**
 * Gatilho de Firestore acionado quando um post é atualizado em posts/{postId}.
 * Detecta novas curtidas na lista likedBy e notifica o autor do post, ignorando auto-curtidas.
 */
exports.onForumPostUpdated = onDocumentUpdated({
  region: 'southamerica-east1',
  document: 'posts/{postId}',
}, async (event) => {
  const change = event.data;
  if (!change) return null;

  const beforeData = change.before.data() || {};
  const afterData = change.after.data() || {};

  const beforeLikes = Array.isArray(beforeData.likedBy) ? beforeData.likedBy : [];
  const afterLikes = Array.isArray(afterData.likedBy) ? afterData.likedBy : [];

  const postAuthorId = afterData.authorId;
  if (!postAuthorId) return null;

  // Detecta uids que entraram no likedBy nesta atualização
  const newLikers = afterLikes.filter((uid) => !beforeLikes.includes(uid));
  // Não notifica se o próprio autor curtiu o post
  const validLikers = newLikers.filter((uid) => uid !== postAuthorId);

  if (validLikers.length === 0) return null;

  return sendToUserTokens(postAuthorId, {
    title: 'mapeei — Fórum',
    body: 'Alguém curtiu o seu post',
    data: {
      type: 'forum-like',
      postId: event.params.postId,
    },
  });
});
