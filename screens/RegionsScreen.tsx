import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import BottomNavBar, { NAV_BAR_HEIGHT } from '../components/BottomNavBar';
import { normalizeForSearch } from '../components/forum/feedback';
import { filterXml, regionSearchXml } from '../components/icons/regionIconsXml';
import RegionCard from '../components/region/RegionCard';
import { REGION_CARDS } from '../data/regionCards';
import type { RootStackScreenProps } from '../types/navigation';

const REGIONS_TAB_INDEX = 1;
const SCREEN_PADDING = 20;
const GRID_GAP = 12;

export default function RegionsScreen({ navigation }: RootStackScreenProps<'Regions'>) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  const regions = useMemo(() => {
    const query = normalizeForSearch(search.trim());
    if (!query) return REGION_CARDS;
    return REGION_CARDS.filter((region) => normalizeForSearch(region.name).includes(query));
  }, [search]);

  if (!fontsLoaded) {
    return null;
  }

  const cardWidth = (screenWidth - SCREEN_PADDING * 2 - GRID_GAP) / 2;

  return (
    <View style={styles.container}>
      <FlatList
        data={regions}
        keyExtractor={(region) => region.name}
        numColumns={2}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: NAV_BAR_HEIGHT + insets.bottom + 48,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.title}>Pesquisar</Text>
                <Text style={styles.subtitle}>regiões administrativas do DF</Text>
              </View>
              <Pressable
                style={styles.filterButton}
                disabled
                accessibilityRole="button"
                accessibilityLabel="Filtros"
                accessibilityState={{ disabled: true }}
              >
                <SvgXml xml={filterXml} />
                <Text style={styles.filterLabel}>Filtros</Text>
              </Pressable>
            </View>

            <View style={styles.searchField}>
              <SvgXml xml={regionSearchXml} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar região administrativa..."
                placeholderTextColor="#888888"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Buscar região administrativa"
              />
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma região encontrada.</Text>}
        renderItem={({ item }) => (
          <RegionCard
            region={item}
            style={{ width: cardWidth }}
            onPress={() => navigation.navigate('RegionStats', { regionName: item.name })}
          />
        )}
      />

      <BottomNavBar
        activeIndex={REGIONS_TAB_INDEX}
        onPressItem={(_index, key) => {
          if (key === 'home') navigation.navigate('Discover');
          if (key === 'search') navigation.navigate('Chats');
          if (key === 'chat') navigation.navigate('Forum');
          if (key === 'profile') navigation.navigate('Profile');
        }}
        style={[styles.navBar, { bottom: insets.bottom + 16 }]}
      />

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF8F8',
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    gap: GRID_GAP,
  },
  row: {
    gap: GRID_GAP,
  },
  header: {
    gap: 16,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 38.4,
    letterSpacing: -0.64,
    color: '#1A1A1A',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#AAAAAA',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: -15,
    borderRadius: 9999,
    backgroundColor: '#832D51',
  },
  filterLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 14.4,
    letterSpacing: 0.12,
    color: '#EEEEEE',
  },
  searchField: {
    width: 263,
    maxWidth: '100%',
    height: 31,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 17,
    paddingRight: 25,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(238, 238, 238, 0.5)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 9,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 15,
    color: '#1A1A1A',
  },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#AAAAAA',
  },
  navBar: {
    position: 'absolute',
    left: 32,
    right: 32,
  },
});
