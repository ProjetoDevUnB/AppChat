import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RegionStats } from '../../data/regionStats';
import { getFlairLabel, type Post } from '../../types/forum';
import FlairChip from '../forum/FlairChip';
import InteractiveMap from './InteractiveMap.web';
import { REGION_COLORS } from './theme';

type RegionMapExplorerProps = {
  name: string;
  map: RegionStats['map'];
  posts?: Post[];
  onPressPost?: (post: Post) => void;
};

export default function RegionMapExplorer({ name, map, posts = [], onPressPost }: RegionMapExplorerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = posts.find((post) => post.id === selectedId && post.location) ?? null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <InteractiveMap name={name} map={map}
        markers={posts.flatMap((post) => post.location ? [{
          id: post.id, coordinate: post.location, label: `Conversa: ${post.title}`, selected: post.id === selectedId,
        }] : [])}
        onMarkerPress={setSelectedId} onMapPress={() => setSelectedId(null)} />
      {selected && (
        <Pressable style={styles.preview} onPress={() => onPressPost?.(selected)}
          accessibilityRole="button" accessibilityLabel={selected.title} accessibilityHint="Abre a conversa do fórum">
          <Text style={styles.title} numberOfLines={2}>{selected.title}</Text>
          <FlairChip label={getFlairLabel(selected.flair)} variant="badge" />
          <Text style={styles.body} numberOfLines={2}>{selected.body}</Text>
          <Text style={styles.link}>Ler conversa</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    position: 'absolute', left: 16, right: 16, bottom: 32, padding: 16, gap: 8,
    borderRadius: 20, backgroundColor: REGION_COLORS.surface,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12,
  },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: REGION_COLORS.title },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, color: REGION_COLORS.body },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: REGION_COLORS.accent },
});
