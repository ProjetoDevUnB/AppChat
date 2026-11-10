const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
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
