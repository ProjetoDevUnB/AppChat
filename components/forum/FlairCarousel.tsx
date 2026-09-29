import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { FLAIRS, type FlairId } from '../../types/forum';
import FlairChip from './FlairChip';

// "Todas" não é um flair do banco — é o estado de "sem filtro", representado
// aqui por `null`.
export type FlairFilter = FlairId | null;

type FlairCarouselProps = {
  value: FlairFilter;
  onChange: (value: FlairFilter) => void;
  style?: StyleProp<ViewStyle>;
};

export default function FlairCarousel({ value, onChange, style }: FlairCarouselProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={styles.content}
    >
      <FlairChip label="Todas" selected={value === null} onPress={() => onChange(null)} />

      {FLAIRS.map((flair) => (
        <FlairChip
          key={flair.id}
          label={flair.label}
          selected={value === flair.id}
          onPress={() => onChange(flair.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 10,
  },
});
