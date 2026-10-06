import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { auth, db } from '../firebase';
import { withTimeout } from '../utils/withTimeout';

const CHATS_COLLECTION = 'chats';
const MESSAGES_SUBCOLLECTION = 'messages';
const USERS_COLLECTION = 'users';
const CHAT_TIMEOUT_MS = 20000;

function requireUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Nenhum usuário autenticado.');
  return user.uid;
}

function getChatId(uid1: string, uid2: string): string {
  if (!uid1 || !uid2) throw new Error('IDs ausentes no chat.');
  return [uid1, uid2].sort().join('_');
}

function toDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : new Date();
}

// Representação do banco de dados (Normalizada)
export type RawMessage = {
  id: string;
  text: string;
  createdAt: Date;
  authorId: string;
};

function toRawMessage(snapshot: QueryDocumentSnapshot<DocumentData>): RawMessage {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    text: typeof data.text === 'string' ? data.text : '',
    createdAt: toDate(data.createdAt),
    authorId: typeof data.authorId === 'string' ? data.authorId : '',
  };
}

export async function getUserProfile(userId: string) {
  const snapshot = await withTimeout(
    getDoc(doc(db, USERS_COLLECTION, userId)),
    CHAT_TIMEOUT_MS
  );
  return snapshot.exists() ? snapshot.data() : null;
}

export function subscribeToMessages(
  recipientId: string,
  onUpdate: (messages: RawMessage[]) => void,
  onError: (error: Error) => void
): () => void {
  const uid = requireUid();
  const chatId = getChatId(uid, recipientId);

  const q = query(
    collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => onUpdate(snapshot.docs.map(toRawMessage)),
    onError
  );
}

export async function sendMessage(recipientId: string, text: string): Promise<string> {
  const uid = requireUid();
  const chatId = getChatId(uid, recipientId);

  const reference = await withTimeout(
    addDoc(collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION), {
      text: text.trim(),
      createdAt: serverTimestamp(),
      authorId: uid, 
    }),
    CHAT_TIMEOUT_MS
  );

  return reference.id;
}
