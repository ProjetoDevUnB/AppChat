import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// Indicador de páginas (bolinhas) usado nas telas de onboarding — o Figma
// repete esse mesmo padrão em vários frames (ex.: frames "4" e "5"), então
// vale existir como componente em vez de reescrever a cada tela nova.
// A linha é centralizada horizontalmente por padrão; posicionamento
// vertical (bottom/safe area) fica a cargo de quem usa via `style`.
type PaginationDotsProps = {
  count: number;
  activeIndex: number;
  style?: StyleProp<ViewStyle>;
  dotSize?: number;
  gap?: number;
  activeColor?: string;
  inactiveColor?: string;
};

export default function PaginationDots({
  count,
  activeIndex,
  style,
  dotSize = 12,
  gap = 2,
  activeColor = '#E86E97',
  inactiveColor = '#464646',
}: PaginationDotsProps) {
  return (
    <View style={[styles.row, { gap }, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize,
              backgroundColor: index === activeIndex ? activeColor : inactiveColor,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {},
});
