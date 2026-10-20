import type { RegionStats } from '../../data/regionStats';
import type { Coordinate } from '../../types/forum';

export type LocationPickerMapProps = {
  name: string;
  map: RegionStats['map'];
  point: Coordinate | null;
  onChange: (coordinate: Coordinate) => void;
};
