import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

import { auth, db } from '../App';
import FormField from '../components/FormField';
import PillButton from '../components/PillButton';
import SocialButton from '../components/SocialButton';
import type { RootStackScreenProps } from '../types/navigation';
import { doc, setDoc } from 'firebase/firestore';

const SIGNUP_TIMEOUT_MS = 20000;

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}


export default function SignUpScreen({ navigation }: RootStackScreenProps<'SignUp'>) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Limpa o erro assim que o usuário corrige qualquer campo.
  const handleChange = (setter: (value: string) => void) => (text: string) => {
    setter(text);
    setErrorMessage('');
  };

  const handleSignUp = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setErrorMessage('Por favor, preencha nome, e-mail e senha.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage('É preciso aceitar os termos de uso para continuar.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

try {
      const { user } = await withTimeout(
        createUserWithEmailAndPassword(auth, trimmedEmail, password),
        SIGNUP_TIMEOUT_MS,
      );

      await withTimeout(updateProfile(user, { displayName: trimmedName }), SIGNUP_TIMEOUT_MS);

      await withTimeout(
        setDoc(doc(db, 'users', user.uid), {
          name: trimmedName,
        }),
        SIGNUP_TIMEOUT_MS
      );

      navigation.navigate('Discover');
    } catch (error: any) {

      console.warn('[signup] falha ao criar conta:', error?.code ?? error);

      if (error instanceof TimeoutError) {
        setErrorMessage('A conexão está demorando demais. Tente novamente.');
      } else if (error.code === 'auth/admin-restricted-operation') {

        setErrorMessage('O cadastro está indisponível no momento. Tente mais tarde.');
      } else if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Este e-mail já está cadastrado.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Digite um e-mail válido.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMessage('Sem conexão. Verifique sua internet e tente novamente.');
      } else {
        setErrorMessage('Ocorreu um erro ao criar sua conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/signup_header.png')}
        style={styles.headerImage}
        resizeMode="cover"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Comece agora com o mapeei!</Text>

        <FormField
          label="Nome"
          placeholder="Digite seu nome"
          autoCapitalize="words"
          value={name}
          onChangeText={handleChange(setName)}
        />

        <FormField
          label="E-mail"
          placeholder="Digite seu e-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={handleChange(setEmail)}
        />

        <FormField
          label="Senha"
          placeholder="Digite uma senha"
          secureTextEntry
          value={password}
          onChangeText={handleChange(setPassword)}
        />

        <Pressable
          style={styles.termsRow}
          onPress={() => {
            setAcceptedTerms((prev) => !prev);
            setErrorMessage('');
          }}
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]} />
          <Text style={styles.termsText}>Li e concordo com os termos de uso</Text>
        </Pressable>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <PillButton
          label={isLoading ? 'Criando conta...' : 'Inscreva-se'}
          onPress={handleSignUp}
          style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
          textStyle={styles.signUpButtonText}
          disabled={isLoading}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <SocialButton
          icon={require('../assets/apple_icon.png')}
          label="Inscreva-se com Apple"
          onPress={() => {}}
        />

        <SocialButton
          icon={require('../assets/google_icon.png')}
          label="Inscreva-se com Google"
          onPress={() => {}}
        />

        <Pressable onPress={() => {}}>
          <Text style={styles.loginPrompt}>
            Já possui uma conta?{'  '}
            <Text
              style={styles.loginPromptLink}
              onPress={() => navigation.navigate('Login')}>
                Entre
            </Text>
          </Text>
        </Pressable>

        <Image
          source={require('../assets/logo_signup.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </ScrollView>

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBF8',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  headerImage: {
    width: '100%',
    height: 153,
  },
  title: {
    alignSelf: 'stretch',
    marginTop: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: 'bold',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.64,
    color: '#1A1A1A',
  },
  termsRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#000000',
  },
  termsText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#000000',
  },
  errorText: {
    color: '#D32F2F',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  signUpButton: {
    alignSelf: 'stretch',
    height: 48,
    backgroundColor: '#832D51',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#FAFBF8',
  },
  dividerRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  dividerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#000000',
  },
  loginPrompt: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#000000',
  },
  loginPromptLink: {
    color: '#E96E97',
  },
  logo: {
    width: 96,
    height: 54,
  },
});
