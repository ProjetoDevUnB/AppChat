import type { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../firebase';
import { USERS_COLLECTION, type UserProfile } from '../types/user';
import { withTimeout } from '../utils/withTimeout';

const USER_TIMEOUT_MS = 20000;

// Coleção usada até a foto de perfil passar a morar dentro do documento do
// usuário. Continua sendo lida (nunca escrita) para migrar quem enviou uma
// foto antes da mudança; sai daqui quando a coleção for apagada no console.
const LEGACY_AVATARS_COLLECTION = 'avatars';

function userDoc(uid: string) {
  return doc(db, USERS_COLLECTION, uid);
}

/**
 * Lê o avatar da coleção antiga. Só o backfill chama isto — o caminho normal
 * de leitura e escrita da foto é o campo `photoDataUrl` do próprio usuário.
 */
async function readLegacyAvatar(uid: string): Promise<string | null> {
  const snapshot = await withTimeout(
    getDoc(doc(db, LEGACY_AVATARS_COLLECTION, uid)),
    USER_TIMEOUT_MS,
  );

  const dataUrl = snapshot.data()?.dataUrl;
  return typeof dataUrl === 'string' ? dataUrl : null;
}

/**
 * Cria o documento do usuário no cadastro. `setDoc` sem merge é intencional:
 * aqui o documento é sempre novo, e sobrescrever garante que um uid reciclado
 * não herde sobras de uma conta anterior.
 */
export async function createUserProfile(user: User, name: string): Promise<void> {
  await withTimeout(
    setDoc(userDoc(user.uid), {
      uid: user.uid,
      name,
      email: user.email ?? '',
      photoDataUrl: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    USER_TIMEOUT_MS,
  );
}

/**
 * Lê o perfil. Cada campo é normalizado na saída porque documentos criados
 * antes desta mudança têm só `name` — o resto chega `undefined`.
 */
export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await withTimeout(getDoc(userDoc(uid)), USER_TIMEOUT_MS);
  const data = snapshot.data();
  if (!data) {
    return null;
  }

  return {
    // Documentos criados antes deste campo existir caem no id do próprio
    // documento, que é a mesma coisa.
    uid: typeof data.uid === 'string' ? data.uid : uid,
    name: typeof data.name === 'string' ? data.name : '',
    email: typeof data.email === 'string' ? data.email : '',
    photoDataUrl: typeof data.photoDataUrl === 'string' ? data.photoDataUrl : null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * Atualiza campos avulsos do perfil.
 *
 * O `{ merge: true }` é obrigatório: o documento agora carrega nome, e-mail e
 * data de criação junto da foto, então uma escrita parcial sem merge apagaria
 * todo o resto do perfil.
 */
export async function updateUserProfile(
  uid: string,
  patch: Partial<Omit<UserProfile, 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  await withTimeout(
    setDoc(userDoc(uid), { ...patch, updatedAt: serverTimestamp() }, { merge: true }),
    USER_TIMEOUT_MS,
  );
}

/**
 * Devolve o perfil completo, completando pelo caminho o que faltar — é assim
 * que as contas criadas antes desta mudança ganham e-mail, data de criação e
 * a foto que estava na coleção `avatars`, sem script de migração.
 *
 * No caminho comum (perfil já completo) isto custa uma única leitura e nenhuma
 * escrita.
 */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const existing = await loadUserProfile(user.uid);

  if (!existing) {
    const name = user.displayName ?? '';
    await createUserProfile(user, name);
    return {
      uid: user.uid,
      name,
      email: user.email ?? '',
      photoDataUrl: null,
      createdAt: null,
      updatedAt: null,
    };
  }

  const patch: Partial<Omit<UserProfile, 'createdAt' | 'updatedAt'>> = {};

  if (existing.uid !== user.uid) {
    patch.uid = user.uid;
  }

  if (!existing.name && user.displayName) {
    patch.name = user.displayName;
  }

  if (!existing.email && user.email) {
    patch.email = user.email;
  }

  if (!existing.photoDataUrl) {
    // Uma conta sem foto nenhuma paga uma leitura extra aqui em toda abertura.
    // É o preço de não precisar de script de migração, e ele some junto com a
    // coleção `avatars`.
    const legacyPhoto = await readLegacyAvatar(user.uid);
    if (legacyPhoto) {
      patch.photoDataUrl = legacyPhoto;
    }
  }

  const needsCreatedAt = existing.createdAt === null;

  if (Object.keys(patch).length === 0 && !needsCreatedAt) {
    return existing;
  }

  await withTimeout(
    setDoc(
      userDoc(user.uid),
      {
        ...patch,
        // A data real de criação não existe mais para esses documentos; a de
        // hoje é a melhor aproximação disponível e só é gravada uma vez.
        ...(needsCreatedAt ? { createdAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
    USER_TIMEOUT_MS,
  );

  return { ...existing, ...patch };
}
