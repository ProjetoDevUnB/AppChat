import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Avião de papel do botão de enviar comentário.
export default function SendIcon({ size = 20, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 3 L10.5 13.5 M21 3 L14.5 21 L10.5 13.5 L3 9.5 Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
