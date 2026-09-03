import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Ícone "perfil" do menu inferior. Extraído de assets/svg.svg.
const RATIO = 29.2 / 29.06;

export default function ProfileIcon({ size = 24, color = '#CCCCCC' }: IconProps) {
  return (
    <Svg width={size * RATIO} height={size} viewBox="0 0 29.2 29.06" fill="none">
      <Path
        d="M14.6 1.2 C7.2 1.2 1.2 7.17 1.2 14.53 C1.2 21.89 7.2 27.86 14.6 27.86 C22 27.86 28 21.89 28 14.53 C28 7.17 22 1.2 14.6 1.2 Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.24 22.99 C4.24 22.99 7.23 19.2 14.6 19.2 C21.97 19.2 24.96 22.99 24.96 22.99 M14.6 14.53 C15.67 14.53 16.69 14.11 17.44 13.36 C18.2 12.61 18.62 11.59 18.62 10.53 C18.62 9.47 18.2 8.45 17.44 7.7 C16.69 6.95 15.67 6.53 14.6 6.53 C13.53 6.53 12.51 6.95 11.76 7.7 C11 8.45 10.58 9.47 10.58 10.53 C10.58 11.59 11 12.61 11.76 13.36 C12.51 14.11 13.53 14.53 14.6 14.53 Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
