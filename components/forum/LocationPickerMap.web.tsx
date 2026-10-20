import { forwardRef } from 'react';

import InteractiveMap from '../region/InteractiveMap.web';
import type { InteractiveMapHandle } from '../region/InteractiveMap.types';
import type { LocationPickerMapProps } from './LocationPickerMap.types';

export default forwardRef<InteractiveMapHandle, LocationPickerMapProps>(function LocationPickerMap({ name, map, point, onChange }, ref) {
  return (
    <InteractiveMap ref={ref} name={name} map={map}
      markers={point ? [{ id: 'location', coordinate: point, label: 'Local da conversa', draggable: true }] : []}
      onMapPress={onChange} onMarkerDrag={onChange} />
  );
});
