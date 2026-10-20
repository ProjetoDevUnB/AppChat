import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isInsideOutline, type RegionStats } from '../../data/regionStats';
import { searchPlaces, type Place } from '../../services/placeSearch';
import type { Coordinate } from '../../types/forum';
import PillButton from '../PillButton';
import LocationPickerMap from './LocationPickerMap';
import type { InteractiveMapHandle } from '../region/InteractiveMap.types';
import ForumHeader from './ForumHeader';
import SearchField from './SearchField';
import { FORUM_COLORS } from './theme';

type LocationPickerModalProps = {
  visible: boolean;
  regionName: string;
  map: RegionStats['map'];
  /** Ponto já escolhido antes, para "Alterar" reabrir com o pin no lugar. */
  value: Coordinate | null;
  onConfirm: (location: Coordinate) => void;
  onClose: () => void;
};

// Mapa da RA em tela cheia para marcar onde o post acontece. Um toque posiciona
// o pin (que também pode ser arrastado), ou a busca leva o pin até um lugar
// pelo nome; só pontos dentro do contorno valem, senão o post apareceria no
// mapa de uma região e falaria de outra.
export default function LocationPickerModal({
  visible,
  regionName,
  map,
  value,
  onConfirm,
  onClose,
}: LocationPickerModalProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<InteractiveMapHandle>(null);
  const [point, setPoint] = useState<Coordinate | null>(value);

  const [searchText, setSearchText] = useState('');
  // `null` = nenhuma busca feita (ou resultados fechados); `[]` = nada achado.
  const [results, setResults] = useState<Place[] | null>(null);
  const [isSearching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Cada abertura começa do valor confirmado, descartando um rascunho cancelado.
  useEffect(() => {
    if (visible) {
      setPoint(value);
      setSearchText('');
      setResults(null);
      setSearchError('');
    }
  }, [visible, value]);

  const handleSearch = async () => {
    if (!searchText.trim() || isSearching) return;

    setSearching(true);
    setSearchError('');
    try {
      setResults(await searchPlaces(searchText, map.outline));
    } catch (error: any) {
      console.warn('[forum] falha na busca de lugares:', error?.name ?? error, error?.message ?? '');
      setResults(null);
      setSearchError('Não foi possível buscar agora. Tente de novo ou toque no mapa.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPlace = (place: Place) => {
    Keyboard.dismiss();
    setPoint(place.coordinate);
    setResults(null);
    mapRef.current?.focus(place.coordinate);
  };

  const isInside = point !== null && isInsideOutline(point, map.outline);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <ForumHeader label="Marcar no mapa" onBack={onClose} />
          <Text style={styles.hint}>
            Busque um lugar ou toque no mapa para marcar um ponto em {regionName}.
          </Text>
          <View style={styles.searchRow}>
            <SearchField
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              placeholder="Buscar comércio, endereço..."
              style={styles.search}
            />
            {isSearching ? <ActivityIndicator color={FORUM_COLORS.accentDark} /> : null}
          </View>
          {searchError ? <Text style={styles.error}>{searchError}</Text> : null}
        </View>

        <View style={styles.map}>
          <LocationPickerMap
            ref={mapRef}
            name={regionName}
            map={map}
            point={point}
            onChange={setPoint}
          />

          {results ? (
            <View style={styles.results}>
              {results.length === 0 ? (
                <Text style={styles.empty}>Nada encontrado em {regionName}.</Text>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled">
                  {results.map((place) => (
                    <Pressable
                      key={place.id}
                      style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}
                      onPress={() => handleSelectPlace(place)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.resultName} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <Text style={styles.resultAddress} numberOfLines={1}>
                        {place.address}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              <Pressable onPress={() => setResults(null)} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.closeResults}>Fechar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {point && !isInside ? (
            <Text style={styles.error}>Escolha um ponto dentro de {regionName}.</Text>
          ) : null}
          <PillButton
            label="Confirmar local"
            onPress={() => point && isInside && onConfirm(point)}
            disabled={!isInside}
            style={[styles.confirm, !isInside && styles.confirmDisabled]}
            textStyle={styles.confirmText}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FORUM_COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  hint: {
    marginTop: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: FORUM_COLORS.body,
  },
  searchRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  search: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  results: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    maxHeight: 280,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: FORUM_COLORS.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  result: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultPressed: {
    backgroundColor: FORUM_COLORS.accentSoft,
  },
  resultName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: FORUM_COLORS.title,
  },
  resultAddress: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: FORUM_COLORS.body,
  },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: FORUM_COLORS.body,
  },
  closeResults: {
    paddingHorizontal: 16,
    paddingTop: 8,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: FORUM_COLORS.accentDark,
    textAlign: 'right',
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: FORUM_COLORS.danger,
    textAlign: 'center',
  },
  confirm: {
    height: 52,
    backgroundColor: FORUM_COLORS.accentDark,
  },
  confirmDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
