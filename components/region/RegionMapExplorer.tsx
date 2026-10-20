import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';

import { getMapRegion, type RegionStats } from '../../data/regionStats';
import { auth } from '../../firebase';
import { getFlairLabel, type Post } from '../../types/forum';
import FlairChip from '../forum/FlairChip';
import StatRow from '../forum/StatRow';
import PostMarker from './PostMarker';
import { REGION_COLORS, REGION_OUTLINE } from './theme';

type RegionMapExplorerProps = {
  name: string;
  map: RegionStats['map'];
  posts?: Post[];
  onPressPost?: (post: Post) => void;
};

export default function RegionMapExplorer({
  name,
  map,
  posts = [],
  onPressPost,
}: RegionMapExplorerProps) {
  // Tocar num balão mostra um resumo do post; só o toque no resumo abre a
  // conversa, para o usuário poder passear entre os balões sem sair do mapa.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = posts.find((post) => post.id === selectedId) ?? null;
  const currentUid = auth.currentUser?.uid ?? null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={getMapRegion(map.outline)}
        showsCompass
        showsScale
        toolbarEnabled={false}
        onPress={(event) => {
          // No Android o toque num Marker também chega aqui; só fecha o resumo
          // quando o toque foi no mapa em si.
          if (event.nativeEvent.action !== 'marker-press') setSelectedId(null);
        }}
      >
        <Polygon coordinates={map.outline} {...REGION_OUTLINE} />
        <Marker coordinate={map.center} title={name} pinColor={REGION_COLORS.accent} />
        {posts.map((post) => (
          <PostMarker
            key={post.id}
            post={post}
            selected={post.id === selectedId}
            onPress={() => setSelectedId(post.id)}
          />
        ))}
      </MapView>

      {selected ? (
        <Pressable
          style={({ pressed }) => [styles.preview, pressed && styles.previewPressed]}
          onPress={() => onPressPost?.(selected)}
          accessibilityRole="button"
          accessibilityLabel={selected.title}
          accessibilityHint="Abre a conversa do fórum"
        >
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle} numberOfLines={2}>
              {selected.title}
            </Text>
            <FlairChip label={getFlairLabel(selected.flair)} variant="badge" />
          </View>
          <Text style={styles.previewBody} numberOfLines={2}>
            {selected.body}
          </Text>
          <View style={styles.previewFooter}>
            <StatRow
              commentCount={selected.commentCount}
              likeCount={selected.likedBy.length}
              liked={currentUid !== null && selected.likedBy.includes(currentUid)}
            />
            <Text style={styles.previewLink}>Ler conversa</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    gap: 8,
    padding: 16,
    borderRadius: 20,
    backgroundColor: REGION_COLORS.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  previewPressed: {
    opacity: 0.9,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  previewTitle: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: REGION_COLORS.title,
  },
  previewBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: REGION_COLORS.body,
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: REGION_COLORS.accent,
  },
});
