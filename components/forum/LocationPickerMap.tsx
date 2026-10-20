import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';

import { getMapRegion } from '../../data/regionStats';
import type { InteractiveMapHandle } from '../region/InteractiveMap.types';
import { REGION_OUTLINE } from '../region/theme';
import type { LocationPickerMapProps } from './LocationPickerMap.types';
import { FORUM_COLORS } from './theme';

export default forwardRef<InteractiveMapHandle, LocationPickerMapProps>(function LocationPickerMap({ map, point, onChange }, ref) {
  const mapRef = useRef<MapView>(null);
  useImperativeHandle(ref, () => ({
    focus(coordinate) {
      mapRef.current?.animateToRegion({ ...coordinate, latitudeDelta: 0.004, longitudeDelta: 0.004 });
    },
  }), []);

  return (
    <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={getMapRegion(map.outline)}
      toolbarEnabled={false} showsPointsOfInterest={false}
      onPress={(event) => onChange(event.nativeEvent.coordinate)}>
      <Polygon coordinates={map.outline} {...REGION_OUTLINE} />
      {point && <Marker coordinate={point} draggable pinColor={FORUM_COLORS.accentDark}
        onDragEnd={(event) => onChange(event.nativeEvent.coordinate)} />}
    </MapView>
  );
});
