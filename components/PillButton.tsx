import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

// Botão em formato de pílula (cantos totalmente arredondados) usado como
// call-to-action principal nas telas — ex.: "Cadastre-se aqui" na Home e
// "Inscreva-se" no cadastro. Cor, tamanho e sombra variam por tela, então
// ficam a cargo de quem usa via `style`/`textStyle`.
type PillButtonProps = {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
};

export default function PillButton({ label, onPress, style, textStyle, disabled }: PillButtonProps) {
  return (
    <Pressable style={[styles.button, style]} onPress={onPress} disabled={disabled}>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
