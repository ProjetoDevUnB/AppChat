import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Seta de voltar dos cabeçalhos do fórum.
export default function BackIcon({ size = 20, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12 H5 M11 5 L4 12 L11 19"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
