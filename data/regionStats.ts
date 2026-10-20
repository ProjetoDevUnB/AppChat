import type { ImageSourcePropType } from 'react-native';

import { getTopicLabel, TOPICS, type Coordinate, type TopicId } from '../types/forum';

export type { Coordinate };

export type MobilityMode = {
  key: 'metro' | 'bus' | 'bike';
  label: string;
  available: boolean;
};

export type PercentStat = { label: string; percent: number };

export type ValueStat = { label: string; value: number };

export type RegionStats = {
  name: string;
  // Só as regiões com tópico próprio no fórum mostram os destaques.
  forumTopic?: TopicId;
  map: {
    center: Coordinate;
    outline: Coordinate[];
    // Captura do Figma usada no card da web; sem ela, a web cai no OpenStreetMap.
    staticImage?: ImageSourcePropType;
  };
  mobility: { summary: string; modes: MobilityMode[]; source: string };
  amenities: { title: string; items: string[]; source: string };
  leisure: { items: PercentStat[]; source: string };
  income: { summary: string; regions: ValueStat[]; source: string };
  safety: { summary: string; source: string; note?: string; crimes: ValueStat[] };
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

// Renda domiciliar média mensal (R$) de todas as RAs, da maior para a menor.
// Fica num lugar só para que o gráfico de renda seja o mesmo em toda região,
// mudando apenas a barra em destaque.
const INCOME_RANKING: ValueStat[] = [
  { label: 'Lago Sul', value: 12650 },
  { label: 'Sudoeste', value: 11850 },
  { label: 'Octogonal', value: 11400 },
  { label: 'Asa Norte', value: 11012.6 },
  { label: 'Asa Sul', value: 10640 },
  { label: 'Lago Norte', value: 10120 },
  { label: 'Park Way', value: 9480 },
  { label: 'Jardim Botânico', value: 8860 },
  { label: 'Cruzeiro', value: 8230 },
  { label: 'Águas Claras', value: 7600 },
  { label: 'Guará', value: 6960 },
  { label: 'Arniqueira', value: 6600 },
  { label: 'Vicente Pires', value: 6330 },
  { label: 'SIA', value: 6100 },
  { label: 'Sobradinho', value: 5700 },
  { label: 'Taguatinga', value: 5070 },
  { label: 'Sobradinho II', value: 4800 },
  { label: 'Núcleo Bandeirante', value: 4430 },
  { label: 'Riacho Fundo', value: 4200 },
  { label: 'Candangolândia', value: 4050 },
  { label: 'Gama', value: 3800 },
  { label: 'Ceilândia', value: 3170 },
  { label: 'São Sebastião', value: 3050 },
  { label: 'Planaltina', value: 2900 },
  { label: 'Riacho Fundo II', value: 2850 },
  { label: 'Santa Maria', value: 2750 },
  { label: 'Paranoá', value: 2700 },
  { label: 'Recanto das Emas', value: 2650 },
  { label: 'Brazlândia', value: 2600 },
  { label: 'Samambaia', value: 2530 },
  { label: 'Itapoã', value: 2200 },
  { label: 'Varjão', value: 2100 },
  { label: 'Fercal', value: 1950 },
  { label: 'Sol Nascente/Pôr do Sol', value: 1750 },
  { label: 'SCIA/Estrutural', value: 1650 },
];

const ASA_NORTE_STATS: RegionStats = {
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
    regions: INCOME_RANKING,
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

// As demais regiões são mock gerado a partir de uma linha por RA. O contorno
// é um octógono aproximado em volta do centro, não o limite oficial da RA.
type RegionSeed = {
  name: string;
  center: [latitude: number, longitude: number];
  radiusKm: number;
  metro: boolean;
  bike: boolean;
  // 0–1: quão bem servida de infraestrutura urbana a região é, comparada à
  // Asa Norte (1). Define os equipamentos e as porcentagens de lazer.
  infra: number;
  // Na ordem de CRIME_LABELS.
  crimes: number[];
  safetyNote?: string;
};

const PLANO_PILOTO_NOTE = 'Atenção: Dados contemplam Asa Sul e Asa Norte (Plano Piloto)';
const SUDOESTE_OCTOGONAL_NOTE = 'Atenção: Dados contemplam Sudoeste e Octogonal';
const PLANO_PILOTO_CRIMES = ASA_NORTE_STATS.safety.crimes.map((crime) => crime.value);
const SUDOESTE_OCTOGONAL_CRIMES = [1, 8, 55, 1, 6, 30, 45];

const REGION_SEEDS: RegionSeed[] = [
  { name: 'Arniqueira', center: [-15.857, -48.012], radiusKm: 2, metro: true, bike: true, infra: 0.55, crimes: [4, 12, 40, 2, 6, 35, 28] },
  { name: 'Asa Sul', center: [-15.817, -47.901], radiusKm: 2.8, metro: true, bike: true, infra: 1, crimes: PLANO_PILOTO_CRIMES, safetyNote: PLANO_PILOTO_NOTE },
  { name: 'Águas Claras', center: [-15.839, -48.027], radiusKm: 2, metro: true, bike: true, infra: 0.88, crimes: [3, 25, 120, 3, 15, 90, 110] },
  { name: 'Brazlândia', center: [-15.68, -48.2], radiusKm: 6, metro: false, bike: false, infra: 0.6, crimes: [10, 8, 25, 3, 8, 45, 30] },
  { name: 'Candangolândia', center: [-15.851, -47.95], radiusKm: 1, metro: false, bike: true, infra: 0.75, crimes: [2, 4, 12, 1, 3, 15, 10] },
  { name: 'Ceilândia', center: [-15.819, -48.11], radiusKm: 4, metro: true, bike: true, infra: 0.7, crimes: [70, 140, 180, 45, 60, 200, 160] },
  { name: 'Cruzeiro', center: [-15.793, -47.938], radiusKm: 1.2, metro: false, bike: true, infra: 0.9, crimes: [1, 6, 35, 1, 4, 25, 30] },
  { name: 'Fercal', center: [-15.6, -47.87], radiusKm: 5, metro: false, bike: false, infra: 0.35, crimes: [3, 2, 5, 1, 2, 8, 5] },
  { name: 'Gama', center: [-16.017, -48.065], radiusKm: 4, metro: false, bike: true, infra: 0.78, crimes: [25, 40, 70, 12, 25, 110, 80] },
  { name: 'Guará', center: [-15.824, -47.979], radiusKm: 2.5, metro: true, bike: true, infra: 0.88, crimes: [6, 30, 110, 6, 18, 95, 105] },
  { name: 'Itapoã', center: [-15.747, -47.77], radiusKm: 1.8, metro: false, bike: false, infra: 0.45, crimes: [15, 18, 20, 8, 12, 60, 30] },
  { name: 'Jardim Botânico', center: [-15.87, -47.8], radiusKm: 5, metro: false, bike: true, infra: 0.72, crimes: [2, 8, 30, 1, 4, 15, 20] },
  { name: 'Lago Norte', center: [-15.735, -47.855], radiusKm: 3.5, metro: false, bike: true, infra: 0.88, crimes: [2, 10, 45, 1, 5, 20, 35] },
  { name: 'Lago Sul', center: [-15.845, -47.865], radiusKm: 5, metro: false, bike: true, infra: 0.9, crimes: [2, 15, 60, 1, 6, 25, 40] },
  { name: 'Núcleo Bandeirante', center: [-15.87, -47.965], radiusKm: 1.5, metro: false, bike: true, infra: 0.78, crimes: [3, 10, 40, 3, 10, 40, 45] },
  { name: 'Octogonal', center: [-15.798, -47.948], radiusKm: 0.8, metro: false, bike: true, infra: 0.95, crimes: SUDOESTE_OCTOGONAL_CRIMES, safetyNote: SUDOESTE_OCTOGONAL_NOTE },
  { name: 'Paranoá', center: [-15.775, -47.779], radiusKm: 2, metro: false, bike: true, infra: 0.62, crimes: [12, 15, 25, 6, 10, 55, 35] },
  { name: 'Park Way', center: [-15.895, -47.96], radiusKm: 4, metro: false, bike: true, infra: 0.7, crimes: [3, 12, 25, 1, 3, 10, 12] },
  { name: 'Planaltina', center: [-15.62, -47.65], radiusKm: 6, metro: false, bike: true, infra: 0.6, crimes: [35, 40, 55, 15, 30, 120, 70] },
  { name: 'Recanto das Emas', center: [-15.91, -48.065], radiusKm: 2.5, metro: false, bike: true, infra: 0.62, crimes: [30, 45, 50, 18, 25, 130, 60] },
  { name: 'Riacho Fundo', center: [-15.883, -48.017], radiusKm: 1.5, metro: false, bike: true, infra: 0.7, crimes: [5, 12, 25, 4, 8, 40, 30] },
  { name: 'Riacho Fundo II', center: [-15.905, -48.048], radiusKm: 1.8, metro: false, bike: true, infra: 0.6, crimes: [8, 14, 20, 6, 8, 45, 25] },
  { name: 'Samambaia', center: [-15.876, -48.088], radiusKm: 3.5, metro: true, bike: true, infra: 0.72, crimes: [40, 80, 90, 25, 40, 170, 100] },
  { name: 'Santa Maria', center: [-16.018, -48.005], radiusKm: 3, metro: false, bike: true, infra: 0.65, crimes: [30, 35, 45, 14, 22, 110, 55] },
  { name: 'São Sebastião', center: [-15.903, -47.77], radiusKm: 3, metro: false, bike: true, infra: 0.58, crimes: [18, 20, 35, 8, 15, 75, 45] },
  { name: 'SCIA/Estrutural', center: [-15.783, -47.997], radiusKm: 1.5, metro: false, bike: false, infra: 0.35, crimes: [12, 8, 10, 4, 6, 35, 15] },
  { name: 'SIA', center: [-15.801, -47.953], radiusKm: 2, metro: false, bike: true, infra: 0.7, crimes: [2, 15, 50, 2, 12, 20, 30] },
  { name: 'Sobradinho', center: [-15.653, -47.79], radiusKm: 3, metro: false, bike: true, infra: 0.8, crimes: [10, 20, 45, 6, 15, 70, 60] },
  { name: 'Sobradinho II', center: [-15.64, -47.825], radiusKm: 2.5, metro: false, bike: true, infra: 0.6, crimes: [8, 14, 25, 5, 8, 45, 30] },
  { name: 'Sol Nascente/Pôr do Sol', center: [-15.81, -48.145], radiusKm: 2.5, metro: false, bike: false, infra: 0.35, crimes: [35, 30, 25, 15, 15, 90, 40] },
  { name: 'Sudoeste', center: [-15.793, -47.926], radiusKm: 1.2, metro: false, bike: true, infra: 0.97, crimes: SUDOESTE_OCTOGONAL_CRIMES, safetyNote: SUDOESTE_OCTOGONAL_NOTE },
  { name: 'Taguatinga', center: [-15.833, -48.056], radiusKm: 3.5, metro: true, bike: true, infra: 0.85, crimes: [25, 70, 160, 20, 50, 190, 180] },
  { name: 'Varjão', center: [-15.71, -47.877], radiusKm: 0.8, metro: false, bike: false, infra: 0.5, crimes: [3, 2, 5, 1, 2, 10, 6] },
  { name: 'Vicente Pires', center: [-15.804, -48.03], radiusKm: 2.5, metro: false, bike: true, infra: 0.55, crimes: [8, 30, 60, 3, 12, 50, 45] },
];

const CRIME_LABELS = ASA_NORTE_STATS.safety.crimes.map((crime) => crime.label);

const sumOf = (values: number[]) => values.reduce((total, value) => total + value, 0);

const DF_AVERAGE_CRIMES =
  sumOf([PLANO_PILOTO_CRIMES, ...REGION_SEEDS.map((seed) => seed.crimes)].map(sumOf)) /
  (REGION_SEEDS.length + 1);

const KM_PER_LATITUDE_DEGREE = 111.32;

function octagonAround([latitude, longitude]: RegionSeed['center'], radiusKm: number) {
  const latRadius = radiusKm / KM_PER_LATITUDE_DEGREE;
  const lngRadius = latRadius / Math.cos((latitude * Math.PI) / 180);
  return Array.from({ length: 8 }, (_, i) => ({
    latitude: latitude + latRadius * Math.sin((Math.PI / 4) * i),
    longitude: longitude + lngRadius * Math.cos((Math.PI / 4) * i),
  }));
}

// Variação estável (sempre a mesma para a mesma região) de -4 a +4 pontos,
// para que as barras de lazer não sejam só a Asa Norte em escala.
function jitter(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return (Math.abs(hash) % 9) - 4;
}

function formatCurrency(value: number) {
  const [integer, cents] = value.toFixed(2).split('.');
  return `R$ ${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${cents}`;
}

function incomeTier(value: number) {
  if (value >= 8000) return 'alta';
  if (value >= 5000) return 'média-alta';
  if (value >= 3000) return 'média';
  return 'baixa';
}

function mobilitySummary({ metro, bike }: RegionSeed) {
  if (metro) return 'Conta com estações de metrô e muitas linhas de ônibus.';
  if (bike) return 'Muitas linhas de ônibus, mas carece de metrô.';
  return 'Depende quase só do ônibus: sem metrô e sem ciclovia.';
}

function amenityItems(infra: number) {
  const all = ASA_NORTE_STATS.amenities.items;
  if (infra >= 0.85) return all;
  if (infra >= 0.6) return all.filter((item) => item !== 'Ruas arborizadas');
  return ['Rua asfaltada', 'Rua iluminada'];
}

function buildRegionStats(seed: RegionSeed): RegionStats {
  const [latitude, longitude] = seed.center;
  const income = INCOME_RANKING.find((region) => region.label === seed.name)?.value ?? 0;
  const aboveAverage = sumOf(seed.crimes) > DF_AVERAGE_CRIMES;

  return {
    name: seed.name,
    forumTopic: TOPICS.find((topic) => topic.label === seed.name)?.id,
    map: {
      center: { latitude, longitude },
      outline: octagonAround(seed.center, seed.radiusKm),
    },
    mobility: {
      summary: mobilitySummary(seed),
      modes: [
        { key: 'metro', label: 'Metrô', available: seed.metro },
        { key: 'bus', label: 'Ônibus', available: true },
        { key: 'bike', label: 'Ciclovia', available: seed.bike },
      ],
      source: ASA_NORTE_STATS.mobility.source,
    },
    amenities: { ...ASA_NORTE_STATS.amenities, items: amenityItems(seed.infra) },
    leisure: {
      items: ASA_NORTE_STATS.leisure.items.map(({ label, percent }) => ({
        label,
        percent: Math.min(99, Math.max(3, Math.round(percent * seed.infra) + jitter(seed.name + label))),
      })),
      source: ASA_NORTE_STATS.leisure.source,
    },
    income: {
      summary: `Comparado às demais RAs do DF, ${seed.name} está na faixa de renda ${incomeTier(income)}. A renda domiciliar média mensal gira em torno de ${formatCurrency(income)}.`,
      regions: INCOME_RANKING,
      source: ASA_NORTE_STATS.income.source,
    },
    safety: {
      summary: `Total de ocorrências é ${aboveAverage ? 'acima' : 'abaixo'} da média do DF`,
      source: ASA_NORTE_STATS.safety.source,
      note: seed.safetyNote,
      crimes: CRIME_LABELS.map((label, i) => ({ label, value: seed.crimes[i] })),
    },
  };
}

export const REGION_STATS: RegionStats[] = [ASA_NORTE_STATS, ...REGION_SEEDS.map(buildRegionStats)];

export function getRegionStats(name: string) {
  return REGION_STATS.find((region) => region.name === name);
}

// O tópico do fórum e a região são ligados pelo rótulo (veja `forumTopic` em
// buildRegionStats), então o caminho inverso passa por ele também.
export function getRegionStatsByTopic(topic: TopicId) {
  return getRegionStats(getTopicLabel(topic));
}

/** Ray casting: o ponto está dentro do contorno (polígono fechado implícito)? */
export function isInsideOutline(point: Coordinate, outline: Coordinate[]) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i];
    const b = outline[j];
    const crosses =
      a.latitude > point.latitude !== b.latitude > point.latitude &&
      point.longitude <
        ((b.longitude - a.longitude) * (point.latitude - a.latitude)) / (b.latitude - a.latitude) +
          a.longitude;
    if (crosses) inside = !inside;
  }
  return inside;
}
