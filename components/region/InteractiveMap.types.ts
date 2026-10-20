import type { RegionStats } from '../../data/regionStats';
import type { Coordinate } from '../../types/forum';

export type InteractiveMapHandle = { focus: (coordinate: Coordinate) => void };

export type InteractiveMapMarker = {
  id: string;
  coordinate: Coordinate;
  label: string;
  selected?: boolean;
  draggable?: boolean;
};

export type InteractiveMapProps = {
  name: string;
  map: RegionStats['map'];
  markers: InteractiveMapMarker[];
  focusPoint?: Coordinate;
  onMapPress?: (coordinate: Coordinate) => void;
  onMarkerPress?: (id: string) => void;
  onMarkerDrag?: (coordinate: Coordinate) => void;
};
