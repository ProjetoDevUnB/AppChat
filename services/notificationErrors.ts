import { TimeoutError } from '../utils/withTimeout';

type SetupErrorCode = 'permission-denied' | 'unsupported' | 'signed-out' | 'invalid-token';

export class NotificationSetupError extends Error {
  constructor(public code: SetupErrorCode, message: string) {
    super(message);
  }
}

export function describeNotificationError(error: unknown): string {
  if (error instanceof NotificationSetupError) return error.message;
  if (error instanceof TimeoutError) {
    return 'O registro no FCM demorou demais. Verifique sua conexão e tente novamente.';
  }

  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case 'functions/unauthenticated':
      return 'Entre novamente na sua conta para testar as notificações.';
    case 'functions/resource-exhausted':
      return 'Aguarde 30 segundos entre os testes de notificação.';
    case 'functions/not-found':
      return 'A função de teste ainda não está disponível no Firebase. Publique sendFcmTestNotification e tente novamente.';
    case 'functions/failed-precondition':
      return 'O FCM não aceitou o token deste aparelho. Confira a configuração do Firebase e gere uma nova build do app.';
    case 'functions/unavailable':
    case 'functions/deadline-exceeded':
      return 'O servidor não respondeu. Verifique sua conexão e tente novamente.';
    default:
      return 'Não foi possível enviar o teste pelo FCM. Confira a conexão, a configuração do Firebase e a publicação da função.';
  }
}
