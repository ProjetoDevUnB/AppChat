import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold, useFonts
} from '@expo-google-fonts/inter';
import FormField from '../components/FormField';
import PillButton from '../components/PillButton';
import SocialButton from '../components/SocialButton';
import type { RootStackScreenProps } from '../types/navigation';

export default function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });
  const [rememberMe, setRememberMe] = useState(false);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#FAFBF8' }} />; // Tela branca durante carregamento da fonte
  }

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
        />

        <FormField label="Senha" placeholder="Digite uma senha" secureTextEntry />

        <Text style={styles.forgotPasswordText}>esqueceu sua senha?</Text>

        <Pressable
          style={styles.termsRow}
          onPress={() => setRememberMe((prev) => !prev)}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
          <Text style={styles.rememberMeText}>Lembrar de mim</Text>
        </Pressable>

        {/* MOCK: ainda não existe autenticação, então o botão de entrar só
            leva direto para a tela de descoberta. Quando o login de verdade
            existir, é aqui que ele entra — validar as credenciais e só então
            navegar. */}
        <PillButton
          label="Inscreva-se"
          onPress={() => navigation.navigate('Discover')}
          style={styles.signUpButton}
          textStyle={styles.signUpButtonText}
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
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#000000',
  },
  rememberMeText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#000000',
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
