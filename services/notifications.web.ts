// Evita carregar o módulo nativo de notificações no navegador.
import { NotificationSetupError } from './notificationErrors';

export const supportsFcmNotifications = false;
export const notificationUnavailableReason = 'O teste FCM está disponível na build Android do app. Abra o aplicativo no aparelho para testar.';

export async function initializeNotifications(): Promise<void> {}

export async function sendTestNotification(): Promise<void> {
  throw new NotificationSetupError('unsupported', notificationUnavailableReason);
}
