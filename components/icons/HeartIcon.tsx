import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Coração do contador de curtidas. `filled` marca que o usuário atual curtiu.
type HeartIconProps = IconProps & { filled?: boolean };

export default function HeartIcon({
  size = 16,
  color = '#888888',
  filled = false,
}: HeartIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.5 L3.9 12.4 C2.03 10.53 2.03 7.5 3.9 5.63 C5.77 3.76 8.8 3.76 10.67 5.63 L12 6.96 L13.33 5.63 C15.2 3.76 18.23 3.76 20.1 5.63 C21.97 7.5 21.97 10.53 20.1 12.4 Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
