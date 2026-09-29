import { StyleSheet, Text, View } from 'react-native';

import CommentIcon from '../icons/CommentIcon';
import HeartIcon from '../icons/HeartIcon';
import { FORUM_COLORS } from './theme';

// O par "💬 n  ❤️ n" no rodapé dos cards do fórum. `liked` pinta o coração de
// vinho quando o usuário atual já curtiu.
type StatRowProps = {
  commentCount: number;
  likeCount: number;
  liked?: boolean;
};

export default function StatRow({ commentCount, likeCount, liked = false }: StatRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.stat}>
        <CommentIcon size={16} color={FORUM_COLORS.body} />
        <Text style={styles.count}>{commentCount}</Text>
      </View>

      <View style={styles.stat}>
        <HeartIcon
          size={16}
          color={liked ? FORUM_COLORS.accentDark : FORUM_COLORS.body}
          filled={liked}
        />
        <Text style={[styles.count, liked && styles.countLiked]}>{likeCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  count: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: FORUM_COLORS.body,
  },
  countLiked: {
    fontFamily: 'Inter_500Medium',
    color: FORUM_COLORS.accentDark,
  },
});
