import { getMapRegion, isInsideOutline } from '../data/regionStats';
import type { Coordinate } from '../types/forum';

// Busca de lugares pelo Nominatim, o geocodificador do OpenStreetMap. Não pede
// chave nem faturamento (a Places API do Google pede os dois) e acha comércio
// pelo nome, não só endereço. A política de uso do servidor público proíbe
// autocomplete — uma busca por envio, no máximo 1 por segundo — e exige um
// User-Agent que identifique o app.
// https://operations.osmfoundation.org/policies/nominatim/
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Mapeei/1.0 (projeto acadêmico UnB)';

const SEARCH_TIMEOUT_MS = 10000;
const RESULT_LIMIT = 8;

export type Place = {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
};

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
};

/**
 * Lugares que batem com `text` dentro do contorno da RA.
 *
 * O Nominatim só sabe recortar por retângulo (`viewbox` + `bounded`), então os
 * resultados ainda passam por `isInsideOutline`: um ponto no canto do
 * retângulo, mas fora da RA, seria recusado pelo seletor de qualquer forma.
 */
export async function searchPlaces(text: string, outline: Coordinate[]): Promise<Place[]> {
  const region = getMapRegion(outline);
  const viewbox = [
    region.longitude - region.longitudeDelta / 2,
    region.latitude + region.latitudeDelta / 2,
    region.longitude + region.longitudeDelta / 2,
    region.latitude - region.latitudeDelta / 2,
  ].join(',');

  const params = new URLSearchParams({
    q: text.trim(),
    format: 'jsonv2',
    viewbox,
    bounded: '1',
    countrycodes: 'br',
    'accept-language': 'pt-BR',
    limit: String(RESULT_LIMIT),
  });

  // AbortController em vez de withTimeout: além de desistir, cancela o fetch.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Nominatim respondeu ${response.status}`);
    }

    const results: NominatimResult[] = await response.json();

    return results
      .map((result) => {
        // `display_name` começa pelo próprio nome; o resto vira o endereço.
        const [first, ...rest] = result.display_name.split(', ');
        return {
          id: String(result.place_id),
          name: result.name || first,
          address: rest.join(', '),
          coordinate: { latitude: Number(result.lat), longitude: Number(result.lon) },
        };
      })
      .filter((place) => isInsideOutline(place.coordinate, outline));
  } finally {
    clearTimeout(timer);
  }
}
