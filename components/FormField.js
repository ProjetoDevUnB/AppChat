import { StyleSheet, Text, TextInput, View } from 'react-native';

// Campo de formulário padrão (rótulo em cima + input em pílula), usado
// para Nome/E-mail/Senha no cadastro. Qualquer prop de TextInput extra
// (secureTextEntry, keyboardType, value, onChangeText...) passa direto.
export default function FormField({ label, style, inputStyle, ...inputProps }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholderTextColor="#D9D9D9"
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignSelf: 'stretch',
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 9999,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#1A1A1A',
  },
});
