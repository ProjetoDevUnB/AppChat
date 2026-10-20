import InteractiveMap from '../region/InteractiveMap.web';
import type { PostLocationMapProps } from './PostLocationMap.types';

export default function PostLocationMap({ location, map, name }: PostLocationMapProps) {
  return (
    <InteractiveMap
      name={name}
      map={map}
      focusPoint={location}
      markers={[{ id: 'post-location', coordinate: location, label: 'Local da conversa' }]}
    />
  );
}
