import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';

import type { RegionStats } from '../../data/regionStats';
import MapPinLabel from './MapPinLabel';
import { mapCardStyles } from './mapCardStyles';
import { REGION_OUTLINE } from './theme';

type RegionMapProps = {
  name: string;
  map: RegionStats['map'];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function RegionMap({ name, map, onPress, style }: RegionMapProps) {
  return (
    <View style={[mapCardStyles.card, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialCamera={{ center: map.center, heading: 90, pitch: 0, zoom: 13, altitude: 9000 }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsPointsOfInterest={false}
      >
        <Polygon coordinates={map.outline} {...REGION_OUTLINE} />
      </MapView>
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
