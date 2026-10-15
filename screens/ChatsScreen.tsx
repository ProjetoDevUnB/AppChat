import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNavBar, { NAV_BAR_HEIGHT } from '../components/BottomNavBar';
import Avatar from '../components/forum/Avatar';
import { normalizeForSearch } from '../components/forum/feedback';
import SearchField from '../components/forum/SearchField';
import { FORUM_COLORS } from '../components/forum/theme';
import { auth } from '../firebase';
import { describeChatError, subscribeToChats, type ChatSummary } from '../services/chat';
import { getAuthors, type Author } from '../services/users';
import type { RootStackScreenProps } from '../types/navigation';
import { formatRelative } from '../utils/relativeTime';

const CHATS_TAB_INDEX = 2;

export default function ChatsScreen({ navigation }: RootStackScreenProps<'Chats'>) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [authors, setAuthors] = useState<Map<string, Author>>(new Map());
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // Reinscreve ao tocar em "Tentar novamente".
  const [retryKey, setRetryKey] = useState(0);

  const currentUid = auth.currentUser?.uid ?? null;

  // Tempo real: a lista sobe a conversa e acende o contador assim que chega
  // mensagem nova, sem precisar puxar para atualizar.
  useEffect(() => {
    if (!currentUid) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    const unsubscribe = subscribeToChats(
      (loaded) => {
        setChats(loaded);
        setLoading(false);
        // `getAuthors` usa cache: só paga leitura por quem ainda não apareceu.
        getAuthors(loaded.map((chat) => chat.otherUserId)).then((loadedAuthors) => {
          if (active) setAuthors(loadedAuthors);
        });
      },
      (loadError: any) => {
        console.warn('[chat] falha ao carregar conversas:', loadError?.code ?? loadError, loadError?.message ?? '');
        setError(describeChatError(loadError));
        setLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [currentUid, retryKey]);

  const visibleChats = useMemo(() => {
    const term = normalizeForSearch(search.trim());
    if (!term) {
      return chats;
    }

    return chats.filter((chat) => {
      const name = authors.get(chat.otherUserId)?.name ?? '';
      return normalizeForSearch(`${name} ${chat.lastMessage}`).includes(term);
    });
  }, [search, chats, authors]);

  if (!fontsLoaded) {
    return null;
  }

  const renderEmpty = () => {
    if (isLoading) {
      return <ActivityIndicator style={styles.loader} color={FORUM_COLORS.accent} />;
    }

    if (!currentUid) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Entre na sua conta para ver suas conversas.</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Entrar</Text>
          </Pressable>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => setRetryKey((key) => key + 1)}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <Text style={styles.empty}>
        {search.trim()
          ? 'Nenhuma conversa corresponde à sua busca.'
          : 'Nenhuma conversa ainda. Toque no autor de um post no fórum para começar.'}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={isLoading || error || !currentUid ? [] : visibleChats}
        keyExtractor={(chat) => chat.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 24) + 24,
            paddingBottom: NAV_BAR_HEIGHT + insets.bottom + 48,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>Mensagens</Text>
            <Text style={styles.subtitle}>suas conversas com outros moradores</Text>

            <SearchField value={search} onChangeText={setSearch} style={styles.search} />
          </View>
        }
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const author = authors.get(item.otherUserId);
          const name = author?.name ?? 'Carregando...';
          const isMine = item.lastMessageAuthorId === currentUid;
          const hasUnread = item.unread > 0;

          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate('Chat', { userId: item.otherUserId, userName: author?.name })
              }
              accessibilityRole="button"
              accessibilityLabel={
                hasUnread
                  ? `Conversa com ${name}, ${item.unread} mensagens não lidas`
                  : `Conversa com ${name}`
              }
            >
              <Avatar name={author?.name ?? '?'} photoUrl={author?.photoUrl} size={44} />

              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text
                    style={[styles.cardName, hasUnread && styles.cardNameUnread]}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  <Text style={[styles.cardTime, hasUnread && styles.cardTimeUnread]}>
                    {formatRelative(item.lastMessageAt)}
                  </Text>
                </View>

                <View style={styles.cardBottom}>
                  <Text
                    style={[styles.cardPreview, hasUnread && styles.cardPreviewUnread]}
                    numberOfLines={1}
                  >
                    {isMine ? 'Você: ' : ''}
                    {item.lastMessage}
                  </Text>
                  {hasUnread ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread > 99 ? '99+' : item.unread}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      <BottomNavBar
        activeIndex={CHATS_TAB_INDEX}
        onPressItem={(_index, key) => {
          if (key === 'home') navigation.navigate('Discover');
          if (key === 'regions') navigation.navigate('Regions');
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
    backgroundColor: FORUM_COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  listHeader: {
    marginBottom: 20,
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
  separator: {
    height: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FORUM_COLORS.border,
    backgroundColor: FORUM_COLORS.surface,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 20,
    color: FORUM_COLORS.title,
  },
  cardNameUnread: {
    fontFamily: 'Inter_700Bold',
  },
  cardTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: FORUM_COLORS.muted,
  },
  cardTimeUnread: {
    fontFamily: 'Inter_600SemiBold',
    color: FORUM_COLORS.accent,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardPreview: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: FORUM_COLORS.body,
  },
  cardPreviewUnread: {
    fontFamily: 'Inter_500Medium',
    color: FORUM_COLORS.title,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: FORUM_COLORS.accent,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
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
