import type { Timestamp } from 'firebase/firestore';

export const USERS_COLLECTION = 'users';

/**
 * O documento `users/{uid}` — o id é sempre o `uid` do Firebase Auth, nunca um
 * id gerado, para que qualquer tela chegue ao perfil só com o usuário logado
 * em mãos.
 */
export type UserProfile = {
  // Redundante com o id do documento, mas uma query na coleção devolve os
  // dados sem o snapshot junto — e o fórum identifica o autor por este campo.
  uid: string;
  name: string;
  email: string;
  /** Data URL `data:image/jpeg;base64,...`, ou `null` se ainda não enviou foto. */
  photoDataUrl: string | null;
  // `serverTimestamp()` só vira Timestamp depois que o servidor confirma a
  // escrita: numa leitura servida pelo cache local esses campos chegam null.
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};
