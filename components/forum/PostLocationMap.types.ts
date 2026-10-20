import type { RegionStats } from '../../data/regionStats';
import type { Coordinate } from '../../types/forum';

export type PostLocationMapProps = {
  location: Coordinate;
  map: RegionStats['map'];
  name: string;
};
