import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ForumHeader from '../components/forum/ForumHeader';
import RegionMapExplorer from '../components/region/RegionMapExplorer';
import { REGION_COLORS } from '../components/region/theme';
import { ASA_NORTE_STATS } from '../data/regionStats';
import type { RootStackScreenProps } from '../types/navigation';

export default function RegionMapScreen({ navigation }: RootStackScreenProps<'RegionMap'>) {
  const insets = useSafeAreaInsets();
  const region = ASA_NORTE_STATS;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <ForumHeader label={region.name} onBack={navigation.goBack} />
      </View>
      <View style={styles.map}>
        <RegionMapExplorer name={region.name} map={region.map} />
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: REGION_COLORS.background,
  },
  header: {
    paddingBottom: 12,
  },
  map: {
    flex: 1,
  },
});
