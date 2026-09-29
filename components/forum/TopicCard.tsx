import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TopicSummary } from '../../services/forum';
import { getTopicLabel, type TopicId } from '../../types/forum';
import { formatRelative, isActiveNow } from '../../utils/relativeTime';
import StatRow from './StatRow';
import { CARD_SHADOW, FORUM_COLORS } from './theme';

// Card de uma Região Administrativa na visão geral: nome da RA, quantas
// conversas existem, uma prévia da mais recente e quando ela se mexeu.
type TopicCardProps = {
  topicId: TopicId;
  summary?: TopicSummary;
  onPress: () => void;
};

export default function TopicCard({ topicId, summary, onPress }: TopicCardProps) {
  const label = getTopicLabel(topicId);
  const postCount = summary?.postCount ?? 0;
  const latest = summary?.latestPost ?? null;
  const active = postCount > 0 && isActiveNow(summary?.lastActivityAt ?? null);

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${postCount} ${postCount === 1 ? 'conversa' : 'conversas'}`}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{label}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {postCount} {postCount === 1 ? 'conversa' : 'conversas'}
          </Text>
        </View>
      </View>

      <Text style={styles.preview} numberOfLines={2}>
        {latest ? latest.body : 'Nenhuma conversa por aqui ainda. Seja o primeiro a publicar.'}
      </Text>

      <View style={styles.divider} />

      <View style={styles.footer}>
        {postCount > 0 ? (
          <View style={styles.activity}>
            <View style={[styles.dot, active && styles.dotActive]} />
            <Text style={styles.activityText}>
              {active
                ? `Ativa agora · ${formatRelative(summary?.lastActivityAt ?? null)}`
                : `Última atividade: ${formatRelative(summary?.lastActivityAt ?? null)}`}
            </Text>
          </View>
        ) : (
          <View style={styles.activity}>
            <View style={styles.dot} />
            <Text style={styles.activityText}>Sem atividade</Text>
          </View>
        )}

        <StatRow
          commentCount={summary?.totalComments ?? 0}
          likeCount={summary?.totalLikes ?? 0}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FORUM_COLORS.border,
    backgroundColor: FORUM_COLORS.surface,
    ...CARD_SHADOW,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flexShrink: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: FORUM_COLORS.title,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: FORUM_COLORS.accentSoft,
  },
  badgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    lineHeight: 13,
    color: FORUM_COLORS.accentDark,
  },
  preview: {
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: FORUM_COLORS.body,
  },
  divider: {
    marginTop: 14,
    height: 1,
    backgroundColor: FORUM_COLORS.border,
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activity: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FORUM_COLORS.borderStrong,
  },
  dotActive: {
    backgroundColor: FORUM_COLORS.olive,
  },
  activityText: {
    flexShrink: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 14,
    color: FORUM_COLORS.muted,
  },
});
