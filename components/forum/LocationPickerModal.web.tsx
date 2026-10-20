import type { RegionStats } from '../../data/regionStats';
import type { Coordinate } from '../../types/forum';

type LocationPickerModalProps = {
  visible: boolean;
  regionName: string;
  map: RegionStats['map'];
  value: Coordinate | null;
  onConfirm: (location: Coordinate) => void;
  onClose: () => void;
};

// react-native-maps não roda no navegador e o embed do OpenStreetMap não
// devolve o ponto tocado, então na web não há como marcar local. A tela de
// criar post já esconde o campo; isto só mantém a mesma interface do nativo.
export default function LocationPickerModal(_props: LocationPickerModalProps) {
  return null;
}
