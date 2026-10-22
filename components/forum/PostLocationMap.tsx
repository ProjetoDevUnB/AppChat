import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { PostLocationMapProps } from './PostLocationMap.types';
import { FORUM_COLORS } from './theme';

export default function PostLocationMap({ location, name }: PostLocationMapProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...location, latitudeDelta: 0.004, longitudeDelta: 0.004 }}
      toolbarEnabled={false}
      showsPointsOfInterest={false}
      accessibilityLabel={`Local da conversa em ${name}`}
    >
      <Marker coordinate={location} title="Local da conversa" pinColor={FORUM_COLORS.accentDark} />
    </MapView>
  );
}
