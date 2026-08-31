import { Image, Pressable, StyleSheet, Text } from 'react-native';

// Botão outline com ícone + texto, usado para os logins sociais
// (Apple/Google) na tela de cadastro.
export default function SocialButton({ icon, label, onPress, style }) {
  return (
    <Pressable style={[styles.button, style]} onPress={onPress}>
      <Image source={icon} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 200,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 9999,
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#000000',
  },
});
