import Svg, { Circle, Path } from 'react-native-svg';

import type { IconProps } from './types';

// Lupa dos campos de busca do fórum.
export default function SearchIcon({ size = 20, color = '#888888' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
      <Path d="M16.2 16.2 L21 21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
