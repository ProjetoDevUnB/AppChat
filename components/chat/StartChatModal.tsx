import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import type { Author } from '../../services/users';
import Avatar from '../forum/Avatar';
import { CARD_SHADOW, FORUM_COLORS } from '../forum/theme';
import ChatIcon from '../icons/ChatIcon';

// Cartão que aparece ao tocar num autor do fórum: confirma com quem a conversa
// vai ser aberta antes de sair da tela do post.
type StartChatModalProps = {
  author: Author | null;
  onClose: () => void;
  onSendMessage: (author: Author) => void;
};

export default function StartChatModal({ author, onClose, onSendMessage }: StartChatModalProps) {
  return (
    <Modal
      visible={author !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
      >
        {/* Absorve o toque para que tocar no cartão não feche o modal. */}
        <Pressable style={styles.card} onPress={() => {}}>
          {author ? (
            <>
              <Avatar name={author.name} photoUrl={author.photoUrl} size={72} />
              <Text style={styles.name} numberOfLines={2}>
                {author.name}
              </Text>

              <Pressable
                style={styles.sendButton}
                onPress={() => onSendMessage(author)}
                accessibilityRole="button"
                accessibilityLabel={`Enviar mensagem para ${author.name}`}
              >
                <ChatIcon size={18} color="#FFFFFF" />
                <Text style={styles.sendText}>Enviar mensagem</Text>
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={onClose}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    borderRadius: 14,
    backgroundColor: FORUM_COLORS.surface,
    ...CARD_SHADOW,
  },
  name: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: FORUM_COLORS.title,
  },
  sendButton: {
    marginTop: 20,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: FORUM_COLORS.accentDark,
  },
  sendText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  cancelButton: {
    marginTop: 14,
    paddingVertical: 4,
  },
  cancelText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: FORUM_COLORS.body,
  },
});
