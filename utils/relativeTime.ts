// Formatação de "quanto tempo faz" nos moldes dos cards do fórum:
// 12min, 2h, ontem, 2 dias, domingo, 14/03.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const WEEKDAYS = [
  'domingo',
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
];

/** Uma atividade é considerada "agora" enquanto estiver dentro dessa janela. */
export const ACTIVE_NOW_MS = HOUR;

export function formatRelative(date: Date | null, now: Date = new Date()): string {
  if (!date) {
    return 'agora';
  }

  const elapsed = now.getTime() - date.getTime();

  // Relógio do aparelho atrasado em relação ao servidor produz elapsed
  // negativo; tratar como "agora" em vez de exibir um tempo no futuro.
  if (elapsed < MINUTE) {
    return 'agora';
  }

  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)}min`;
  }

  if (elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)}h`;
  }

  const days = Math.floor(elapsed / DAY);

  if (days === 1) {
    return 'ontem';
  }

  if (days < 7) {
    return `${days} dias`;
  }

  // Até duas semanas o dia da semana ainda situa melhor que uma data.
  if (days < 14) {
    return WEEKDAYS[date.getDay()];
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** `true` enquanto a conversa ainda conta como "Ativa agora" (ponto verde). */
export function isActiveNow(date: Date | null, now: Date = new Date()): boolean {
  if (!date) {
    return true;
  }
  return now.getTime() - date.getTime() < ACTIVE_NOW_MS;
}
