import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { IconProps } from './icons/types';

// Card de categoria do carrossel horizontal da tela de descoberta

export const CATEGORY_CARD_WIDTH = 132;
export const CATEGORY_CARD_HEIGHT = 112;

type CategoryCardProps = {
  label: string;
  Icon: (props: IconProps) => React.JSX.Element;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function CategoryCard({ label, Icon, onPress, style }: CategoryCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconSlot}>
        <Icon size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CATEGORY_CARD_WIDTH,
    height: CATEGORY_CARD_HEIGHT,
    borderRadius: 32,
    backgroundColor: '#832D51',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    // Figma: dy 4, blur (stdDeviation) 2 -> shadowRadius 4, #2E2E2E a 34%.
    shadowColor: '#2E2E2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.34,
    shadowRadius: 4,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.28,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
