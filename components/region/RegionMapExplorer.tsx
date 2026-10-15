import { StyleSheet } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';

import { getMapRegion, type RegionStats } from '../../data/regionStats';
import { REGION_COLORS, REGION_OUTLINE } from './theme';

type RegionMapExplorerProps = {
  name: string;
  map: RegionStats['map'];
};

export default function RegionMapExplorer({ name, map }: RegionMapExplorerProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={getMapRegion(map.outline)}
      showsCompass
      showsScale
      toolbarEnabled={false}
    >
      <Polygon coordinates={map.outline} {...REGION_OUTLINE} />
      <Marker coordinate={map.center} title={name} pinColor={REGION_COLORS.accent} />
    </MapView>
  );
}
