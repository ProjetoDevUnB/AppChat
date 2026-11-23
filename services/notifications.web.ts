// Implementação segura para ambiente Web sem módulos nativos do Expo Notifications.
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

export function setupPushTokenRefreshListener(): null {
  return null;
}
