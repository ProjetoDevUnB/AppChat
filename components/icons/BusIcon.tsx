import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Ícone da categoria "Transporte" (ônibus).
const RATIO = 42.63 / 55.03;

export default function BusIcon({ size = 52, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size * RATIO} height={size} viewBox="0 0 42.63 55.03" fill="none">
      <Path
        d="M40.63 26.89 H2 V44.31 C2 44.97 2.23 45.61 2.63 46.07 C3.03 46.54 3.58 46.8 4.15 46.8 H38.49 C39.06 46.8 39.6 46.54 40.01 46.07 C40.41 45.61 40.63 44.97 40.63 44.31 V26.89 Z"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.59 36.87 L10.61 36.84 M32.05 36.87 L32.07 36.84 M40.63 16.93 V11.96 C40.63 9.32 39.73 6.78 38.12 4.92 C36.51 3.05 34.33 2 32.05 2 H10.59 C8.31 2 6.12 3.05 4.52 4.92 C2.91 6.78 2 9.32 2 11.96 V16.93 M10.59 16.93 H32.05 M2 26.89 H40.63 V44.31 C40.63 44.97 40.41 45.61 40.01 46.07 C39.6 46.54 39.06 46.8 38.49 46.8 H4.15 C3.58 46.8 3.03 46.54 2.63 46.07 C2.23 45.61 2 44.97 2 44.31 V26.89 Z"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.22 46.8 V51.53 C5.22 51.93 5.36 52.31 5.6 52.59 C5.84 52.87 6.17 53.03 6.51 53.03 H12.52 C12.69 53.03 12.85 52.99 13.01 52.91 C13.17 52.84 13.31 52.73 13.43 52.59 C13.55 52.45 13.64 52.29 13.71 52.1 C13.77 51.92 13.81 51.73 13.81 51.53 V46.8 M28.83 46.8 V51.53 C28.83 51.93 28.97 52.31 29.21 52.59 C29.45 52.87 29.78 53.03 30.12 53.03 H36.13 C36.3 53.03 36.46 52.99 36.62 52.91 C36.78 52.84 36.92 52.73 37.04 52.59 C37.16 52.45 37.25 52.29 37.32 52.1 C37.38 51.92 37.41 51.73 37.41 51.53 V46.8"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
