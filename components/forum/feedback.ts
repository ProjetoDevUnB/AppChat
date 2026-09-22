import { Alert } from 'react-native';

import { NotSignedInError } from '../../services/forum';
import { TimeoutError } from '../../utils/withTimeout';

// Tradução de falhas em mensagem de tela, no mesmo molde do
// `describePhotoError` do ProfileScreen.
export function describeForumError(error: any): string {
  if (error instanceof NotSignedInError) {
    return 'Entre na sua conta para participar das conversas.';
  }

  if (error instanceof TimeoutError) {
    return 'A conexão está demorando demais. Tente novamente.';
  }

  switch (error?.code) {
    case 'permission-denied':
      return 'Você não tem permissão para fazer isso.';
    case 'unavailable':
      return 'Sem conexão. Verifique sua internet e tente novamente.';
    case 'failed-precondition':
      // Query com where + orderBy sem o índice composto criado no console.
      return 'O fórum ainda está sendo preparado no servidor. Tente de novo em instantes.';
    case 'not-found':
      return 'Essa conversa não existe mais.';
    default:
      return 'Não foi possível carregar as conversas. Tente novamente.';
  }
}

/** Convite a entrar quando uma ação exige conta. */
export function promptSignIn(onSignIn: () => void) {
  Alert.alert(
    'Entre para participar',
    'Você precisa de uma conta para curtir, comentar e publicar no fórum.',
    [
      { text: 'Agora não', style: 'cancel' },
      { text: 'Entrar', onPress: onSignIn },
    ],
  );
}

/**
 * Remove acentos e caixa para que "Ceilandia" ache "Ceilândia".
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
