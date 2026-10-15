import {
  eightPointStarXml,
  ellipsesAXml,
  ellipsesBXml,
  ellipsesWideXml,
  fourPointStarTallXml,
  fourPointStarXml,
  halfEllipseLargeXml,
  halfEllipseSmallXml,
  hexagonXml,
  polygonAXml,
  polygonBXml,
  polygonCXml,
} from '../components/icons/regionCardShapesXml';

// Coordenadas em pontos, relativas a um card de 170.5 × 93 (medida do Figma).
// Formas giradas usam uma moldura sem rotação centrada no mesmo ponto do
// Figma; a rotação acontece em torno do centro dela.
export type CardShape = {
  left: number;
  top: number;
  width?: number;
  height?: number;
  rotate?: number;
  xml?: string;
  xmlOffset?: { left: number; top: number };
};

export type RegionCardData = {
  name: string;
  tone: 'pink' | 'olive';
  shapes: CardShape[];
};

const svg = (xml: string, left: number, top: number): CardShape => ({ xml, left, top });

const hexagon = (left: number, top: number): CardShape => ({
  left: left + 15.315,
  top: top + 15.315,
  width: 78,
  height: 78,
  rotate: -34.99,
  xml: hexagonXml,
  xmlOffset: { left: 5.226, top: 0.616 },
});

const tiltedSquare = (left: number, top: number): CardShape => ({
  left: left + 14.57,
  top: top + 14.23,
  width: 75,
  height: 76,
  rotate: -32.64,
});

const halfEllipses = (left: number, top: number): CardShape[] => [
  {
    left: left + 15.383,
    top: top + 15.383,
    width: 87,
    height: 87,
    rotate: -28.17,
    xml: halfEllipseLargeXml,
    xmlOffset: { left: 0, top: 43.5 },
  },
  {
    left: left + 3.726,
    top: top + 1.054,
    width: 72.317,
    height: 36.159,
    rotate: -141.18,
    xml: halfEllipseSmallXml,
    xmlOffset: { left: 0, top: 0 },
  },
];

export const REGION_CARDS: RegionCardData[] = [
  { name: 'Arniqueira', tone: 'pink', shapes: [hexagon(94, 12.22)] },
  { name: 'Asa Norte', tone: 'olive', shapes: [svg(fourPointStarTallXml, 98.4, -8)] },
  { name: 'Asa Sul', tone: 'olive', shapes: [tiltedSquare(99.43, -19.01)] },
  { name: 'Águas Claras', tone: 'pink', shapes: [svg(ellipsesAXml, 81.5, -6.78)] },
  { name: 'Brazlândia', tone: 'pink', shapes: [svg(eightPointStarXml, 93, -43.78)] },
  { name: 'Candangolândia', tone: 'olive', shapes: [svg(polygonAXml, 107.5, -4.78)] },
  { name: 'Ceilândia', tone: 'olive', shapes: [svg(fourPointStarTallXml, 97.9, -8)] },
  { name: 'Cruzeiro', tone: 'pink', shapes: [tiltedSquare(98.5, -22.78)] },
  { name: 'Fercal', tone: 'pink', shapes: halfEllipses(85, -4.16) },
  { name: 'Gama', tone: 'olive', shapes: [svg(eightPointStarXml, 93.5, -43.78)] },
  { name: 'Guará', tone: 'olive', shapes: [svg(polygonBXml, 107.5, -4.78)] },
  { name: 'Itapoã', tone: 'pink', shapes: [svg(fourPointStarTallXml, 98.4, -8)] },
  { name: 'Jardim Botânico', tone: 'pink', shapes: [tiltedSquare(98, -22.78)] },
  { name: 'Lago Norte', tone: 'olive', shapes: halfEllipses(85.5, -4.16) },
  { name: 'Lago Sul', tone: 'olive', shapes: [svg(eightPointStarXml, 93, -43.78)] },
  { name: 'Núcleo Bandeirante', tone: 'pink', shapes: [hexagon(94.5, 12.22)] },
  { name: 'Octogonal', tone: 'pink', shapes: [svg(fourPointStarTallXml, 97.9, -8)] },
  { name: 'Paranoá', tone: 'olive', shapes: [tiltedSquare(106.93, -22.01)] },
  { name: 'Park Way', tone: 'olive', shapes: [svg(ellipsesBXml, 82.39, -31.78)] },
  { name: 'Planaltina', tone: 'pink', shapes: [svg(eightPointStarXml, 93.5, -43.78)] },
  { name: 'Recanto das Emas', tone: 'pink', shapes: [hexagon(92, 17.22)] },
  { name: 'Riacho Fundo', tone: 'olive', shapes: [svg(fourPointStarXml, 96.4, 12.07)] },
  { name: 'Riacho Fundo II', tone: 'olive', shapes: [tiltedSquare(102.43, -23.01)] },
  {
    name: 'Samambaia',
    tone: 'pink',
    shapes: [svg(ellipsesWideXml, 114.5, -15.1), ...halfEllipses(85, -4.38)],
  },
  { name: 'Santa Maria', tone: 'pink', shapes: [svg(eightPointStarXml, 93, -43.78)] },
  { name: 'São Sebastião', tone: 'olive', shapes: [svg(polygonCXml, 103, -31.78)] },
  { name: 'SCIA/Estrutural', tone: 'olive', shapes: [svg(fourPointStarXml, 95.9, 12.07)] },
  { name: 'SIA', tone: 'pink', shapes: [tiltedSquare(98.5, -22.78)] },
  { name: 'Sobradinho', tone: 'pink', shapes: halfEllipses(85, -4.16) },
  { name: 'Sobradinho II', tone: 'olive', shapes: [svg(eightPointStarXml, 95.5, -41.78)] },
  { name: 'Sol Nascente/Pôr do Sol', tone: 'olive', shapes: [hexagon(91, 16.22)] },
  { name: 'Sudoeste', tone: 'pink', shapes: [svg(fourPointStarXml, 95.4, 14.07)] },
  { name: 'Taguatinga', tone: 'pink', shapes: [tiltedSquare(95, -23.78)] },
  { name: 'Varjão', tone: 'olive', shapes: halfEllipses(85.5, -4.16) },
  { name: 'Vicente Pires', tone: 'olive', shapes: [svg(eightPointStarXml, 95, -41.78)] },
];
