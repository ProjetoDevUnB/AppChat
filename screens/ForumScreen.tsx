import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNavBar, { NAV_BAR_HEIGHT } from '../components/BottomNavBar';
import { describeForumError, normalizeForSearch } from '../components/forum/feedback';
import SearchField from '../components/forum/SearchField';
import { FORUM_COLORS } from '../components/forum/theme';
import TopicCard from '../components/forum/TopicCard';
import { listAllPosts, summarizeTopics, type TopicSummary } from '../services/forum';
import { TOPICS, type TopicId } from '../types/forum';
import type { RootStackScreenProps } from '../types/navigation';

const CHAT_TAB_INDEX = 3;

export default function ForumScreen({ navigation }: RootStackScreenProps<'Forum'>) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [summaries, setSummaries] = useState<Map<TopicId, TopicSummary>>(new Map());
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      // Os números dos cards (conversas, comentários, curtidas, última
      // atividade) saem dos próprios posts, agrupados aqui no cliente — não há
      // contadores por RA no banco.
      const posts = await listAllPosts();
      setSummaries(summarizeTopics(posts));
    } catch (loadError: any) {
      console.warn('[forum] falha ao carregar:', loadError?.code ?? loadError, loadError?.message ?? '');
      setError(describeForumError(loadError));
    }
  }, []);

  // Recarrega ao voltar da publicação de um post, para o contador da RA subir.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);
      load().finally(() => {
        if (active) setLoading(false);
      });

      return () => {
        active = false;
      };
    }, [load]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  // A busca aqui casa com o nome da RA e com o texto da conversa mais recente.
  const visibleTopics = useMemo(() => {
    const term = normalizeForSearch(search.trim());
    if (!term) {
      return TOPICS;
    }

    return TOPICS.filter((topic) => {
      const latest = summaries.get(topic.id)?.latestPost;
      const haystack = normalizeForSearch(
        `${topic.label} ${latest?.title ?? ''} ${latest?.body ?? ''}`,
      );
      return haystack.includes(term);
    });
  }, [search, summaries]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 24) + 24,
            paddingBottom: NAV_BAR_HEIGHT + insets.bottom + 48,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={FORUM_COLORS.accent}
          />
        }
      >
        <Text style={styles.title}>Fórum</Text>
        <Text style={styles.subtitle}>converse com moradores das RAs</Text>

        <SearchField value={search} onChangeText={setSearch} style={styles.search} />

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={FORUM_COLORS.accent} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={handleRefresh}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : visibleTopics.length === 0 ? (
          <Text style={styles.empty}>Nenhuma região corresponde à sua busca.</Text>
        ) : (
          <View style={styles.list}>
            {visibleTopics.map((topic) => (
              <TopicCard
                key={topic.id}
                topicId={topic.id}
                summary={summaries.get(topic.id)}
                onPress={() => navigation.navigate('TopicPosts', { topicId: topic.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNavBar
        activeIndex={CHAT_TAB_INDEX}
        onPressItem={(_index, key) => {
          if (key === 'home') navigation.navigate('Discover');
          if (key === 'regions') navigation.navigate('Regions');
          if (key === 'search') navigation.navigate('Chats');
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
    backgroundColor: FORUM_COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.72,
    color: FORUM_COLORS.title,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: FORUM_COLORS.muted,
  },
  search: {
    marginTop: 20,
  },
  list: {
    marginTop: 20,
    gap: 12,
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: FORUM_COLORS.muted,
  },
  errorBox: {
    marginTop: 48,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: FORUM_COLORS.body,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: FORUM_COLORS.accentDark,
  },
  retryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#FFFFFF',
  },
  navBar: {
    position: 'absolute',
    left: 32,
    right: 32,
  },
});
