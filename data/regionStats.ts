import type { ImageSourcePropType } from 'react-native';

import type { TopicId } from '../types/forum';

export type Coordinate = { latitude: number; longitude: number };

export type MobilityMode = {
  key: 'metro' | 'bus' | 'bike';
  label: string;
  available: boolean;
};

export type PercentStat = { label: string; percent: number };

export type ValueStat = { label: string; value: number };

export type RegionStats = {
  name: string;
  forumTopic: TopicId;
  map: {
    center: Coordinate;
    outline: Coordinate[];
    staticImage: ImageSourcePropType;
  };
  mobility: { summary: string; modes: MobilityMode[]; source: string };
  amenities: { title: string; items: string[]; source: string };
  leisure: { items: PercentStat[]; source: string };
  income: { summary: string; regions: ValueStat[]; source: string };
  safety: { summary: string; source: string; note: string; crimes: ValueStat[] };
};

export function getMapRegion(outline: Coordinate[], padding = 1.3) {
  const latitudes = outline.map((point) => point.latitude);
  const longitudes = outline.map((point) => point.longitude);
  const [minLat, maxLat] = [Math.min(...latitudes), Math.max(...latitudes)];
  const [minLng, maxLng] = [Math.min(...longitudes), Math.max(...longitudes)];

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: (maxLat - minLat) * padding,
    longitudeDelta: (maxLng - minLng) * padding,
  };
}

export const ASA_NORTE_STATS: RegionStats = {
  name: 'Asa Norte',
  forumTopic: 'asa-norte',
  map: {
    center: { latitude: -15.7645, longitude: -47.8865 },
    outline: [
      { latitude: -15.7905, longitude: -47.8925 },
      { latitude: -15.7885, longitude: -47.8792 },
      { latitude: -15.7652, longitude: -47.8748 },
      { latitude: -15.7418, longitude: -47.8712 },
      { latitude: -15.7352, longitude: -47.8768 },
      { latitude: -15.7372, longitude: -47.8935 },
      { latitude: -15.7488, longitude: -47.9002 },
      { latitude: -15.7705, longitude: -47.9018 },
    ],
    staticImage: require('../assets/region_map_asa_norte.png'),
  },
  mobility: {
    summary: 'Muitas linhas de ônibus, mas carece de metrô.',
    modes: [
      { key: 'metro', label: 'Metrô', available: false },
      { key: 'bus', label: 'Ônibus', available: true },
      { key: 'bike', label: 'Ciclovia', available: true },
    ],
    source: 'STPC/DF 2026',
  },
  amenities: {
    title: 'Moradores afirmaram ter na rua ou nas proximidades',
    items: ['Rua asfaltada', 'Rua iluminada', 'Rua com calçada', 'Ruas arborizadas', 'Drenagem de chuva'],
    source: 'PDAD 2021',
  },
  leisure: {
    items: [
      { label: 'Ruas arborizadas', percent: 99 },
      { label: 'Travessia sinalizada', percent: 99 },
      { label: 'Ponto de ônibus', percent: 99 },
      { label: 'Praça', percent: 97 },
      { label: 'Ciclovia/Ciclofaixa', percent: 97 },
      { label: 'Quadras esportivas', percent: 94 },
      { label: 'Academia/PEC', percent: 94 },
      { label: 'Jardins/Parques', percent: 93 },
      { label: 'Espaço cultural', percent: 82 },
    ],
    source: 'PDAD 2021',
  },
  income: {
    summary:
      'Comparado às demais RAs do DF, a Asa Norte está na faixa de renda alta. A renda domiciliar média mensal gira em torno de R$ 11.012,60 (a maior parte dos domicílios concentra mais de 6 a 7 salários mínimos).',
    regions: [
      { label: 'Lago Sul', value: 12650 },
      { label: 'Sudoeste/Octogonal', value: 11850 },
      { label: 'Asa Norte', value: 11012.6 },
      { label: 'Asa Sul', value: 10640 },
      { label: 'Lago Norte', value: 10120 },
      { label: 'Park Way', value: 9480 },
      { label: 'Jardim Botânico', value: 8860 },
      { label: 'Cruzeiro', value: 8230 },
      { label: 'Águas Claras', value: 7600 },
      { label: 'Guará', value: 6960 },
      { label: 'Vicente Pires', value: 6330 },
      { label: 'Sobradinho', value: 5700 },
      { label: 'Taguatinga', value: 5070 },
      { label: 'Núcleo Bandeirante', value: 4430 },
      { label: 'Gama', value: 3800 },
      { label: 'Ceilândia', value: 3170 },
      { label: 'Samambaia', value: 2530 },
    ],
    source: 'PDAD 2024',
  },
  safety: {
    summary: 'Total de ocorrências é acima da média do DF',
    source: 'SSP-DF 2025, atualizados em 2026 · dados por tipo de crime',
    note: 'Atenção: Dados contemplam Asa Sul e Asa Norte (Plano Piloto)',
    crimes: [
      { label: 'Homicídio', value: 16 },
      { label: 'Roubo de veículo', value: 32 },
      { label: 'Furto de veículos', value: 182 },
      { label: 'Roubo em coletivo', value: 7 },
      { label: 'Roubo em comércio', value: 22 },
      { label: 'Roubo de pedestre', value: 178 },
      { label: 'Furto em pedestres', value: 191 },
    ],
  },
};
