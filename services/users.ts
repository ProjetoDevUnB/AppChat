import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebase';
import { withTimeout } from '../utils/withTimeout';

const USERS_COLLECTION = 'users';
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

/**
 * Busca a foto de perfil do autor.
 *
 * MOCK: por enquanto devolve sempre `null`, e os cards mostram as iniciais.
 * A leitura real já existe — `loadProfilePhoto(uid)` em `services/profilePhoto.ts`
 * lê `avatars/{uid}` — e basta trocar por ela aqui. O motivo de não ligar agora
 * é o custo: cada avatar é uma data URL de dezenas de KB e seriam N documentos
 * extras por rolagem da lista.
 */
async function fetchPhotoUrl(_uid: string): Promise<string | null> {
  return null;
}

async function fetchAuthor(uid: string): Promise<Author> {
  const [snapshot, photoUrl] = await Promise.all([
    withTimeout(getDoc(doc(db, USERS_COLLECTION, uid)), FETCH_TIMEOUT_MS),
    fetchPhotoUrl(uid),
  ]);

  const name = snapshot.data()?.name;

  return {
    uid,
    name: typeof name === 'string' && name.trim() ? name.trim() : FALLBACK_NAME,
    photoUrl,
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
