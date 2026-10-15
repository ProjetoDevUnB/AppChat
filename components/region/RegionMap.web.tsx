import { useState } from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { RegionStats } from '../../data/regionStats';
import MapPinLabel from './MapPinLabel';
import { mapCardStyles } from './mapCardStyles';

type RegionMapProps = {
  name: string;
  map: RegionStats['map'];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const IMAGE_ASPECT = 370 / 676;

// react-native-maps não roda no navegador; na web fica a captura do Figma,
// que é retrato e foi girada para caber no card.
export default function RegionMap({ name, map, onPress, style }: RegionMapProps) {
  const [cardWidth, setCardWidth] = useState(0);
  const imageHeight = cardWidth + 4;

  return (
    <View
      style={[mapCardStyles.card, style]}
      onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}
    >
      {cardWidth > 0 ? (
        <View style={styles.imageFrame}>
          <Image
            source={map.staticImage}
            style={[styles.image, { width: imageHeight * IMAGE_ASPECT, height: imageHeight }]}
            resizeMode="cover"
          />
        </View>
      ) : null}
      <MapPinLabel name={name} />
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
