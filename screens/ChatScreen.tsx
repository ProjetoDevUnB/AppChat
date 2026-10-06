import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Chat } from '@kesha-antonov/react-native-chat';

import { auth } from '../firebase';
import { useCurrentAuthor } from '../hooks/useCurrentAuthor';
import { promptSignIn } from '../components/forum/feedback';
import { FORUM_COLORS } from '../components/forum/theme';
import { subscribeToMessages, sendMessage, getUserProfile, type RawMessage } from '../services/chat';
import type { RootStackScreenProps } from '../types/navigation';

export default function ChatScreen({ navigation, route }: RootStackScreenProps<'Chat'>) {
  const insets = useSafeAreaInsets();
  const { userId: recipientId, userName: routeUserName } = route.params;

  const [rawMessages, setRawMessages] = useState<RawMessage[]>([]);
  const [recipientProfile, setRecipientProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const user = auth.currentUser;
  const currentAuthor = useCurrentAuthor();

  useEffect(() => {
    if (!user) {
      promptSignIn(() => navigation.replace('Login'));
      return;
    }

    if (!recipientId) {
      console.error('ChatScreen mounted without recipientId');
      setIsLoading(false);
      return;
    }

    setRawMessages([]);
    setIsLoading(true);

    // Buscar perfil do destinatário uma vez para obter o Base64 sem transitar no React Navigation
    getUserProfile(recipientId).then(profile => {
      if (profile) setRecipientProfile(profile);
    }).catch(console.warn);

    const unsubscribe = subscribeToMessages(
      recipientId,
      (fetchedMessages) => {
        setRawMessages(fetchedMessages);
        setIsLoading(false);
      },
      (error) => {
        console.warn('[chat] falha ao carregar mensagens:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [recipientId, user, navigation]);

  const onSend = useCallback(
    async (newMessages = []) => {
      if (!user || newMessages.length === 0) return;
      const messageToUpload = newMessages[0];

      try {
        await sendMessage(recipientId, messageToUpload.text);
      } catch (error) {
        console.warn('[chat] falha ao enviar mensagem:', error);
      }
    },
    [recipientId, user]
  );

  // Mapeia mensagens do banco (normalizadas) para o formato do Gifted Chat em memória
  const formattedMessages = rawMessages.map((msg) => {
    const isMe = msg.authorId === user?.uid;
    return {
      _id: msg.id,
      text: msg.text,
      createdAt: msg.createdAt,
      user: {
        _id: msg.authorId,
        name: isMe ? (currentAuthor?.name ?? 'Eu') : (recipientProfile?.name ?? routeUserName ?? 'Usuário'),
        avatar: isMe ? currentAuthor?.photoUrl : recipientProfile?.photoDataUrl,
      },
    };
  });

  if (!user) return null;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24) }]}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={FORUM_COLORS.title} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipientProfile?.name ?? routeUserName ?? 'Chat'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={FORUM_COLORS.accent} />
        </View>
      ) : (
        <Chat
          messages={formattedMessages}
          onSend={onSend}
          user={{ _id: user.uid }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FORUM_COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 56, paddingHorizontal: 16, borderBottomWidth: 1,
    borderBottomColor: FORUM_COLORS.border, backgroundColor: FORUM_COLORS.surface,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 16, color: FORUM_COLORS.title,
    flex: 1, textAlign: 'center',
  },
  headerSpacer: { width: 32 },
});
