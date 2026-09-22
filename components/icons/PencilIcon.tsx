import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Lápis do botão flutuante "nova conversa".
export default function PencilIcon({ size = 22, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.5 3.5 L20.5 7.5 L8 20 H4 V16 Z M14.5 5.5 L18.5 9.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
