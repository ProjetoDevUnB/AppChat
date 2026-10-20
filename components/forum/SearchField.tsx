import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import SearchIcon from '../icons/SearchIcon';
import { FORUM_COLORS } from './theme';

// Campo de busca em pílula com a lupa à esquerda, usado na visão geral e na
// lista de posts de uma RA.
type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  // Para buscas que vão à rede: dispara só no "buscar" do teclado, não a cada letra.
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function SearchField({
  value,
  onChangeText,
  placeholder = 'Pesquisar conversa...',
  onSubmitEditing,
  style,
}: SearchFieldProps) {
  return (
    <View style={[styles.field, style]}>
      <SearchIcon size={20} color={FORUM_COLORS.body} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={FORUM_COLORS.muted}
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    borderRadius: 9999,
    backgroundColor: FORUM_COLORS.field,
  },
  input: {
    flex: 1,
    // Sem isso o Android corta os descendentes ("g", "p") no input de altura fixa.
    paddingVertical: 0,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: FORUM_COLORS.title,
  },
});
