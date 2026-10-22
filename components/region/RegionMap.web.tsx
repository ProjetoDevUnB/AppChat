import { useState } from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { getMapRegion, type RegionStats } from '../../data/regionStats';
import type { Post } from '../../types/forum';
import MappedPostsBadge from './MappedPostsBadge';
import MapPinLabel from './MapPinLabel';
import { mapCardStyles } from './mapCardStyles';

type RegionMapProps = {
  name: string;
  map: RegionStats['map'];
  // Posts marcados no mapa da RA. Aqui são só sinalização: o card não é
  // interativo, então tocar num balão abre o mapa em tela cheia como o resto.
  posts?: Post[];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const IMAGE_ASPECT = 370 / 676;

// Embed estático do OpenStreetMap para regiões sem captura do Figma. O
// Pressable por cima do card recebe os toques, então o mapa não se mexe.
function embedUrl(map: RegionStats['map']) {
  const region = getMapRegion(map.outline);
  const bbox = [
    region.longitude - region.longitudeDelta / 2,
    region.latitude - region.latitudeDelta / 2,
    region.longitude + region.longitudeDelta / 2,
    region.latitude + region.latitudeDelta / 2,
  ].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
}

// react-native-maps não roda no navegador; na web fica a captura do Figma,
// que é retrato e foi girada para caber no card.
export default function RegionMap({ name, map, posts = [], onPress, style }: RegionMapProps) {
  const [cardWidth, setCardWidth] = useState(0);
  const imageHeight = cardWidth + 4;
  const { staticImage } = map;

  return (
    <View
      style={[mapCardStyles.card, style]}
      onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}
    >
      {!staticImage ? (
        <iframe
          title={`Mapa de ${name}`}
          src={embedUrl(map)}
          tabIndex={-1}
          style={{ border: 0, width: '100%', height: '100%' }}
        />
      ) : cardWidth > 0 ? (
        <View style={styles.imageFrame}>
          <Image
            source={staticImage}
            style={[styles.image, { width: imageHeight * IMAGE_ASPECT, height: imageHeight }]}
            resizeMode="cover"
          />
        </View>
      ) : null}
      <MapPinLabel name={name} />
      <MappedPostsBadge count={posts.length} />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`Mapa de ${name}`}
        accessibilityHint="Abre o mapa em tela cheia para explorar a região"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageFrame: {
    ...StyleSheet.absoluteFillObject,
    top: -25,
    bottom: -45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    transform: [{ rotate: '-90.49deg' }],
  },
});
