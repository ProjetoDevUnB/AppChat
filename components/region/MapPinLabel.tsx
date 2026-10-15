import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { mapPinXml } from '../icons/regionIconsXml';
import { REGION_COLORS } from './theme';

export default function MapPinLabel({ name }: { name: string }) {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.pin}>
        <SvgXml xml={mapPinXml} />
      </View>
      <View style={styles.label}>
        <Text style={styles.labelText}>{name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: REGION_COLORS.accent,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  labelText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: REGION_COLORS.title,
  },
});
