import { Pressable, StyleSheet, Text, View } from 'react-native';

import BackIcon from '../icons/BackIcon';
import Avatar from './Avatar';
import { FORUM_COLORS } from './theme';

// Cabeçalho das telas internas do fórum: seta verde-oliva, rótulo e, à
// direita, o avatar do usuário logado (ausente quando ninguém está logado).
type ForumHeaderProps = {
  label: string;
  onBack: () => void;
  userName?: string | null;
  userPhotoUrl?: string | null;
  onPressAvatar?: () => void;
};

export default function ForumHeader({
  label,
  onBack,
  userName,
  userPhotoUrl,
  onPressAvatar,
}: ForumHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={8}
      >
        <BackIcon size={18} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.label}>{label}</Text>

      <View style={styles.spacer} />

      {userName ? (
        <Pressable
          onPress={onPressAvatar}
          disabled={!onPressAvatar}
          accessibilityRole="button"
          accessibilityLabel="Seu perfil"
        >
          <Avatar name={userName} photoUrl={userPhotoUrl} size={36} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: FORUM_COLORS.oliveDark,
  },
  label: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: FORUM_COLORS.title,
  },
  spacer: {
    flex: 1,
  },
});
