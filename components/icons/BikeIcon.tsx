import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

// Ícone da categoria "Lazer" (bicicleta), de assets/lazer.svg. O export
// original vinha com viewBox="0 0 25 56", que cortava metade do desenho —
// os traços na verdade ocupam ~54x55, então o viewBox foi refeito.
const RATIO = 54.5 / 55.5;

export default function BikeIcon({ size = 52, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size * RATIO} height={size} viewBox="0 0 54.5 55.5" fill="none">
      <Path
        d="M25.83 45.08 L30.08 33.53 L16.25 27.75 L24.75 17.64 L33.25 24.86 H43.17 M32.92 13.31 C34.42 13.31 35.86 12.7 36.92 11.61 C37.99 10.53 38.58 9.06 38.58 7.53 C38.58 6 37.99 4.53 36.92 3.44 C35.86 2.36 34.42 1.75 32.92 1.75 C31.41 1.75 29.97 2.36 28.91 3.44 C27.85 4.53 27.25 6 27.25 7.53 C27.25 9.06 27.85 10.53 28.91 11.61 C29.97 12.7 31.41 13.31 32.92 13.31 Z M44.25 53.75 C46.5 53.75 48.67 52.84 50.26 51.21 C51.85 49.59 52.75 47.38 52.75 45.08 C52.75 42.78 51.85 40.58 50.26 38.96 C48.67 37.33 46.5 36.42 44.25 36.42 C42 36.42 39.83 37.33 38.24 38.96 C36.65 40.58 35.75 42.78 35.75 45.08 C35.75 47.38 36.65 49.59 38.24 51.21 C39.83 52.84 42 53.75 44.25 53.75 Z M10.25 53.75 C12.5 53.75 14.67 52.84 16.26 51.21 C17.85 49.59 18.75 47.38 18.75 45.08 C18.75 42.78 17.85 40.58 16.26 38.96 C14.67 37.33 12.5 36.42 10.25 36.42 C8 36.42 5.83 37.33 4.24 38.96 C2.65 40.58 1.75 42.78 1.75 45.08 C1.75 47.38 2.65 49.59 4.24 51.21 C5.83 52.84 8 53.75 10.25 53.75 Z"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
