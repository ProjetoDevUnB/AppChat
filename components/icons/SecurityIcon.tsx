import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Ícone da categoria "Segurança" (guarda), extraído de assets/security.svg.
// O viewBox foi reajustado para a caixa real dos traços (o export original
// declarava 49x60 com folga sobrando embaixo).
const RATIO = 48.5 / 53.5;

export default function SecurityIcon({ size = 52, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size * RATIO} height={size} viewBox="0 0 48.5 53.5" fill="none">
      <Path
        d="M37.75 16.75 C33.99 15.18 29.31 14.25 24.25 14.25 C19.19 14.25 14.51 15.18 10.75 16.75"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Path
        d="M12.93 16.75 L11.29 13.22 C9.99 10.42 9.34 9.02 9.75 7.78 C10.16 6.54 11.42 6.1 13.94 5.21 L22.88 2.07 C23.49 1.86 23.79 1.75 24.11 1.75 C24.42 1.75 24.72 1.86 25.33 2.07 L34.87 5.42 C37.14 6.22 38.28 6.62 38.71 7.74 C39.15 8.86 38.68 10.2 37.75 12.87 L36.4 16.75 M13 16.75 V21.06 C13 25.55 15.07 29.7 18.46 32.01 L19.62 32.8 C21.01 33.75 22.62 34.25 24.25 34.25 C25.88 34.25 27.49 33.75 28.88 32.8 L30.04 32.01 C31.72 30.85 33.1 29.24 34.05 27.33 C35.01 25.41 35.51 23.25 35.5 21.06 V16.75"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Path
        d="M31 31.75 L33.25 39.25 M33.25 39.25 L30.17 42.24 C27.35 44.98 25.94 46.34 24.25 46.34 C22.56 46.34 21.15 44.98 18.33 42.24 L15.25 39.25 M33.25 39.25 L37.15 40.7 C39.4 41.53 40.52 41.95 41.52 42.59 C42.49 43.21 43.38 44 44.14 44.92 C44.92 45.87 46.75 49.25 46.75 51.75 M15.25 39.25 L17.5 31.75 M15.25 39.25 L11.35 40.7 C9.1 41.53 7.98 41.95 6.98 42.59 C6.01 43.21 5.12 44 4.36 44.92 C3.58 45.87 1.75 49.25 1.75 51.75"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
