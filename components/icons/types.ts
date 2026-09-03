// Props comuns a todos os ícones vetoriais da tela de descoberta.
// `size` é sempre a ALTURA desejada — a largura sai da proporção do viewBox
// de cada ícone, já que eles não são quadrados (foram exportados do Figma
// com as caixas justas ao desenho).
export type IconProps = {
  size?: number;
  color?: string;
};
