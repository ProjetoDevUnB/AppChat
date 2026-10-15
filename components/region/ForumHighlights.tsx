import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { auth } from '../../firebase';
import { listPostsByTopic } from '../../services/forum';
import { getAuthors, type Author } from '../../services/users';
import type { Post, TopicId } from '../../types/forum';
import Avatar from '../forum/Avatar';
import { describeForumError } from '../forum/feedback';
import { heartOutlineXml } from '../icons/regionIconsXml';
import { REGION_COLORS } from './theme';

const HIGHLIGHT_COUNT = 2;
const AVATAR_COLORS = [REGION_COLORS.olive, '#E86E97'];

function byMostLiked(a: Post, b: Post) {
  return b.likedBy.length - a.likedBy.length;
}

type ForumHighlightsProps = {
  topic: TopicId;
  regionName: string;
  onPressPost: (post: Post) => void;
  onPressSeeAll: () => void;
  onPressSignIn: () => void;
};

export default function ForumHighlights({
  topic,
  regionName,
  onPressPost,
  onPressSeeAll,
  onPressSignIn,
}: ForumHighlightsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Map<string, Author>>(new Map());
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSignedIn, setSignedIn] = useState(auth.currentUser !== null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        setError('');
        // As regras do Firestore só liberam a leitura do fórum para quem entrou.
        const signedIn = auth.currentUser !== null;
        setSignedIn(signedIn);
        if (!signedIn) {
          setLoading(false);
          return;
        }
        try {
          // A ordenação de listPostsByTopic é estável: entre curtidas iguais,
          // o post mais recente vem primeiro.
          const highlights = (await listPostsByTopic(topic))
            .sort(byMostLiked)
            .slice(0, HIGHLIGHT_COUNT);
          const loadedAuthors = await getAuthors(highlights.map((post) => post.authorId));
          if (!active) return;
          setPosts(highlights);
          setAuthors(loadedAuthors);
        } catch (loadError: any) {
          console.warn('[region] falha ao carregar destaques:', loadError?.code ?? loadError);
          if (active) setError(describeForumError(loadError));
        } finally {
          if (active) setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [topic]),
  );

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Destaques do fórum</Text>

      {!isSignedIn ? (
        <Text style={styles.feedbackText}>
          <Text style={styles.signInLink} onPress={onPressSignIn} accessibilityRole="link">
            Entre na sua conta
          </Text>{' '}
          para ver o que os moradores dizem sobre {regionName}.
        </Text>
      ) : isLoading ? (
        <ActivityIndicator color={REGION_COLORS.accent} style={styles.feedback} />
      ) : error ? (
        <Text style={styles.feedbackText}>{error}</Text>
      ) : posts.length === 0 ? (
        <Text style={styles.feedbackText}>
          Ainda não há conversas sobre {regionName}. Que tal começar uma?
        </Text>
      ) : (
        posts.map((post, index) => {
          const author = authors.get(post.authorId);
          const name = author?.name ?? '';

          return (
            <Pressable
              key={post.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => onPressPost(post)}
              accessibilityRole="button"
              accessibilityLabel={`${name}: ${post.body}`}
            >
              <View style={styles.cardHeader}>
                <View style={styles.author}>
                  <Avatar
                    name={name || '?'}
                    photoUrl={author?.photoUrl}
                    size={32}
                    style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
                  />
                  <Text style={styles.authorName} numberOfLines={1}>
                    {name}
                  </Text>
                </View>
                <View style={styles.likes} accessibilityLabel={`${post.likedBy.length} curtidas`}>
                  <SvgXml xml={heartOutlineXml} />
                  <Text style={styles.likeCount}>{post.likedBy.length}</Text>
                </View>
              </View>
              <Text style={styles.body} numberOfLines={3}>
                {post.body}
              </Text>
            </Pressable>
          );
        })
      )}

      <Pressable
        style={({ pressed }) => [styles.seeAll, pressed && styles.cardPressed]}
        onPress={onPressSeeAll}
        accessibilityRole="button"
      >
        <Text style={styles.seeAllLabel}>Ver fórum completo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  heading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: REGION_COLORS.title,
  },
  card: {
    gap: 8,
    padding: 17,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: REGION_COLORS.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  authorName: {
    flexShrink: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: REGION_COLORS.title,
  },
  likes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#6B5A63',
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#888888',
  },
  feedback: {
    paddingVertical: 16,
  },
  feedbackText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: REGION_COLORS.muted,
  },
  signInLink: {
    fontFamily: 'Inter_700Bold',
    color: REGION_COLORS.accent,
  },
  seeAll: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    borderRadius: 9999,
    backgroundColor: REGION_COLORS.accent,
    shadowColor: REGION_COLORS.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4,
  },
  seeAllLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});
