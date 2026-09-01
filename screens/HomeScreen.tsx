import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PillButton from '../components/PillButton';
import PaginationDots from '../components/PaginationDots';
import type { RootStackScreenProps } from '../types/navigation';

// Layout desenhado sobre um frame de referência 393x852 (iPhone 14 Pro).
// Todos os elementos usam posicionamento absoluto para bater pixel a pixel
// com o design; em telas de largura bem diferente disso o layout pode
// desalinhar um pouco — se precisar, dá pra evoluir para escala responsiva depois.
// As bolinhas de paginação são a exceção: em vez de um `top` fixo (que em
// telas mais baixas que 852px empurrava elas pra fora da área visível),
// ficam ancoradas em `bottom` + safe area, então sempre aparecem coladas
// ao rodapé da tela do aparelho, independente da altura dele.
export default function HomeScreen({ navigation }: RootStackScreenProps<'Home'>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/home_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* recorte decorativo rosa no canto superior esquerdo */}
      <View style={styles.cornerAccent} />

      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="cover"
      />

      <PillButton
        label="Cadastre-se aqui"
        onPress={() => navigation.navigate('SignUp')}
        style={styles.signUpButton}
        textStyle={styles.signUpButtonText}
      />

      <PaginationDots
        count={4}
        activeIndex={3}
        style={[styles.pagination, { bottom: insets.bottom + 17 }]}
      />

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#7F8D18',
    overflow: 'hidden',
  },
  backgroundImage: {
    width: 736,
    height: 1104,
    left: -194,
    top: -148,
    position: 'absolute',
    mixBlendMode: 'multiply',
  },
  cornerAccent: {
    width: 220,
    height: 51,
    left: -29,
    top: -55,
    position: 'absolute',
    backgroundColor: '#E86E97',
    borderTopRightRadius: 74,
  },
  logo: {
    width: 329,
    height: 279,
    left: 32,
    top: 80,
    position: 'absolute',
  },
  signUpButton: {
    width: 221,
    height: 35,
    left: 87,
    top: 360,
    position: 'absolute',
    backgroundColor: '#E86E97',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12.6,
    elevation: 8,
  },
  signUpButtonText: {
    color: '#D9D9D9',
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    lineHeight: 25,
  },
  pagination: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
