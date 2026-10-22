import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getRegionStatsByTopic } from '../../data/regionStats';
import type { Post } from '../../types/forum';
import PostLocationMap from './PostLocationMap';
import { FORUM_COLORS } from './theme';

export default function PostLocationSection({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const region = getRegionStatsByTopic(post.topic);

  if (!post.location || !region) return null;

  return (
    <View style={styles.section}>
      <Pressable
        style={styles.toggle}
        onPress={() => setExpanded((previous) => !previous)}
        accessibilityRole="button"
        accessibilityLabel="Localização da conversa"
        accessibilityHint={expanded ? 'Oculta o mapa' : 'Mostra o local marcado no mapa'}
        accessibilityState={{ expanded }}
      >
        <View style={styles.label}>
          <Text style={styles.title}>Localização</Text>
          <Text style={styles.hint}>{expanded ? 'Ocultar mapa' : 'Ver no mapa'}</Text>
        </View>
        <Text style={styles.indicator} accessibilityElementsHidden importantForAccessibility="no">
          {expanded ? '−' : '+'}
        </Text>
      </Pressable>
      {expanded && (
        <View style={styles.map}>
          <PostLocationMap location={post.location} map={region.map} name={region.name} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: FORUM_COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  toggle: {
    minHeight: 60,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: { flex: 1, gap: 4 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: FORUM_COLORS.title },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12, color: FORUM_COLORS.body },
  indicator: { fontSize: 24, color: FORUM_COLORS.accentDark },
  map: { height: 260, borderTopWidth: 1, borderTopColor: FORUM_COLORS.border },
});
