import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Platform } from 'react-native';

import { app, auth } from '../firebase';
import { withTimeout } from '../utils/withTimeout';
import { NotificationSetupError } from './notificationErrors';

const TEST_CHANNEL_ID = 'test-notifications';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const supportsFcmNotifications = Platform.OS === 'android' && !isExpoGo;
export const notificationUnavailableReason = Platform.OS === 'android'
  ? 'Instale uma build própria do app para testar. Notificações remotas não estão disponíveis no Expo Go.'
  : 'O teste de notificações está disponível na build Android do app. O suporte ao iOS ainda não está configurado.';

const sendFcmTest = httpsCallable<{ token: string; platform: 'android' }, { messageId: string }>(
  getFunctions(app, 'southamerica-east1'),
  'sendFcmTestNotification',
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

/** Prepara o canal inclusive para notificações recebidas com o app em segundo plano. */
export async function initializeNotifications(): Promise<void> {
  if (supportsFcmNotifications) {
    await Notifications.setNotificationChannelAsync(TEST_CHANNEL_ID, {
      name: 'Notificações de teste',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}

/** Usa o token nativo FCM e uma callable autenticada, sem Expo Push Service. */
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

  // Busca novamente a cada teste para não reutilizar um token expirado.
  const token = await withTimeout(Notifications.getDevicePushTokenAsync(), 20000);
  if (token.type !== 'android' || typeof token.data !== 'string' || !token.data) {
    throw new NotificationSetupError('invalid-token', 'Não foi possível obter o token FCM deste aparelho.');
  }

  await sendFcmTest({ token: token.data, platform: 'android' });
}
