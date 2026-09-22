import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Balão de conversa usado no contador de comentários dos cards.
export default function CommentIcon({ size = 16, color = '#888888' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5.5 C4 4.67 4.67 4 5.5 4 H18.5 C19.33 4 20 4.67 20 5.5 V15 C20 15.83 19.33 16.5 18.5 16.5 H9 L5 20 V16.5 H5.5 C4.67 16.5 4 15.83 4 15 Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
