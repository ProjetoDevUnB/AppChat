import { StyleSheet, Text, View } from 'react-native';

import CommentIcon from '../icons/CommentIcon';
import { REGION_COLORS } from './theme';

// Selo no canto do card do mapa avisando que há conversas marcadas — o card é
// estático, então é ele que convida a abrir o mapa em tela cheia.
export default function MappedPostsBadge({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }

  return (
    <View style={styles.badge} pointerEvents="none">
      <CommentIcon size={14} color="#FFFFFF" />
      <Text style={styles.text}>
        {count} {count === 1 ? 'conversa' : 'conversas'} no mapa
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: REGION_COLORS.accent,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});
