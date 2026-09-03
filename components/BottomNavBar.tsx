import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import ChatIcon from './icons/ChatIcon';
import HomeIcon from './icons/HomeIcon';
import ProfileIcon from './icons/ProfileIcon';
import SearchChatIcon from './icons/SearchChatIcon';
import type { IconProps } from './icons/types';


// Só os ícones existem por enquanto — as telas de busca, conversas e perfil
// ainda não foram feitas, então a barra não navega sozinha: quem usa decide
// o que fazer via `onPressItem`. Assim o componente já serve para as próximas
// telas sem precisar mexer nele.


const ACTIVE_COLOR = '#E86E97';
const INACTIVE_ICON_COLOR = '#CCCCCC';
const ACTIVE_ICON_COLOR = '#FFFFFF';

export const NAV_BAR_HEIGHT = 50;

type NavItem = {
  key: string;
  label: string;
  Icon: (props: IconProps) => React.JSX.Element;
};

const ITEMS: NavItem[] = [
  { key: 'home', label: 'Início', Icon: HomeIcon },
  { key: 'search', label: 'Buscar', Icon: SearchChatIcon },
  { key: 'chat', label: 'Conversas', Icon: ChatIcon },
  { key: 'profile', label: 'Perfil', Icon: ProfileIcon },
];

type BottomNavBarProps = {
  activeIndex?: number;
  onPressItem?: (index: number, key: string) => void;
  style?: StyleProp<ViewStyle>;
};

export default function BottomNavBar({
  activeIndex = 0,
  onPressItem,
  style,
}: BottomNavBarProps) {
  return (
    <View style={[styles.bar, style]}>
      {ITEMS.map(({ key, label, Icon }, index) => {
        const isActive = index === activeIndex;

        return (
          <Pressable
            key={key}
            style={styles.item}
            onPress={() => onPressItem?.(index, key)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.iconSlot, isActive && styles.iconSlotActive]}>
              <Icon size={24} color={isActive ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: NAV_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: NAV_BAR_HEIGHT / 2,
    backgroundColor: '#FFFFFF',
    // Figma: dy 4, blur (stdDeviation) 9 -> shadowRadius 18, preto a 20%.
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotActive: {
    backgroundColor: ACTIVE_COLOR,
  },
});
