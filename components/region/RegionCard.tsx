import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { CardShape, RegionCardData } from '../../data/regionCards';

export const REGION_CARD_HEIGHT = 93;
const DESIGN_WIDTH = 170.5;

const TONES = {
  pink: { background: '#E86E97', shape: '#832D51' },
  olive: { background: '#7F8D18', shape: '#596422' },
} as const;

type RegionCardProps = {
  region: RegionCardData;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function RegionCard({ region, onPress, style }: RegionCardProps) {
  const tone = TONES[region.tone];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: tone.background },
        pressed && styles.cardPressed,
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={region.name}
      accessibilityState={{ disabled: !onPress }}
    >
      <View style={styles.shapes} pointerEvents="none">
        {region.shapes.map((shape, index) => (
          <Shape key={index} shape={shape} color={tone.shape} />
        ))}
      </View>
      <Text style={styles.name}>{region.name}</Text>
    </Pressable>
  );
}

function Shape({ shape, color }: { shape: CardShape; color: string }) {
  const { left, top, width, height, rotate, xml, xmlOffset } = shape;

  return (
    <View
      style={[
        styles.shape,
        { left, top, width, height },
        rotate !== undefined && { transform: [{ rotate: `${rotate}deg` }] },
        !xml && { backgroundColor: color, borderRadius: 5 },
      ]}
    >
      {xml ? (
        <SvgXml
          xml={xml}
          color={color}
          style={xmlOffset && { position: 'absolute', left: xmlOffset.left, top: xmlOffset.top }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: REGION_CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
  },
  cardPressed: {
    opacity: 0.85,
  },
  shapes: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: DESIGN_WIDTH,
    height: REGION_CARD_HEIGHT,
  },
  shape: {
    position: 'absolute',
  },
  name: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 20,
    color: '#EEEEEE',
  },
});
