import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ForumHeader from '../components/forum/ForumHeader';
import AmenitiesCard from '../components/region/AmenitiesCard';
import ForumHighlights from '../components/region/ForumHighlights';
import IncomeCard from '../components/region/IncomeCard';
import LeisureCard from '../components/region/LeisureCard';
import MobilityCard from '../components/region/MobilityCard';
import RegionMap from '../components/region/RegionMap';
import SafetyCard from '../components/region/SafetyCard';
import { REGION_COLORS } from '../components/region/theme';
import { getRegionStats } from '../data/regionStats';
import { useMappedPosts } from '../hooks/useMappedPosts';
import type { RootStackScreenProps } from '../types/navigation';

export default function RegionStatsScreen({ navigation, route }: RootStackScreenProps<'RegionStats'>) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const region = getRegionStats(route.params.regionName);
  const mappedPosts = useMappedPosts(region?.forumTopic);

  if (!fontsLoaded || !region) {
    return null;
  }

  const { forumTopic } = region;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <ForumHeader label={region.name} onBack={navigation.goBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Principais categorias</Text>

          <View style={styles.row}>
            <View style={styles.leftColumn}>
              <MobilityCard mobility={region.mobility} />
              <AmenitiesCard amenities={region.amenities} />
            </View>
            <LeisureCard leisure={region.leisure} style={styles.rightColumn} />
          </View>

          <IncomeCard income={region.income} regionName={region.name} />
          <SafetyCard safety={region.safety} />
        </View>

        <View style={[styles.section, styles.mapSection]}>
          <Text style={styles.sectionTitle}>Localização</Text>
          <RegionMap
            name={region.name}
            map={region.map}
            posts={mappedPosts}
            onPress={() => navigation.navigate('RegionMap', { regionName: region.name })}
          />
        </View>

        {forumTopic ? (
          <View style={styles.forumSection}>
            <ForumHighlights
              topic={forumTopic}
              regionName={region.name}
              onPressPost={(post) =>
                navigation.navigate('PostDetail', { postId: post.id, topicId: post.topic })
              }
              onPressSeeAll={() => navigation.navigate('TopicPosts', { topicId: forumTopic })}
              onPressSignIn={() => navigation.navigate('Login')}
            />
          </View>
        ) : null}
      </ScrollView>

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: REGION_COLORS.background,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  section: {
    gap: 16,
  },
  mapSection: {
    marginTop: 28,
  },
  forumSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: REGION_COLORS.title,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  leftColumn: {
    width: '43.5%',
    gap: 12,
  },
  rightColumn: {
    flex: 1,
  },
});
