import { getMapRegion, type RegionStats } from '../../data/regionStats';
import type { Post } from '../../types/forum';

type RegionMapExplorerProps = {
  name: string;
  map: RegionStats['map'];
  posts?: Post[];
  onPressPost?: (post: Post) => void;
};

// react-native-maps não roda no navegador; na web o mapa explorável é o
// embed do OpenStreetMap, que não desenha o contorno da região nem aceita os
// balões dos posts — `posts` e `onPressPost` ficam sem efeito aqui.
export default function RegionMapExplorer({ name, map }: RegionMapExplorerProps) {
  const region = getMapRegion(map.outline);
  const bbox = [
    region.longitude - region.longitudeDelta / 2,
    region.latitude - region.latitudeDelta / 2,
    region.longitude + region.longitudeDelta / 2,
    region.latitude + region.latitudeDelta / 2,
  ].join(',');
  const marker = `${map.center.latitude},${map.center.longitude}`;

  return (
    <iframe
      title={`Mapa de ${name}`}
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`}
      style={{ border: 0, width: '100%', height: '100%' }}
    />
  );
}
