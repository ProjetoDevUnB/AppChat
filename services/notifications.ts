import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Platform } from 'react-native';

import { app, auth, db } from '../firebase';
import { USERS_COLLECTION } from '../types/user';
import { withTimeout } from '../utils/withTimeout';
import { NotificationSetupError } from './notificationErrors';

export const DEFAULT_CHANNEL_ID = 'default';
export const TEST_CHANNEL_ID = 'test-notifications';
const DEVICE_TOKEN_STORAGE_KEY = '@appchat:fcm_device_token';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const supportsFcmNotifications = Platform.OS === 'android' && !isExpoGo;
export const notificationUnavailableReason = Platform.OS === 'android'
  ? 'Instale uma build própria do app para testar. Notificações remotas não estão disponíveis no Expo Go.'
  : 'O teste de notificações está disponível na build Android do app. O suporte ao iOS ainda não está configurado.';

const functionsSouthAmerica = getFunctions(app, 'southamerica-east1');

const sendFcmTest = httpsCallable<{ token: string; platform: 'android' }, { messageId: string }>(
  functionsSouthAmerica,
  'sendFcmTestNotification',
  { timeout: 30000 },
);

const registerDeviceTokenCallable = httpsCallable<{ token: string; platform: 'android' }, { success: boolean }>(
  functionsSouthAmerica,
  'registerDeviceToken',
  { timeout: 15000 },
);

const unregisterDeviceTokenCallable = httpsCallable<{ token: string }, { success: boolean }>(
  functionsSouthAmerica,
  'unregisterDeviceToken',
  { timeout: 15000 },
);

const sendNotificationToUserCallable = httpsCallable<
  { recipientUserId: string; title: string; body: string; data?: Record<string, string> },
  { sent: number; failed?: number }
>(
  functionsSouthAmerica,
  'sendNotificationToUser',
  { timeout: 30000 },
);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Prepara os canais do Android inclusive para notificações recebidas com o app em segundo plano. */
export async function initializeNotifications(): Promise<void> {
  if (supportsFcmNotifications) {
    await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
      name: 'Geral',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync(TEST_CHANNEL_ID, {
      name: 'Notificações de teste',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}

/**
 * Obtém e persiste o token nativo FCM deste dispositivo no perfil do usuário autenticado.
 * Gerencia múltiplos aparelhos adicionando atomicamente o token à lista de tokens do usuário.
 */
export async function registerCurrentDevicePushToken(): Promise<string | null> {
  if (!supportsFcmNotifications) return null;

  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  await initializeNotifications();

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }

  if (!permission.granted) {
    return null;
  }

  try {
    const tokenObj = await withTimeout(Notifications.getDevicePushTokenAsync(), 20000);
    if (tokenObj.type !== 'android' || typeof tokenObj.data !== 'string' || !tokenObj.data) {
      return null;
    }

    const token = tokenObj.data;

    // 1. Persistência direta no Firestore (atômica por arrayUnion)
    try {
      const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
      await setDoc(
        userRef,
        {
          fcmTokens: arrayUnion(token),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (firestoreError) {
      console.warn('[notifications] falha ao persistir token no Firestore:', firestoreError);
    }

    // 2. Persistência e validação no Cloud Function backend
    try {
      await registerDeviceTokenCallable({ token, platform: 'android' });
    } catch (callableError) {
      console.warn('[notifications] falha ao registrar token na Cloud Function:', callableError);
    }

    // Salva localmente para possibilitar desregistro futuro no logout
    try {
      await AsyncStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, token);
    } catch {
      // Ignora erro de cache local
    }

    return token;
  } catch (error) {
    console.warn('[notifications] erro ao obter token push do dispositivo:', error);
    return null;
  }
}

/**
 * Remove o token do aparelho atual do usuário autenticado (ao fazer logout, por exemplo).
 */
export async function unregisterCurrentDevicePushToken(): Promise<void> {
  if (!supportsFcmNotifications) return;

  const currentUser = auth.currentUser;
  let token: string | null = null;
  try {
    token = await AsyncStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
  } catch {
    // Ignora erro de leitura local
  }

  if (!token) return;

  if (currentUser) {
    try {
      const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
      await setDoc(
        userRef,
        {
          fcmTokens: arrayRemove(token),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (firestoreError) {
      console.warn('[notifications] falha ao remover token no Firestore:', firestoreError);
    }

    try {
      await unregisterDeviceTokenCallable({ token });
    } catch (callableError) {
      console.warn('[notifications] falha ao remover token na Cloud Function:', callableError);
    }
  }

  try {
    await AsyncStorage.removeItem(DEVICE_TOKEN_STORAGE_KEY);
  } catch {
    // Ignora
  }
}

/**
 * Busca a lista de tokens registrados para todos os aparelhos de um usuário no Firestore.
 */
export async function getUserPushTokens(userId: string): Promise<string[]> {
  try {
    const snapshot = await withTimeout(
      getDoc(doc(db, USERS_COLLECTION, userId)),
      10000,
    );
    if (!snapshot.exists()) return [];
    const data = snapshot.data();
    if (Array.isArray(data.fcmTokens)) {
      return data.fcmTokens.filter((t: unknown) => typeof t === 'string' && t.trim().length > 0);
    }
    if (data.fcmTokens && typeof data.fcmTokens === 'object') {
      return Object.keys(data.fcmTokens);
    }
    return [];
  } catch (error) {
    console.warn('[notifications] falha ao buscar tokens do usuário:', userId, error);
    return [];
  }
}

export type PushNotificationPayload = {
  recipientUserId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * Envia uma notificação push para todos os dispositivos do destinatário via Cloud Function.
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<{ sent: number }> {
  if (!auth.currentUser) {
    return { sent: 0 };
  }

  if (!payload.recipientUserId || payload.recipientUserId === auth.currentUser.uid) {
    return { sent: 0 };
  }

  try {
    const result = await sendNotificationToUserCallable({
      recipientUserId: payload.recipientUserId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });
    return { sent: result.data.sent ?? 0 };
  } catch (error) {
    console.warn('[notifications] falha ao enviar notificação para usuário:', error);
    return { sent: 0 };
  }
}

/**
 * Observador para atualização ou rotação automática de tokens do FCM pelo sistema operacional.
 */
export function setupPushTokenRefreshListener(): Notifications.Subscription | null {
  if (!supportsFcmNotifications) return null;

  return Notifications.addPushTokenListener((tokenObj) => {
    if (tokenObj.type === 'android' && typeof tokenObj.data === 'string' && tokenObj.data) {
      void registerCurrentDevicePushToken().catch((err) => {
        console.warn('[notifications] falha ao atualizar token na rotação:', err);
      });
    }
  });
}

/** Usa o token nativo FCM e uma callable autenticada, persistindo também o token. */
export async function sendTestNotification(): Promise<void> {
  if (!supportsFcmNotifications) {
    throw new NotificationSetupError('unsupported', notificationUnavailableReason);
  }
  if (!auth.currentUser) {
    throw new NotificationSetupError('signed-out', 'Entre na sua conta para testar as notificações.');
  }

  // No Android 13+, o canal precisa existir antes da solicitação de permissão.
  await initializeNotifications();

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }

  if (!permission.granted) {
    throw new NotificationSetupError(
      'permission-denied',
      'Permita as notificações nas configurações do aparelho e tente novamente.',
    );
  }

  const token = await withTimeout(Notifications.getDevicePushTokenAsync(), 20000);
  if (token.type !== 'android' || typeof token.data !== 'string' || !token.data) {
    throw new NotificationSetupError('invalid-token', 'Não foi possível obter o token FCM deste aparelho.');
  }

  // Garante persistência e sincronização do token para o usuário
  await registerCurrentDevicePushToken();

  await sendFcmTest({ token: token.data, platform: 'android' });
}
