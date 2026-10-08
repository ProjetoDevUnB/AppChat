import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bubble,
  GiftedChat,
  InputToolbar,
  Send,
  type BubbleProps,
  type IMessage,
  type InputToolbarProps,
  type SendProps,
} from 'react-native-gifted-chat';
import 'dayjs/locale/pt-br';

import ForumHeader from '../components/forum/ForumHeader';
import { promptSignIn } from '../components/forum/feedback';
import { FORUM_COLORS } from '../components/forum/theme';
import SendIcon from '../components/icons/SendIcon';
import { auth } from '../firebase';
import { useCurrentAuthor } from '../hooks/useCurrentAuthor';
import { markChatAsRead, sendMessage, subscribeToMessages, type RawMessage } from '../services/chat';
import { getAuthor, type Author } from '../services/users';
import type { RootStackScreenProps } from '../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window'); // Pega a largura da tela

export default function ChatScreen({ navigation, route }: RootStackScreenProps<'Chat'>) {
  const insets = useSafeAreaInsets();
  const { userId: recipientId, userName: routeUserName } = route.params;

  const [rawMessages, setRawMessages] = useState<RawMessage[]>([]);
  const [recipient, setRecipient] = useState<Author | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Altura do cabeçalho: o KeyboardAvoidingView do Gifted Chat precisa saber
  // onde o chat começa para subir o campo de texto na medida certa.
  const [headerHeight, setHeaderHeight] = useState(0);

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

    // Mesmo cache dos autores do fórum: vindo de um post, nome e foto já estão lá.
    let active = true;
    getAuthor(recipientId).then((author) => {
      if (active) setRecipient(author);
    });

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

    return () => {
      active = false;
      unsubscribe();
    };
  }, [recipientId, user, navigation]);

  // Com a conversa aberta, tudo que chega do outro lado já foi visto. Só a
  // mensagem mais recente importa, então não escreve a cada snapshot.
  const latestIncomingId = rawMessages.find((msg) => msg.authorId === recipientId)?.id;
  useEffect(() => {
    if (!user || !recipientId) return;
    markChatAsRead(recipientId).catch((error) => {
      console.warn('[chat] falha ao marcar como lida:', error?.code ?? error);
    });
  }, [latestIncomingId, recipientId, user]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
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

  const recipientName = recipient?.name ?? routeUserName ?? 'Usuário';

  // Mapeia mensagens do banco (normalizadas) para o formato do Gifted Chat em memória
  const formattedMessages: IMessage[] = useMemo(
    () =>
      rawMessages.map((msg) => {
        const isMe = msg.authorId === user?.uid;
        return {
          _id: msg.id,
          text: msg.text,
          createdAt: msg.createdAt,
          user: {
            _id: msg.authorId,
            name: isMe ? (currentAuthor?.name ?? 'Eu') : recipientName,
            avatar: (isMe ? currentAuthor?.photoUrl : recipient?.photoUrl) ?? undefined,
          },
        };
      }),
    [rawMessages, user?.uid, currentAuthor, recipient, recipientName]
  );

  const renderBubble = useCallback(
    (props: BubbleProps<IMessage>) => (
      <Bubble
        {...props}
        wrapperStyle={{
          left: styles.bubbleLeft,
          right: styles.bubbleRight,
        }}
        textStyle={{
          left: styles.bubbleTextLeft,
          right: styles.bubbleTextRight,
        }}
      />
    ),
    []
  );

  const renderInputToolbar = useCallback(
    (props: InputToolbarProps<IMessage>) => (
      <InputToolbar
        {...props}
        containerStyle={[styles.inputToolbar, { paddingBottom: insets.bottom + 8 }]}
        primaryStyle={styles.inputPrimary}
      />
    ),
    [insets.bottom]
  );

  const renderSend = useCallback(
    (props: SendProps<IMessage>) => (
      <Send {...props} isSendButtonAlwaysVisible containerStyle={styles.sendContainer}>
        <View style={[styles.sendButton, !props.text?.trim() && styles.sendButtonDisabled]}>
          <SendIcon size={18} color="#FFFFFF" />
        </View>
      </Send>
    ),
    []
  );

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View
        style={[styles.headerWrapper, { paddingTop: Math.max(insets.top, 24) + 12 }]}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <ForumHeader
          label={recipientName}
          onBack={() => navigation.goBack()}
          userName={recipientName}
          userPhotoUrl={recipient?.photoUrl}
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={FORUM_COLORS.accent} />
        </View>
      ) : (
        <GiftedChat
          messages={formattedMessages}
          onSend={onSend}
          user={{ _id: user.uid }}
          locale="pt-br"
          colorScheme="light"
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderSend={renderSend}
          messagesContainerStyle={styles.messages}
          textInputProps={{
            placeholder: 'Escreva uma mensagem...',
            placeholderTextColor: FORUM_COLORS.muted,
            style: styles.composerInput,
          }}
          timeTextStyle={{
            left: styles.timeTextLeft,
            right: styles.timeTextRight,
          }}
          keyboardAvoidingViewProps={{ keyboardVerticalOffset: headerHeight }}
        />
      )}

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FORUM_COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerWrapper: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: FORUM_COLORS.border,
    backgroundColor: FORUM_COLORS.background,
  },
  messages: { backgroundColor: FORUM_COLORS.background },
  bubbleLeft: {
    backgroundColor: FORUM_COLORS.surface,
    borderWidth: 1,
    borderColor: FORUM_COLORS.border,
    borderRadius: 14,
    flexShrink: 1,
    maxWidth: SCREEN_WIDTH * 0.75,
  },
  bubbleRight: {
    backgroundColor: FORUM_COLORS.accentDark,
    borderRadius: 14,
    flexShrink: 1,
    maxWidth: SCREEN_WIDTH * 0.75,
  },
  bubbleTextLeft: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: FORUM_COLORS.title,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  bubbleTextRight: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  timeTextLeft: { fontFamily: 'Inter_400Regular', fontSize: 10, color: FORUM_COLORS.muted },
  timeTextRight: { fontFamily: 'Inter_400Regular', fontSize: 10, color: FORUM_COLORS.accentSoft },
  inputToolbar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: FORUM_COLORS.border,
    backgroundColor: FORUM_COLORS.surface,
  },
  inputPrimary: { alignItems: 'flex-end', gap: 8 },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 22,
    backgroundColor: FORUM_COLORS.field,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 19,
    color: FORUM_COLORS.title,
  },
  sendContainer: { justifyContent: 'flex-end' },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: FORUM_COLORS.accentDark,
  },
  sendButtonDisabled: { opacity: 0.4 },
});
