/**
 * Getup design tokens — "Linen & Ink".
 * Mirrors branding/tokens/tokens.json; keep the two in sync.
 */
export const palette = {
  linen50: '#FBF8F3',
  linen100: '#F5F1EA',
  linen200: '#EDE7DC',
  linen300: '#E2DACB',
  linen400: '#CFC4B1',
  stone500: '#8E867A',
  stone600: '#6B655C',
  ink700: '#3A3733',
  ink800: '#26231F',
  ink900: '#1C1B19',
  ink950: '#121110',
  sage300: '#B9C7B1',
  sage400: '#9DB096',
  sage500: '#7C9174',
  sage600: '#4F6249',
  sage700: '#46573F',
  clay300: '#F0A78A',
  clay400: '#E07A57',
  clay500: '#C9643F',
  clay600: '#B5583A', // logo sun (graphic)
  clay700: '#A24C31', // clay used as text (AA on linen)
  red500: '#B23A35',
  red400: '#E06A63',
  amber500: '#B7791F',
  amber400: '#E2A33F',
  sky500: '#4C7BA8',
  sky400: '#82A9CF',
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceSunken: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  border: string;
  borderStrong: string;
  primary: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  sun: string;
  sunSoft: string;
  danger: string;
  warning: string;
  info: string;
  overlay: string;
  tabBar: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  background: palette.linen100,
  surface: palette.linen50,
  surfaceAlt: palette.linen200,
  surfaceSunken: '#E9E2D5',
  text: palette.ink900,
  textMuted: '#5E5850',
  textSubtle: '#6F695F',
  border: palette.linen300,
  borderStrong: palette.linen400,
  primary: palette.ink900,
  onPrimary: palette.linen100,
  accent: palette.sage600,
  accentSoft: '#DCE3D6',
  onAccent: palette.linen50,
  sun: palette.clay700,
  sunSoft: '#F8E8DF',
  danger: palette.red500,
  warning: '#8C5A0C',
  info: '#3F6E99',
  overlay: 'rgba(28,27,25,0.45)',
  tabBar: 'rgba(251,248,243,0.94)',
  shadow: '#3A2E1F',
};

export const darkColors: ThemeColors = {
  background: palette.ink950,
  surface: '#1C1A18',
  surfaceAlt: palette.ink800,
  surfaceSunken: '#0C0B0A',
  text: '#F2EDE4',
  textMuted: '#A39B8F',
  textSubtle: '#8A8378',
  border: '#33302B',
  borderStrong: '#4A4640',
  primary: '#F2EDE4',
  onPrimary: palette.ink950,
  accent: palette.sage400,
  accentSoft: '#2A3327',
  onAccent: palette.ink950,
  sun: palette.clay400,
  sunSoft: '#3A2620',
  danger: palette.red400,
  warning: palette.amber400,
  info: palette.sky400,
  overlay: 'rgba(0,0,0,0.6)',
  tabBar: 'rgba(28,26,24,0.94)',
  shadow: '#000000',
};

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;
export const radius = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_400Regular_Italic',
  displayBold: 'Fraunces_700Bold',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16, letterSpacing: 0.1 },
  overline: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;

export type TypeVariant = keyof typeof type;

export const motion = {
  fast: 140,
  base: 220,
  slow: 360,
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
} as const;
