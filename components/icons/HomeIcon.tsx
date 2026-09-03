import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Ícone "início" do menu inferior. Extraído de assets/svg.svg.
const RATIO = 26.4 / 25.5;

export default function HomeIcon({ size = 24, color = '#CCCCCC' }: IconProps) {
  return (
    <Svg width={size * RATIO} height={size} viewBox="0 0 26.4 25.5" fill="none">
      <Path
        d="M9.2 24.3 H6.53 C5.12 24.3 3.76 23.74 2.76 22.74 C1.76 21.74 1.2 20.38 1.2 18.96 V10.58 C1.2 9.66 1.44 8.76 1.89 7.96 C2.34 7.16 2.98 6.49 3.77 6.01 L10.44 1.97 C11.27 1.47 12.23 1.2 13.2 1.2 C14.17 1.2 15.13 1.47 15.96 1.97 L22.63 6.01 C23.41 6.49 24.06 7.16 24.51 7.96 C24.96 8.76 25.2 9.66 25.2 10.57 V18.96 C25.2 20.38 24.64 21.74 23.64 22.74 C22.64 23.74 21.28 24.3 19.87 24.3 H17.2 M9.2 24.3 V18.96 C9.2 17.9 9.62 16.89 10.37 16.14 C11.12 15.39 12.14 14.96 13.2 14.96 C14.26 14.96 15.28 15.39 16.03 16.14 C16.78 16.89 17.2 17.9 17.2 18.96 V24.3 M9.2 24.3 H17.2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
