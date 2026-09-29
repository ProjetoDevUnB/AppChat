import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebase';
import { USERS_COLLECTION } from '../types/user';
import { withTimeout } from '../utils/withTimeout';

const FETCH_TIMEOUT_MS = 15000;

const FALLBACK_NAME = 'Morador';

export type Author = {
  uid: string;
  name: string;
  /** `null` = sem foto; a UI cai nas iniciais. */
  photoUrl: string | null;
};

// O Firestore não tem join: uma lista de posts só conhece o `authorId`. Sem
// cache, uma tela com cinco posts do mesmo autor faria cinco leituras do mesmo
// documento. O cache vive no módulo (some no reload) e é suficiente para a
// sessão — nomes mudam raramente.
const cache = new Map<string, Author>();

// Duas chamadas simultâneas para o mesmo uid (o caso comum: a lista inteira
// renderiza de uma vez) compartilham a mesma leitura.
const inFlight = new Map<string, Promise<Author>>();

async function fetchAuthor(uid: string): Promise<Author> {
  const snapshot = await withTimeout(
    getDoc(doc(db, USERS_COLLECTION, uid)),
    FETCH_TIMEOUT_MS,
  );

  const data = snapshot.data();
  const name = data?.name;
  // A foto mora no mesmo documento do nome, então ela não custa leitura
  // nenhuma: já veio neste snapshot. O que ela custa é payload — o SDK web não
  // tem projeção (`select()`), então não dá para pedir só o nome. É o cache
  // acima que segura isso numa lista com vários posts do mesmo autor.
  const photoUrl = data?.photoDataUrl;

  return {
    uid,
    name: typeof name === 'string' && name.trim() ? name.trim() : FALLBACK_NAME,
    photoUrl: typeof photoUrl === 'string' ? photoUrl : null,
  };
}

/** Nome e foto do autor, com cache em memória. Nunca rejeita por autor ausente. */
export async function getAuthor(uid: string): Promise<Author> {
  const cached = cache.get(uid);
  if (cached) {
    return cached;
  }

  const pending = inFlight.get(uid);
  if (pending) {
    return pending;
  }

  const promise = fetchAuthor(uid)
    .then((author) => {
      cache.set(uid, author);
      return author;
    })
    .catch((error: any) => {
      // Não saber o nome de quem postou não pode derrubar a lista inteira.
      console.warn('[users] falha ao carregar autor:', uid, error?.code ?? error);
      return { uid, name: FALLBACK_NAME, photoUrl: null };
    })
    .finally(() => {
      inFlight.delete(uid);
    });

  inFlight.set(uid, promise);
  return promise;
}

/**
 * Carrega de uma vez os autores de uma lista de posts e devolve um mapa
 * uid -> autor, pronto para a tela consultar de forma síncrona na renderização.
 */
export async function getAuthors(uids: string[]): Promise<Map<string, Author>> {
  const unique = [...new Set(uids)];
  const authors = await Promise.all(unique.map(getAuthor));
  return new Map(authors.map((author) => [author.uid, author]));
}

/** Descarta o cache — usado ao trocar de conta. */
export function clearAuthorCache() {
  cache.clear();
}

/**
 * Esquece um autor específico. Necessário porque o cache agora guarda a foto:
 * sem isto, quem troca o próprio avatar continua se vendo com o antigo nos
 * posts até recarregar o app.
 */
export function invalidateAuthor(uid: string) {
  cache.delete(uid);
}

/** Iniciais para o avatar quando não há foto. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** "Juliana M." — como os cards do fórum exibem o autor. */
export function getShortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return FALLBACK_NAME;
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
