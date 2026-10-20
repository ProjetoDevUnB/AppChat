import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import type { Post } from '../../types/forum';
import CommentIcon from '../icons/CommentIcon';
import { REGION_COLORS } from './theme';

type PostMarkerProps = {
  post: Post;
  selected?: boolean;
  onPress?: () => void;
};

// Balão de comentário que marca no mapa um post do fórum. Só faz sentido para
// posts com `location`; os demais nem chegam aqui.
export default function PostMarker({ post, selected = false, onPress }: PostMarkerProps) {
  // Marker com view própria é rasterizado pelo mapa. Com `tracksViewChanges`
  // desligado desde o início, o SVG costuma sair em branco no Android; ligado
  // para sempre, o mapa redesenha o marcador a cada frame. Fica ligado só até
  // o primeiro desenho e a cada troca de seleção.
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timeout = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timeout);
  }, [selected]);

  if (!post.location) {
    return null;
  }

  return (
    <Marker
      coordinate={post.location}
      onPress={onPress}
      tappable={!!onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
      accessibilityLabel={`Conversa: ${post.title}`}
    >
      <View style={[styles.bubble, selected && styles.bubbleSelected]}>
        <CommentIcon size={16} color={selected ? REGION_COLORS.accent : '#FFFFFF'} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: REGION_COLORS.accent,
  },
  bubbleSelected: {
    borderColor: REGION_COLORS.accent,
    backgroundColor: '#FFFFFF',
  },
});
