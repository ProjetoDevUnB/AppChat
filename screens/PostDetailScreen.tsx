import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../components/forum/Avatar';
import { describeForumError, promptSignIn } from '../components/forum/feedback';
import FlairChip from '../components/forum/FlairChip';
import ForumHeader from '../components/forum/ForumHeader';
import { FORUM_COLORS } from '../components/forum/theme';
import CommentIcon from '../components/icons/CommentIcon';
import HeartIcon from '../components/icons/HeartIcon';
import SendIcon from '../components/icons/SendIcon';
import { auth } from '../firebase';
import { useCurrentAuthor } from '../hooks/useCurrentAuthor';
import {
  addComment,
  getPost,
  listComments,
  MAX_COMMENT_LENGTH,
  toggleLike,
} from '../services/forum';
import { getAuthors, getShortName, type Author } from '../services/users';
import { getFlairLabel, type Comment, type Post } from '../types/forum';
import { formatRelative } from '../utils/relativeTime';
import type { RootStackScreenProps } from '../types/navigation';

export default function PostDetailScreen({
  navigation,
  route,
}: RootStackScreenProps<'PostDetail'>) {
  const { postId } = route.params;
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [authors, setAuthors] = useState<Map<string, Author>>(new Map());
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [draft, setDraft] = useState('');
  const [isSending, setSending] = useState(false);
  const [actionError, setActionError] = useState('');

  const user = auth.currentUser;
  // Nome e foto vêm do documento do usuário, não do Auth: é lá que o avatar
  // é salvo, e o `displayName` pode estar desatualizado.
  const currentAuthor = useCurrentAuthor();
  const currentUid = user?.uid ?? null;

  const handleAuthorPress = () => {
    if (!post.authorId) return;
    if (post.authorId == auth.currentUser.uid) return;
    
    navigation.navigate('Chat', {
      userId: postAuthor.uid,
      userName: postAuthor.name,
    });
  }
  
  const load = useCallback(async () => {
    setError('');
    try {
      const [loadedPost, loadedComments] = await Promise.all([
        getPost(postId),
        listComments(postId),
      ]);

      if (!loadedPost) {
        setError('Essa conversa não existe mais.');
        return;
      }

      setPost(loadedPost);
      setComments(loadedComments);
      setAuthors(
        await getAuthors([
          loadedPost.authorId,
          ...loadedComments.map((comment) => comment.authorId),
        ]),
      );
    } catch (loadError: any) {
      console.warn('[forum] falha ao carregar post:', loadError?.code ?? loadError, loadError?.message ?? '');
      setError(describeForumError(loadError));
    }
  }, [postId]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    load().finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [load]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  const liked = post !== null && currentUid !== null && post.likedBy.includes(currentUid);

  const handleToggleLike = async () => {
    if (!post) return;

    if (!currentUid) {
      promptSignIn(() => navigation.navigate('Login'));
      return;
    }

    const next = !liked;
    const previous = post;

    // Atualização otimista: o coração responde na hora e só volta atrás se a
    // escrita falhar.
    setPost({
      ...post,
      likedBy: next
        ? [...post.likedBy, currentUid]
        : post.likedBy.filter((uid) => uid !== currentUid),
    });
    setActionError('');

    try {
      await toggleLike(post.id, next);
    } catch (likeError: any) {
      console.warn('[forum] falha ao curtir:', likeError?.code ?? likeError, likeError?.message ?? '');
      setPost(previous);
      setActionError(describeForumError(likeError));
    }
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!post || !body || isSending) return;

    if (!currentUid) {
      promptSignIn(() => navigation.navigate('Login'));
      return;
    }

    setSending(true);
    setActionError('');

    try {
      await addComment(post.id, body);
      setDraft('');
      // Recarrega em vez de inserir localmente: assim o comentário vem com o
      // createdAt do servidor e o commentCount já atualizado.
      await load();
    } catch (sendError: any) {
      console.warn('[forum] falha ao comentar:', sendError?.code ?? sendError, sendError?.message ?? '');
      setActionError(describeForumError(sendError));
    } finally {
      setSending(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const header = (
    <ForumHeader
      label="Conversa"
      onBack={() => navigation.goBack()}
      userName={currentAuthor?.name ?? (user ? 'Usuário' : null)}
      userPhotoUrl={currentAuthor?.photoUrl}
      onPressAvatar={() => navigation.navigate('Profile')}
    />
  );

  if (isLoading || !post) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
        {header}

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={FORUM_COLORS.accent} />
        ) : (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error || 'Essa conversa não existe mais.'}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={handleRefresh}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        )}

        <StatusBar style="dark" />
      </View>
    );
  }

  const postAuthor = authors.get(post.authorId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={comments}
        keyExtractor={(comment) => comment.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 24) + 12 },
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
            {header}

            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <FlairChip label={getFlairLabel(post.flair)} variant="badge" />
              </View>

	      <Pressable
		style={styles.postAuthor}
		onPress={handleAuthorPress}
		disabled={!post.authorId || post.authorId === auth.currentUser.uid}
	      >
                <Avatar name={postAuthor?.name ?? '?'} photoUrl={postAuthor?.photoUrl} size={30} />
                <Text style={styles.postAuthorText}>
                  {postAuthor ? `${getShortName(postAuthor.name)} • ` : ''}
                  {formatRelative(post.createdAt)}
                </Text>
	      </Pressable>
              <Text style={styles.postBody}>{post.body}</Text>

              <View style={styles.divider} />

              <View style={styles.actions}>
                <Pressable
                  style={styles.action}
                  onPress={handleToggleLike}
                  accessibilityRole="button"
                  accessibilityLabel={liked ? 'Remover curtida' : 'Curtir'}
                  accessibilityState={{ selected: liked }}
                  hitSlop={8}
                >
                  <HeartIcon
                    size={20}
                    color={liked ? FORUM_COLORS.accentDark : FORUM_COLORS.body}
                    filled={liked}
                  />
                  <Text style={[styles.actionText, liked && styles.actionTextActive]}>
                    {post.likedBy.length}
                  </Text>
                </Pressable>

                <View style={styles.action}>
                  <CommentIcon size={20} color={FORUM_COLORS.body} />
                  <Text style={styles.actionText}>{post.commentCount}</Text>
                </View>
              </View>
            </View>

            {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

            <Text style={styles.commentsLabel}>
              {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const author = authors.get(item.authorId);

          return (
            <View style={styles.commentCard}>
              <Avatar name={author?.name ?? '?'} photoUrl={author?.photoUrl} size={30} />

              <View style={styles.commentContent}>
                <Text style={styles.commentMeta}>
                  {author ? `${getShortName(author.name)} • ` : ''}
                  {formatRelative(item.createdAt)}
                </Text>
                <Text style={styles.commentBody}>{item.body}</Text>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Ninguém comentou ainda. Comece a conversa!</Text>
        }
      />

      <View style={[styles.composer, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.composerInput}
          value={draft}
          onChangeText={setDraft}
          placeholder="Escreva um comentário..."
          placeholderTextColor={FORUM_COLORS.muted}
          maxLength={MAX_COMMENT_LENGTH}
          multiline
          accessibilityLabel="Escreva um comentário"
        />

        <Pressable
          style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!draft.trim() || isSending}
          accessibilityRole="button"
          accessibilityLabel="Enviar comentário"
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <SendIcon size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FORUM_COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  postCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FORUM_COLORS.border,
    backgroundColor: FORUM_COLORS.surface,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  postTitle: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    lineHeight: 27,
    color: FORUM_COLORS.title,
  },
  postAuthor: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postAuthorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: FORUM_COLORS.muted,
  },
  postBody: {
    marginTop: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#1E1619',
  },
  divider: {
    marginTop: 16,
    height: 1,
    backgroundColor: FORUM_COLORS.border,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: FORUM_COLORS.body,
  },
  actionTextActive: {
    fontFamily: 'Inter_500Medium',
    color: FORUM_COLORS.accentDark,
  },
  actionError: {
    marginTop: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: FORUM_COLORS.danger,
  },
  commentsLabel: {
    marginTop: 24,
    marginBottom: 12,
    paddingLeft: 4,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.12,
    color: '#696969',
  },
  commentCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FORUM_COLORS.border,
    backgroundColor: FORUM_COLORS.surface,
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 14,
    color: FORUM_COLORS.muted,
  },
  commentBody: {
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#1E1619',
  },
  separator: {
    height: 10,
  },
  empty: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: FORUM_COLORS.muted,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: FORUM_COLORS.border,
    backgroundColor: FORUM_COLORS.surface,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: FORUM_COLORS.field,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 19,
    color: FORUM_COLORS.title,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: FORUM_COLORS.accentDark,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  loader: {
    marginTop: 48,
  },
  errorBox: {
    marginTop: 48,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
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
});
