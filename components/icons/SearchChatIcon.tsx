import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Ícone "buscar" do menu inferior (balão com lupa). 
const RATIO = 27.86 / 23.74;

export default function SearchChatIcon({ size = 24, color = '#CCCCCC' }: IconProps) {
  return (
    <Svg width={size * RATIO} height={size} viewBox="0 0 27.86 23.74" fill="none">
      <Path
        d="M25.32 10.54 V7.87 C25.32 6.1 24.61 4.41 23.36 3.16 C22.1 1.91 20.4 1.2 18.62 1.2 H7.9 C6.12 1.2 4.42 1.91 3.16 3.16 C1.91 4.41 1.2 6.1 1.2 7.87 C1.2 9.64 1.91 11.33 3.16 12.58 C4.42 13.83 6.12 14.54 7.9 14.54 H13.26 M24.15 20.03 C24.52 19.66 24.82 19.22 25.03 18.73 C25.23 18.24 25.34 17.72 25.34 17.19 C25.34 16.66 25.24 16.14 25.04 15.65 C24.83 15.17 24.54 14.72 24.16 14.35 C23.79 13.98 23.34 13.68 22.85 13.48 C22.36 13.28 21.83 13.18 21.3 13.18 C20.77 13.18 20.25 13.29 19.76 13.5 C19.27 13.7 18.83 14 18.45 14.38 C17.71 15.13 17.3 16.15 17.3 17.2 C17.31 18.26 17.73 19.27 18.48 20.01 C19.23 20.76 20.25 21.18 21.31 21.18 C22.37 21.18 23.39 20.77 24.15 20.03 Z M24.15 20.03 L26.66 22.54"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
