import type * as Leaflet from 'leaflet';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

import type { InteractiveMapHandle, InteractiveMapProps } from './InteractiveMap.types';
import { REGION_COLORS, REGION_OUTLINE } from './theme';

// O Leaflet só é carregado depois da montagem: depende do DOM do navegador.
const InteractiveMap = forwardRef<InteractiveMapHandle, InteractiveMapProps>(function InteractiveMap(props, ref) {
  const container = useRef<HTMLDivElement>(null);
  const callbacks = useRef(props);
  callbacks.current = props;
  const [ready, setReady] = useState<{ map: Leaflet.Map; leaflet: typeof Leaflet } | null>(null);
  const [error, setError] = useState(false);

  useImperativeHandle(ref, () => ({
    focus(coordinate) {
      ready?.map.setView([coordinate.latitude, coordinate.longitude], 17);
    },
  }), [ready]);

  useEffect(() => {
    let disposed = false;
    let map: Leaflet.Map | undefined;
    let observer: ResizeObserver | undefined;
    import('leaflet').then((leaflet) => {
      if (disposed || !container.current) return;
      map = leaflet.map(container.current);
      leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      leaflet.control.scale({ imperial: false }).addTo(map);
      map.on('click', (event: Leaflet.LeafletMouseEvent) => {
        callbacks.current.onMapPress?.({ latitude: event.latlng.lat, longitude: event.latlng.lng });
      });
      // Modais e mudanças de tamanho nem sempre disparam resize da janela.
      observer = new ResizeObserver(() => map?.invalidateSize());
      observer.observe(container.current);
      setReady({ map, leaflet });
    }).catch(() => { if (!disposed) setError(true); });

    return () => {
      disposed = true;
      observer?.disconnect();
      map?.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const outline = ready.leaflet.polygon(props.map.outline.map((point) => [point.latitude, point.longitude]), {
      color: REGION_OUTLINE.strokeColor,
      weight: REGION_OUTLINE.strokeWidth,
      dashArray: '4 3',
      fillColor: '#FFFFFF',
      fillOpacity: 0.15,
      interactive: false,
    }).addTo(ready.map);
    ready.map.fitBounds(outline.getBounds(), { padding: [24, 24] });
    return () => { outline.remove(); };
  }, [ready, props.map]);

  useEffect(() => {
    if (ready && props.focusPoint) {
      ready.map.setView([props.focusPoint.latitude, props.focusPoint.longitude], 17);
    }
  }, [ready, props.focusPoint]);

  useEffect(() => {
    if (!ready) return;
    const layer = ready.leaflet.layerGroup().addTo(ready.map);
    for (const item of props.markers) {
      const icon = document.createElement('div');
      if (item.draggable) {
        icon.textContent = '●';
      } else {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M4 5.5 C4 4.67 4.67 4 5.5 4 H18.5 C19.33 4 20 4.67 20 5.5 V15 C20 15.83 19.33 16.5 18.5 16.5 H9 L5 20 V16.5 H5.5 C4.67 16.5 4 15.83 4 15 Z');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '1.8');
        path.setAttribute('stroke-linejoin', 'round');
        svg.append(path);
        icon.append(svg);
      }
      Object.assign(icon.style, {
        width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center',
        border: `2px solid ${item.selected ? REGION_COLORS.accent : '#FFFFFF'}`,
        background: item.selected ? '#FFFFFF' : REGION_COLORS.accent,
        color: item.selected ? REGION_COLORS.accent : '#FFFFFF', fontSize: '18px',
      });
      const marker = ready.leaflet.marker([item.coordinate.latitude, item.coordinate.longitude], {
        title: item.label,
        alt: item.label,
        draggable: item.draggable,
        bubblingMouseEvents: false,
        icon: ready.leaflet.divIcon({ html: icon, className: '', iconSize: [32, 32], iconAnchor: [16, 16] }),
      }).addTo(layer);
      marker.on('click', () => callbacks.current.onMarkerPress?.(item.id));
      marker.on('dragend', () => {
        const point = marker.getLatLng();
        callbacks.current.onMarkerDrag?.({ latitude: point.lat, longitude: point.lng });
      });
    }
    return () => { layer.remove(); };
  }, [ready, props.markers]);

  return (
    <div style={{ position: 'absolute', inset: 0, isolation: 'isolate' }}>
      <div ref={container} aria-label={`Mapa de ${props.name}`} style={{ width: '100%', height: '100%' }} />
      {error && (
        <p role="alert" style={{ position: 'absolute', top: 16, left: 16, right: 16, background: '#FFFFFF' }}>
          Não foi possível carregar o mapa. Feche e tente novamente.
        </p>
      )}
    </div>
  );
});

export default InteractiveMap;
