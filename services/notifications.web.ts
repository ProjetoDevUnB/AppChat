// Implementação segura para ambiente Web sem módulos nativos do Expo Notifications.
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth } from '../firebase';
import { NotificationSetupError } from './notificationErrors';

export const DEFAULT_CHANNEL_ID = 'default';
export const TEST_CHANNEL_ID = 'test-notifications';

export const supportsFcmNotifications = false;
export const notificationUnavailableReason =
  'O teste FCM está disponível na build Android do app. Abra o aplicativo no aparelho para testar.';

export async function initializeNotifications(): Promise<void> {}

export async function sendTestNotification(): Promise<void> {
  throw new NotificationSetupError('unsupported', notificationUnavailableReason);
}

export async function registerCurrentDevicePushToken(): Promise<string | null> {
  return null;
}

export async function unregisterCurrentDevicePushToken(): Promise<void> {}

export async function getUserPushTokens(_userId: string): Promise<string[]> {
  return [];
}

export type PushNotificationPayload = {
  recipientUserId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * Na Web, os usuários ainda podem disparar notificações push para destinatários no Android
 * ao enviar mensagens de chat ou interagir no fórum.
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<{ sent: number }> {
  if (!auth.currentUser || !payload.recipientUserId || payload.recipientUserId === auth.currentUser.uid) {
    return { sent: 0 };
  }

  try {
    const sendNotificationToUserCallable = httpsCallable<
      { recipientUserId: string; title: string; body: string; data?: Record<string, string> },
      { sent: number; failed?: number }
    >(
      getFunctions(app, 'southamerica-east1'),
      'sendNotificationToUser',
      { timeout: 30000 },
    );

    const result = await sendNotificationToUserCallable({
      recipientUserId: payload.recipientUserId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });
    return { sent: result.data.sent ?? 0 };
  } catch (error) {
    console.warn('[notifications.web] falha ao enviar notificação:', error);
    return { sent: 0 };
  }
}

export function setupPushTokenRefreshListener(): null {
  return null;
}
