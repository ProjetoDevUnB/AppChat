import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { REGION_COLORS, STAT_CARD_SHADOW } from './theme';

type StatCardProps = {
  title: string;
  children: ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

export default function StatCard({ title, children, titleStyle, style }: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {children}
    </View>
  );
}

type StatSourceProps = {
  children: string;
  tone?: 'body' | 'muted';
  style?: StyleProp<TextStyle>;
};

export function StatSource({ children, tone = 'body', style }: StatSourceProps) {
  return (
    <Text style={[styles.source, { color: REGION_COLORS[tone] }, style]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    paddingTop: 13,
    paddingBottom: 17,
    paddingHorizontal: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: REGION_COLORS.border,
    backgroundColor: REGION_COLORS.surface,
    ...STAT_CARD_SHADOW,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 24,
    color: REGION_COLORS.title,
  },
  source: {
    fontFamily: 'Inter_400Regular',
    fontSize: 8,
    lineHeight: 15,
  },
});
