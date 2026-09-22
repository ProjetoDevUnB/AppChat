import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeForumError, promptSignIn } from '../components/forum/feedback';
import FlairChip from '../components/forum/FlairChip';
import ForumHeader from '../components/forum/ForumHeader';
import { FORUM_COLORS } from '../components/forum/theme';
import PillButton from '../components/PillButton';
import { auth } from '../firebase';
import { createPost, MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from '../services/forum';
import { FLAIRS, getTopicLabel, type FlairId } from '../types/forum';
import type { RootStackScreenProps } from '../types/navigation';

export default function CreatePostScreen({
  navigation,
  route,
}: RootStackScreenProps<'CreatePost'>) {
  const { topicId } = route.params;
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [flair, setFlair] = useState<FlairId | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const user = auth.currentUser;

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && flair !== null;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    if (!user) {
      promptSignIn(() => navigation.navigate('Login'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createPost({ title, body, topic: topicId, flair });
      // A lista da RA recarrega no useFocusEffect ao receber o foco de volta.
      navigation.goBack();
    } catch (submitError: any) {
      console.warn('[forum] falha ao publicar:', submitError?.code ?? submitError, submitError?.message ?? '');
      setError(describeForumError(submitError));
      setSubmitting(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 24) + 12,
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        <ForumHeader
          label="Nova conversa"
          onBack={() => navigation.goBack()}
          userName={user?.displayName ?? (user ? 'Usuário' : null)}
        />

        <Text style={styles.topic}>{getTopicLabel(topicId)}</Text>
        <Text style={styles.subtitle}>sua conversa vai aparecer nesta região</Text>

        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={styles.label}>Título</Text>
            <Text style={styles.counter}>
              {title.length}/{MAX_TITLE_LENGTH}
            </Text>
          </View>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Sobre o que você quer conversar?"
            placeholderTextColor={FORUM_COLORS.muted}
            maxLength={MAX_TITLE_LENGTH}
            accessibilityLabel="Título da conversa"
          />
        </View>

        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={styles.label}>Texto</Text>
            <Text style={styles.counter}>
              {body.length}/{MAX_BODY_LENGTH}
            </Text>
          </View>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={body}
            onChangeText={setBody}
            placeholder="Conte os detalhes para os moradores da região..."
            placeholderTextColor={FORUM_COLORS.muted}
            maxLength={MAX_BODY_LENGTH}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Texto da conversa"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Flair</Text>
          {/* Sem "Todas" aqui: ao publicar a categoria é obrigatória. */}
          <View style={styles.flairs}>
            {FLAIRS.map((option) => (
              <FlairChip
                key={option.id}
                label={option.label}
                selected={flair === option.id}
                onPress={() => setFlair(option.id)}
              />
            ))}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PillButton
          label={isSubmitting ? 'Publicando...' : 'Publicar'}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          style={[styles.submit, (!canSubmit || isSubmitting) && styles.submitDisabled]}
          textStyle={styles.submitText}
        />
      </ScrollView>

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
  },
  topic: {
    marginTop: 20,
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: FORUM_COLORS.title,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: FORUM_COLORS.muted,
  },
  field: {
    marginTop: 24,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: FORUM_COLORS.title,
  },
  counter: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: FORUM_COLORS.muted,
  },
  input: {
    marginTop: 8,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FORUM_COLORS.border,
    backgroundColor: FORUM_COLORS.surface,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: FORUM_COLORS.title,
  },
  inputMultiline: {
    minHeight: 160,
  },
  flairs: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  error: {
    marginTop: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: FORUM_COLORS.danger,
  },
  submit: {
    marginTop: 32,
    height: 52,
    backgroundColor: FORUM_COLORS.accentDark,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
