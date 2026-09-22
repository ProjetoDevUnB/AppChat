import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { FORUM_COLORS } from './theme';

// Duas aparências para o mesmo conceito:
// - `filter`: pílula do carrossel de filtros e da seleção ao publicar.
// - `badge`: etiqueta cinza em caixa alta no canto do card.
type FlairChipProps = {
  label: string;
  variant?: 'filter' | 'badge';
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function FlairChip({
  label,
  variant = 'filter',
  selected = false,
  onPress,
  style,
}: FlairChipProps) {
  if (variant === 'badge') {
    return (
      <View style={[styles.badge, style]}>
        <Text style={styles.badgeText} numberOfLines={1}>
          {label.toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.filter, selected && styles.filterSelected, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filter: {
    height: 38,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: FORUM_COLORS.border,
    backgroundColor: FORUM_COLORS.surface,
  },
  filterSelected: {
    borderColor: FORUM_COLORS.accent,
    backgroundColor: FORUM_COLORS.accent,
  },
  filterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 18,
    color: FORUM_COLORS.body,
  },
  filterTextSelected: {
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: FORUM_COLORS.border,
  },
  badgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    color: FORUM_COLORS.body,
  },
});
