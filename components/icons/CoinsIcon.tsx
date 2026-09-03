import Svg, { Ellipse, Path } from 'react-native-svg';

import type { IconProps } from './types';

// Ícone da categoria "Custo de vida" (pilha de moedas).
//
// PLACEHOLDER: este é o único ícone da tela que não veio nos assets —
// assets/coins.svg é uma cópia byte-a-byte de assets/lazer.svg (a bicicleta),
// e o card "Custo de vida" está fora do recorte do export assets/svg.svg.
// O desenho abaixo foi feito à mão respeitando as medidas que o Figma
// registrou em assets/css.css (caixa 48x48, moeda menor deslocada no topo
// esquerdo, pilha ocupando x 6..42 / y 11..42) e o mesmo traço branco 3.5.
// Quando o SVG real for exportado, basta trocar o conteúdo deste arquivo.
const RATIO = 1;

export default function CoinsIcon({ size = 52, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size * RATIO} height={size} viewBox="0 0 48 48" fill="none">
      {/* moeda menor, deslocada para o topo esquerdo */}
      <Ellipse
        cx={15.95}
        cy={11}
        rx={9.95}
        ry={5}
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* topo da pilha */}
      <Ellipse
        cx={24}
        cy={18}
        rx={18}
        ry={7}
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* paredes laterais, sulco do meio e base da pilha */}
      <Path
        d="M6 18 V35 M42 18 V35 M6 26.5 A18 7 0 0 0 42 26.5 M6 35 A18 7 0 0 0 42 35"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
