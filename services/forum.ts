import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  GeoPoint,
  getDoc,
  getDocs,
  increment,
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
import type { Comment, Coordinate, FlairId, Post, TopicId } from '../types/forum';
import { withTimeout } from '../utils/withTimeout';

const POSTS_COLLECTION = 'posts';
const COMMENTS_SUBCOLLECTION = 'comments';

const FORUM_TIMEOUT_MS = 20000;

export const MAX_TITLE_LENGTH = 100;
export const MAX_BODY_LENGTH = 2000;
export const MAX_COMMENT_LENGTH = 1000;

/** A ação exige alguém logado (curtir, comentar, publicar). */
export class NotSignedInError extends Error {
  constructor() {
    super('Nenhum usuário autenticado.');
  }
}

function requireUid(): string {
  const user = auth.currentUser;
  if (!user) {
    throw new NotSignedInError();
  }
  return user.uid;
}

// `serverTimestamp()` só vira Timestamp depois que o servidor confirma a
// escrita; até lá o snapshot local traz `null` nesse campo.
function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toPost(snapshot: QueryDocumentSnapshot<DocumentData>): Post {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    title: typeof data.title === 'string' ? data.title : '',
    body: typeof data.body === 'string' ? data.body : '',
    topic: data.topic as TopicId,
    flair: data.flair as FlairId,
    authorId: typeof data.authorId === 'string' ? data.authorId : '',
    createdAt: toDate(data.createdAt),
    likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
    commentCount: typeof data.commentCount === 'number' ? data.commentCount : 0,
    location:
      data.location instanceof GeoPoint
        ? { latitude: data.location.latitude, longitude: data.location.longitude }
        : null,
  };
}

function toComment(
  postId: string,
  snapshot: QueryDocumentSnapshot<DocumentData>,
): Comment {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    postId,
    body: typeof data.body === 'string' ? data.body : '',
    authorId: typeof data.authorId === 'string' ? data.authorId : '',
    createdAt: toDate(data.createdAt),
  };
}

/** Todos os posts, do mais recente ao mais antigo. Alimenta a visão geral. */
export async function listAllPosts(): Promise<Post[]> {
  const snapshot = await withTimeout(
    getDocs(query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'))),
    FORUM_TIMEOUT_MS,
  );

  // Um orderBy sozinho usa o índice automático de campo único, então esta
  // query não precisa de configuração. O sort local só reposiciona os posts
  // com createdAt ainda pendente, que o servidor não tem como ordenar.
  return snapshot.docs.map(toPost).sort(byNewestFirst);
}

/**
 * Ordena do mais recente ao mais antigo.
 *
 * `createdAt` nulo significa "escrita ainda não confirmada pelo servidor" — ou
 * seja, acabou de ser criado. Por isso vale como o MAIS recente, e não como
 * zero: tratado como zero, um post recém-publicado afundaria para o fim da
 * lista justamente no momento em que o autor espera vê-lo no topo.
 */
function byNewestFirst(a: Post, b: Post): number {
  const left = a.createdAt?.getTime() ?? Infinity;
  const right = b.createdAt?.getTime() ?? Infinity;
  return right - left;
}

/**
 * Posts de uma Região Administrativa.
 *
 * A query traz só o `where` e a ordenação acontece aqui, no cliente. Combinar
 * `where` com `orderBy` exigiria um índice composto criado à mão no console do
 * Firebase — um passo manual que todo mundo que clonar o projeto teria que
 * repetir. Sem `limit()` na query, nada se perde: o Firestore devolve todos os
 * posts da RA de qualquer forma, e o `orderBy` só escolheria a ordem da entrega.
 *
 * Se um dia entrar paginação (`limit` + `startAfter`), a ordenação precisa
 * voltar para o servidor e o índice composto passa a ser necessário.
 */
export async function listPostsByTopic(topic: TopicId): Promise<Post[]> {
  const snapshot = await withTimeout(
    getDocs(query(collection(db, POSTS_COLLECTION), where('topic', '==', topic))),
    FORUM_TIMEOUT_MS,
  );

  return snapshot.docs.map(toPost).sort(byNewestFirst);
}

/**
 * Posts da RA que foram marcados no mapa.
 *
 * Não existe query geográfica aqui: o recorte espacial já é o `topic` (uma RA),
 * então basta a mesma query de `listPostsByTopic` filtrada no cliente. Um
 * `where('location', '!=', null)` exigiria índice composto com `topic` — o
 * mesmo passo manual que `listPostsByTopic` evita.
 */
export async function listMappedPostsByTopic(topic: TopicId): Promise<Post[]> {
  return (await listPostsByTopic(topic)).filter((post) => post.location !== null);
}

/** Um post pelo id. `null` se ele foi apagado enquanto a tela estava aberta. */
export async function getPost(postId: string): Promise<Post | null> {
  const snapshot = await withTimeout(
    getDoc(doc(db, POSTS_COLLECTION, postId)),
    FORUM_TIMEOUT_MS,
  );

  if (!snapshot.exists()) {
    return null;
  }

  return toPost(snapshot as QueryDocumentSnapshot<DocumentData>);
}

/** Comentários de um post, do mais antigo ao mais recente (ordem de leitura). */
export async function listComments(postId: string): Promise<Comment[]> {
  const snapshot = await withTimeout(
    getDocs(
      query(
        collection(db, POSTS_COLLECTION, postId, COMMENTS_SUBCOLLECTION),
        orderBy('createdAt', 'asc'),
      ),
    ),
    FORUM_TIMEOUT_MS,
  );

  return snapshot.docs.map((docSnapshot) => toComment(postId, docSnapshot));
}

export type NewPost = {
  title: string;
  body: string;
  topic: TopicId;
  flair: FlairId;
  location?: Coordinate | null;
};

/** Publica um post e devolve o id gerado. */
export async function createPost({
  title,
  body,
  topic,
  flair,
  location,
}: NewPost): Promise<string> {
  const uid = requireUid();

  const reference = await withTimeout(
    addDoc(collection(db, POSTS_COLLECTION), {
      title: title.trim().slice(0, MAX_TITLE_LENGTH),
      body: body.trim().slice(0, MAX_BODY_LENGTH),
      topic,
      flair,
      authorId: uid,
      createdAt: serverTimestamp(),
      likedBy: [],
      commentCount: 0,
      // Sem local, o campo nem é gravado: `location: null` obrigaria as regras
      // do Firestore a aceitar dois formatos.
      ...(location ? { location: new GeoPoint(location.latitude, location.longitude) } : {}),
    }),
    FORUM_TIMEOUT_MS,
  );

  return reference.id;
}

/**
 * Comenta num post.
 *
 * O comentário e o contador do post vão no mesmo `writeBatch`: como o
 * `commentCount` é denormalizado (os comentários estão numa subcoleção), duas
 * escritas separadas poderiam deixar o número mentindo se a segunda falhasse.
 */
export async function addComment(postId: string, body: string): Promise<string> {
  const uid = requireUid();

  const postRef = doc(db, POSTS_COLLECTION, postId);
  const commentRef = doc(collection(postRef, COMMENTS_SUBCOLLECTION));

  const batch = writeBatch(db);
  batch.set(commentRef, {
    body: body.trim().slice(0, MAX_COMMENT_LENGTH),
    authorId: uid,
    createdAt: serverTimestamp(),
  });
  batch.update(postRef, { commentCount: increment(1) });

  await withTimeout(batch.commit(), FORUM_TIMEOUT_MS);

  return commentRef.id;
}

/**
 * Curte ou descurte. `liked` é o estado DESEJADO, não o atual — assim a tela
 * pode atualizar de forma otimista e mandar o mesmo valor que já mostrou.
 * `arrayUnion`/`arrayRemove` são idempotentes, então tocar duas vezes rápido
 * não desequilibra a lista.
 */
export async function toggleLike(postId: string, liked: boolean): Promise<void> {
  const uid = requireUid();

  await withTimeout(
    updateDoc(doc(db, POSTS_COLLECTION, postId), {
      likedBy: liked ? arrayUnion(uid) : arrayRemove(uid),
    }),
    FORUM_TIMEOUT_MS,
  );
}

export type TopicSummary = {
  topicId: TopicId;
  postCount: number;
  /** Post mais recente da RA, ou `null` se ainda não há nenhum. */
  latestPost: Post | null;
  lastActivityAt: Date | null;
  totalComments: number;
  totalLikes: number;
};

/**
 * Agrupa posts por Região Administrativa para os cards da visão geral.
 *
 * Função pura, sem rede: recebe o que `listAllPosts()` já trouxe. Se um dia os
 * números passarem a vir de contadores no banco, só esta função sai de cena.
 * Espera `posts` já ordenado do mais recente ao mais antigo.
 */
export function summarizeTopics(posts: Post[]): Map<TopicId, TopicSummary> {
  const summaries = new Map<TopicId, TopicSummary>();

  for (const post of posts) {
    const current = summaries.get(post.topic) ?? {
      topicId: post.topic,
      postCount: 0,
      latestPost: null,
      lastActivityAt: null,
      totalComments: 0,
      totalLikes: 0,
    };

    current.postCount += 1;
    current.totalComments += post.commentCount;
    current.totalLikes += post.likedBy.length;

    // O primeiro que aparece é o mais recente, dado o orderBy desc da query.
    if (!current.latestPost) {
      current.latestPost = post;
      current.lastActivityAt = post.createdAt;
    }

    summaries.set(post.topic, current);
  }

  return summaries;
}
