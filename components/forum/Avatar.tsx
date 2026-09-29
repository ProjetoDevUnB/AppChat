import {
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { getInitials } from '../../services/users';
import { FORUM_COLORS } from './theme';

// Círculo com a foto do autor ou, na falta dela, as iniciais do nome.
type AvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function Avatar({ name, photoUrl, size = 28, style }: AvatarProps) {
  const circle = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View
      style={[styles.circle, circle, style]}
      accessibilityLabel={`Foto de ${name}`}
    >
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={circle} />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: FORUM_COLORS.accent,
  },
  initials: {
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
});
