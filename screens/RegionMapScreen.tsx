import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ForumHeader from '../components/forum/ForumHeader';
import RegionMapExplorer from '../components/region/RegionMapExplorer';
import { REGION_COLORS } from '../components/region/theme';
import { getRegionStats } from '../data/regionStats';
import { useMappedPosts } from '../hooks/useMappedPosts';
import type { RootStackScreenProps } from '../types/navigation';

export default function RegionMapScreen({ navigation, route }: RootStackScreenProps<'RegionMap'>) {
  const insets = useSafeAreaInsets();
  // O resumo do post tocado no mapa usa os mesmos chips e contadores do fórum.
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const region = getRegionStats(route.params.regionName);
  const posts = useMappedPosts(region?.forumTopic);

  if (!fontsLoaded || !region) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <ForumHeader label={region.name} onBack={navigation.goBack} />
      </View>
      <View style={styles.map}>
        <RegionMapExplorer
          name={region.name}
          map={region.map}
          posts={posts}
          onPressPost={(post) =>
            navigation.navigate('PostDetail', { postId: post.id, topicId: post.topic })
          }
        />
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
