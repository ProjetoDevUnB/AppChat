// Cores e medidas repetidas pelas telas do fórum. O resto do app usa hex
// soltos em cada StyleSheet; aqui elas se repetem por 4 telas e 6 componentes,
// e um valor divergente salta aos olhos no card errado.
export const FORUM_COLORS = {
  background: '#FEF8F8',
  surface: '#FFFFFF',
  accent: '#E86E97',
  accentDark: '#832D51',
  accentSoft: '#FCE4EF',
  olive: '#7F8D18',
  oliveDark: '#596422',
  title: '#1A1A1A',
  body: '#888888',
  muted: '#AAAAAA',
  border: '#EEEEEE',
  borderStrong: '#CCCCCC',
  field: '#EEEEEE',
  danger: '#BA1A1A',
} as const;

export const CARD_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 18,
  elevation: 3,
} as const;
