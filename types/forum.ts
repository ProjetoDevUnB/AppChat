// Domínios fixos do fórum. Tópicos e flairs não vêm do banco: são um
// vocabulário fechado do produto, então moram aqui e os documentos do
// Firestore guardam apenas o `id` (slug). O rótulo é apresentação e pode
// mudar sem migrar dado nenhum.

export const TOPICS = [
  { id: 'asa-norte', label: 'Asa Norte' },
  { id: 'asa-sul', label: 'Asa Sul' },
  { id: 'taguatinga', label: 'Taguatinga' },
  { id: 'ceilandia', label: 'Ceilândia' },
  { id: 'nucleo-bandeirante', label: 'Núcleo Bandeirante' },
  { id: 'guara', label: 'Guará' },
] as const;

export const FLAIRS = [
  { id: 'geral', label: 'Geral' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'mobilidade', label: 'Mobilidade' },
  { id: 'lazer', label: 'Lazer' },
  { id: 'custo-de-vida', label: 'Custo de Vida' },
] as const;

export type TopicId = (typeof TOPICS)[number]['id'];
export type FlairId = (typeof FLAIRS)[number]['id'];

export type Post = {
  id: string;
  title: string;
  body: string;
  topic: TopicId;
  flair: FlairId;
  authorId: string;
  // `null` enquanto o serverTimestamp() ainda não voltou do servidor: o SDK
  // entrega o documento localmente antes de confirmar a escrita.
  createdAt: Date | null;
  likedBy: string[];
  commentCount: number;
};

export type Comment = {
  id: string;
  postId: string;
  body: string;
  authorId: string;
  createdAt: Date | null;
};

export function getTopicLabel(id: string): string {
  return TOPICS.find((topic) => topic.id === id)?.label ?? id;
}

export function getFlairLabel(id: string): string {
  return FLAIRS.find((flair) => flair.id === id)?.label ?? id;
}

export function isTopicId(value: string): value is TopicId {
  return TOPICS.some((topic) => topic.id === value);
}

export function isFlairId(value: string): value is FlairId {
  return FLAIRS.some((flair) => flair.id === value);
}
