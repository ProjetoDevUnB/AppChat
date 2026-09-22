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
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeForumError, normalizeForSearch, promptSignIn } from '../components/forum/feedback';
import FlairCarousel, { type FlairFilter } from '../components/forum/FlairCarousel';
import ForumHeader from '../components/forum/ForumHeader';
import PostCard from '../components/forum/PostCard';
import SearchField from '../components/forum/SearchField';
import { FORUM_COLORS } from '../components/forum/theme';
import PencilIcon from '../components/icons/PencilIcon';
import { auth } from '../firebase';
import { listPostsByTopic } from '../services/forum';
import { getAuthors, type Author } from '../services/users';
import { getTopicLabel, type Post } from '../types/forum';
import type { RootStackScreenProps } from '../types/navigation';

export default function TopicPostsScreen({
  navigation,
  route,
}: RootStackScreenProps<'TopicPosts'>) {
  const { topicId } = route.params;
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Map<string, Author>>(new Map());
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [flair, setFlair] = useState<FlairFilter>(null);

  const user = auth.currentUser;
  const currentUid = user?.uid ?? null;

  const load = useCallback(async () => {
    setError('');
    try {
      const loaded = await listPostsByTopic(topicId);
      setPosts(loaded);
      // Os nomes vêm de users/{uid} num lote só; o serviço tem cache, então
      // autores repetidos na lista custam uma leitura apenas.
      setAuthors(await getAuthors(loaded.map((post) => post.authorId)));
    } catch (loadError: any) {
      console.warn('[forum] falha ao carregar posts:', loadError?.code ?? loadError, loadError?.message ?? '');
      setError(describeForumError(loadError));
    }
  }, [topicId]);

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

  // Busca e flair filtram o que já veio do Firestore: o banco não tem busca
  // full-text e filtrar por flair no servidor exigiria mais um índice composto.
  const visiblePosts = useMemo(() => {
    const term = normalizeForSearch(search.trim());

    return posts.filter((post) => {
      if (flair && post.flair !== flair) {
        return false;
      }
      if (!term) {
        return true;
      }
      return normalizeForSearch(`${post.title} ${post.body}`).includes(term);
    });
  }, [posts, search, flair]);

  const handleCreate = () => {
    if (!currentUid) {
      promptSignIn(() => navigation.navigate('Login'));
      return;
    }
    navigation.navigate('CreatePost', { topicId });
  };

  if (!fontsLoaded) {
    return null;
  }

  const label = getTopicLabel(topicId);
  const count = posts.length;

  return (
    <View style={styles.container}>
      <FlatList
        data={visiblePosts}
        keyExtractor={(post) => post.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 24) + 12, paddingBottom: insets.bottom + 96 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={FORUM_COLORS.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <ForumHeader
              label="Conversas"
              onBack={() => navigation.goBack()}
              userName={user?.displayName ?? (user ? 'Usuário' : null)}
              onPressAvatar={() => navigation.navigate('Profile')}
            />

            <Text style={styles.title}>{label}</Text>
            <Text style={styles.subtitle}>
              {count} {count === 1 ? 'conversa' : 'conversas'} nesta região
            </Text>

            <SearchField value={search} onChangeText={setSearch} style={styles.search} />

            {/* Fora do padding lateral para o carrossel poder sangrar na borda. */}
            <FlairCarousel value={flair} onChange={setFlair} style={styles.carousel} />
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            author={authors.get(item.authorId)}
            currentUid={currentUid}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id, topicId })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading ? (
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
          ) : (
            <Text style={styles.empty}>
              {posts.length === 0
                ? 'Nenhuma conversa por aqui ainda. Seja o primeiro a publicar!'
                : 'Nenhuma conversa corresponde a esse filtro.'}
            </Text>
          )
        }
      />

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={handleCreate}
        accessibilityRole="button"
        accessibilityLabel="Nova conversa"
      >
        <PencilIcon size={22} color="#FFFFFF" />
      </Pressable>

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
    marginTop: 20,
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
    marginTop: 18,
  },
  carousel: {
    marginTop: 16,
    marginBottom: 20,
    marginHorizontal: -20,
  },
  separator: {
    height: 12,
  },
  loader: {
    marginTop: 32,
  },
  empty: {
    marginTop: 32,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: FORUM_COLORS.muted,
  },
  errorBox: {
    marginTop: 32,
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
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: FORUM_COLORS.accentDark,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
});
