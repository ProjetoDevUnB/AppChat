import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Author } from '../../services/users';
import { getShortName } from '../../services/users';
import { getFlairLabel, type Post } from '../../types/forum';
import { formatRelative } from '../../utils/relativeTime';
import Avatar from './Avatar';
import FlairChip from './FlairChip';
import StatRow from './StatRow';
import { CARD_SHADOW, FORUM_COLORS } from './theme';

// Card de um post na lista de uma RA.
type PostCardProps = {
  post: Post;
  author?: Author;
  /** uid do usuário atual, ou `null` se ninguém está logado. */
  currentUid: string | null;
  onPress: () => void;
};

export default function PostCard({ post, author, currentUid, onPress }: PostCardProps) {
  // Enquanto o autor não chega do Firestore o card já renderiza — só o nome
  // fica em branco, em vez de a lista inteira esperar.
  const name = author ? getShortName(author.name) : '';
  const liked = currentUid !== null && post.likedBy.includes(currentUid);

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={post.title}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <FlairChip label={getFlairLabel(post.flair)} variant="badge" />
      </View>

      <Text style={styles.body} numberOfLines={2}>
        {post.body}
      </Text>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.author}>
          <Avatar name={author?.name ?? '?'} photoUrl={author?.photoUrl} size={26} />
          <Text style={styles.authorText} numberOfLines={1}>
            {name ? `${name} • ` : ''}
            {formatRelative(post.createdAt)}
          </Text>
        </View>

        <StatRow
          commentCount={post.commentCount}
          likeCount={post.likedBy.length}
          liked={liked}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: FORUM_COLORS.title,
  },
  body: {
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
  author: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorText: {
    flexShrink: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: FORUM_COLORS.muted,
  },
});
