import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { auth, db } from '../firebase';
import { TimeoutError, withTimeout } from '../utils/withTimeout';

const CHATS_COLLECTION = 'chats';
const MESSAGES_SUBCOLLECTION = 'messages';
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

/**
 * O documento `chats/{chatId}` resume a conversa para a lista de conversas:
 * sem ele seria preciso ler a subcoleção de mensagens de cada chat só para
 * saber a última. É atualizado no mesmo batch de cada mensagem enviada.
 */
export type ChatSummary = {
  id: string;
  otherUserId: string;
  lastMessage: string;
  /** `null` enquanto o servidor não confirma o `serverTimestamp()`. */
  lastMessageAt: Date | null;
  lastMessageAuthorId: string;
  /** Mensagens que o usuário logado ainda não viu. */
  unread: number;
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

function toChatSummary(snapshot: QueryDocumentSnapshot<DocumentData>, uid: string): ChatSummary {
  const data = snapshot.data();
  const participants: unknown[] = Array.isArray(data.participants) ? data.participants : [];
  const other = participants.find((participant) => participant !== uid);
  const unread = data.unreadCount?.[uid];

  return {
    id: snapshot.id,
    otherUserId: typeof other === 'string' ? other : '',
    lastMessage: typeof data.lastMessage === 'string' ? data.lastMessage : '',
    lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toDate() : null,
    lastMessageAuthorId: typeof data.lastMessageAuthorId === 'string' ? data.lastMessageAuthorId : '',
    unread: typeof unread === 'number' && unread > 0 ? unread : 0,
  };
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

/**
 * Conversas do usuário logado, da mais recente para a mais antiga.
 *
 * Ordena no cliente em vez de `orderBy('lastMessageAt')`: com o `orderBy` a
 * query exigiria um índice composto criado à mão no console, e um usuário tem
 * poucas conversas — ordenar aqui custa nada.
 */
export function subscribeToChats(
  onUpdate: (chats: ChatSummary[]) => void,
  onError: (error: Error) => void
): () => void {
  const uid = requireUid();

  const q = query(
    collection(db, CHATS_COLLECTION),
    where('participants', 'array-contains', uid)
  );

  return onSnapshot(
    q,
    (snapshot) =>
      onUpdate(
        snapshot.docs
          .map((chat) => toChatSummary(chat, uid))
          .filter((chat) => chat.otherUserId !== '')
          // `null` = mensagem recém-enviada, ainda sem horário do servidor: vai para o topo.
          .sort(
            (a, b) =>
              (b.lastMessageAt?.getTime() ?? Infinity) - (a.lastMessageAt?.getTime() ?? Infinity)
          )
      ),
    onError
  );
}

export async function sendMessage(recipientId: string, text: string): Promise<string> {
  const uid = requireUid();
  const chatId = getChatId(uid, recipientId);
  const body = text.trim();

  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  const messageRef = doc(collection(chatRef, MESSAGES_SUBCOLLECTION));

  // Mensagem e resumo da conversa no mesmo batch: a lista de conversas nunca
  // mostra uma "última mensagem" que não existe, nem o contrário.
  const batch = writeBatch(db);
  batch.set(messageRef, {
    text: body,
    createdAt: serverTimestamp(),
    authorId: uid,
  });
  batch.set(
    chatRef,
    {
      participants: [uid, recipientId].sort(),
      lastMessage: body,
      lastMessageAt: serverTimestamp(),
      lastMessageAuthorId: uid,
      unreadCount: { [recipientId]: increment(1) },
    },
    { merge: true }
  );

  await withTimeout(batch.commit(), CHAT_TIMEOUT_MS);

  return messageRef.id;
}

/** Tradução de falhas da lista de conversas em mensagem de tela. */
export function describeChatError(error: any): string {
  if (error instanceof TimeoutError) {
    return 'A conexão está demorando demais. Tente novamente.';
  }

  switch (error?.code) {
    case 'permission-denied':
      return 'Você não tem permissão para ver essas conversas.';
    case 'unavailable':
      return 'Sem conexão. Verifique sua internet e tente novamente.';
    default:
      return 'Não foi possível carregar suas conversas. Tente novamente.';
  }
}

/** Zera o contador de não lidas do usuário logado nessa conversa. */
export async function markChatAsRead(recipientId: string): Promise<void> {
  const uid = requireUid();
  const chatId = getChatId(uid, recipientId);

  try {
    await updateDoc(doc(db, CHATS_COLLECTION, chatId), {
      [`unreadCount.${uid}`]: 0,
    });
  } catch (error: any) {
    // Conversa ainda sem nenhuma mensagem: não há o que marcar.
    if (error?.code === 'not-found') return;
    throw error;
  }
}
