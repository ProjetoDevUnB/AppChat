import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '../firebase';
import FormField from '../components/FormField';
import PillButton from '../components/PillButton';
import SocialButton from '../components/SocialButton';
import { ensureUserProfile } from '../services/userProfile';
import { configureLoginPersistence } from '../services/authPersistence';
import { TimeoutError, withTimeout } from '../utils/withTimeout';

import type { RootStackScreenProps } from '../types/navigation';
export default function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const loginPending = useRef(false);

  useEffect(() => {
    // Logging in again as the current user does not fire a new auth event.
    if (auth.currentUser) {
      navigation.reset({ index: 0, routes: [{ name: 'Discover' }] });
    }
  }, [navigation]);

  const handleLogin = async () => {
    if (loginPending.current) return;
    if (!email || !password) {
      setErrorMessage('Por favor, preencha e-mail e senha.');
      return;
    }

    loginPending.current = true;
    setIsLoading(true);
    setErrorMessage('');

    try {
      await withTimeout(configureLoginPersistence(auth, rememberMe), 20000);
      const { user } = await withTimeout(signInWithEmailAndPassword(auth, email.trim(), password), 20000);

      // Profile maintenance must not hold up a successful login.
      void ensureUserProfile(user).catch((error: any) => {
        console.warn('[login] falha ao completar o perfil:', error?.code ?? error);
      });

      // App switches to Discover when Firebase publishes the signed-in user.
    } catch (error: any) {
      if (error instanceof TimeoutError) {
        setErrorMessage('O login demorou mais que o esperado. Verifique sua conexão e tente novamente.');
      } else if (
        error.code === 'auth/invalid-email' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/invalid-credential'
      ) {
        setErrorMessage('E-mail ou senha incorretos.');
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMessage('Não foi possível conectar. Verifique sua conexão e tente novamente.');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Muitas tentativas. Aguarde um pouco e tente novamente.');
      } else {
        setErrorMessage('Ocorreu um erro ao tentar fazer login. Tente novamente.');
      }
    } finally {
      loginPending.current = false;
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
        <Text style={styles.title}>Bem-vindo(a) de volta!</Text>
        <Text style={styles.subtitle}>Entre com suas credenciais para acessar sua conta.</Text>

        <FormField
          label="E-mail"
          placeholder="Digite seu e-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrorMessage('');
          }}
        />

        <FormField 
          label="Senha" 
          placeholder="Digite uma senha" 
          secureTextEntry 
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrorMessage('');
          }}
        />

        <Text style={styles.forgotPasswordText}>esqueceu sua senha?</Text>

        <Pressable
          style={styles.termsRow}
          accessibilityRole="checkbox"
          accessibilityLabel="Lembrar de mim"
          accessibilityState={{ checked: rememberMe, disabled: isLoading }}
          disabled={isLoading}
          onPress={() => setRememberMe((prev) => !prev)}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Feather name="check" size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.rememberMeText}>Lembrar de mim</Text>
        </Pressable>

        {errorMessage ? (
          <Text accessibilityRole="alert" style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {isLoading && (
          <View accessibilityLiveRegion="polite" style={styles.loadingRow}>
            <ActivityIndicator color="#832D51" />
            <Text>Entrando na sua conta...</Text>
          </View>
        )}

        <PillButton
          label={isLoading ? "Entrando..." : "Entrar"}
          onPress={handleLogin}
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
            Não tem uma conta?{'  '}
            <Text style={styles.loginPromptLink} onPress={() => navigation.navigate('SignUp')}>Crie agora</Text>
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
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.64,
    color: '#1A1A1A',
  },
  subtitle: {
    alignSelf: 'stretch',
    marginTop: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 38,
    letterSpacing: -0.64,
    color: '#AAAAAA',
  },
  termsRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#000000',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberMeText: {
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
  forgotPasswordText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 10,
    color: '#832D51',
    alignSelf: 'stretch',
    textAlign: 'right',
  },
  loginPromptLink: {
    color: '#E96E97',
  },
  logo: {
    width: 96,
    height: 54,
  },
});
