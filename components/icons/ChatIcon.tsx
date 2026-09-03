import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Ícone "conversas" do menu inferior (dois balões).
const RATIO = 29.44 / 29.17;

export default function ChatIcon({ size = 24, color = '#CCCCCC' }: IconProps) {
  return (
    <Svg width={size * RATIO} height={size} viewBox="0 0 29.44 29.17" fill="none">
      <Path
        d="M13.21 26.45 C11.92 27.44 10.34 27.97 8.72 27.97 C7.43 27.97 6.16 27.63 5.03 26.99 L1.72 27.6 L2.34 24.3 C1.52 22.91 1.2 21.28 1.41 19.68 C1.62 18.08 2.36 16.59 3.51 15.45 C4.65 14.31 6.15 13.58 7.76 13.37 C9.36 13.16 11 13.48 12.4 14.29 C13.81 15.09 14.91 16.34 15.53 17.83 C16.15 19.32 16.26 20.97 15.84 22.53 C15.42 24.09 14.49 25.47 13.21 26.45 Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.15 22.5 C20.43 22.29 21.66 21.86 22.79 21.21 L27.61 22.1 L26.72 17.3 C27.5 15.94 27.98 14.43 28.11 12.86 C28.24 11.3 28.02 9.72 27.47 8.25 C26.92 6.78 26.05 5.45 24.92 4.35 C23.79 3.25 22.43 2.41 20.94 1.9 C19.45 1.38 17.86 1.2 16.29 1.37 C14.72 1.54 13.21 2.04 11.86 2.86 C10.51 3.68 9.36 4.78 8.49 6.09 C7.62 7.4 7.05 8.88 6.82 10.44"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
