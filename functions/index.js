const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
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

/** Envia notificação para todos os dispositivos registrados do destinatário. */
exports.sendNotificationToUser = onCall({
  region: 'southamerica-east1',
  maxInstances: 10,
  minInstances: 0,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Entre na sua conta para enviar notificações.');
  }

  const { recipientUserId, title, body, data } = request.data ?? {};
  if (typeof recipientUserId !== 'string' || !recipientUserId.trim()) {
    throw new HttpsError('invalid-argument', 'Destinatário inválido.');
  }

  if (typeof title !== 'string' || !title.trim() || typeof body !== 'string' || !body.trim()) {
    throw new HttpsError('invalid-argument', 'Título e mensagem são obrigatórios.');
  }

  // Não envia notificação para si mesmo
  if (recipientUserId === request.auth.uid) {
    return { sent: 0, skipped: true };
  }

  try {
    const db = getFirestore();
    const recipientDoc = await db.doc(`users/${recipientUserId}`).get();
    if (!recipientDoc.exists) {
      return { sent: 0, error: 'user-not-found' };
    }

    const recipientData = recipientDoc.data() || {};
    let rawTokens = [];
    if (Array.isArray(recipientData.fcmTokens)) {
      rawTokens = recipientData.fcmTokens;
    } else if (recipientData.fcmTokens && typeof recipientData.fcmTokens === 'object') {
      rawTokens = Object.keys(recipientData.fcmTokens);
    }

    const tokens = [...new Set(rawTokens.filter((t) => typeof t === 'string' && t.trim().length > 0))];
    if (tokens.length === 0) {
      return { sent: 0, message: 'no-tokens' };
    }

    const stringifiedData = {};
    if (data && typeof data === 'object') {
      for (const [key, val] of Object.entries(data)) {
        stringifiedData[key] = String(val);
      }
    }

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
          channelId: 'default',
          sound: 'default',
        },
      },
      data: stringifiedData,
    });

    // Limpeza de tokens inválidos ou não mais registrados
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
        await db.doc(`users/${recipientUserId}`).update({
          fcmTokens: FieldValue.arrayRemove(...invalidTokens),
        });
      } catch (cleanError) {
        logger.warn('Falha ao limpar tokens expirados do usuário.', { recipientUserId, error: cleanError });
      }
    }

    return {
      sent: response.successCount,
      failed: response.failureCount,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('Falha ao enviar notificação para usuário.', { code: error.code ?? 'unknown' });
    throw new HttpsError('internal', 'Não foi possível enviar a notificação.');
  }
});
