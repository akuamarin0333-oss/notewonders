export const Colors = {
  background: '#FFF5F8',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF0F5',
  primary: '#F9A8C9',
  primaryDark: '#E8809E',
  accent: '#A8D8EA',
  accentDark: '#7CB9D1',
  accentGreen: '#B8E0B0',
  text: '#5C4A4A',
  textLight: '#8B7070',
  textMuted: '#B0909090',
  border: '#F5D0DC',
  sakura: '#FFB7C5',
  clover: '#8BC34A',
  ladybug: '#E53935',
  pageLine: '#E8D5DC',
  coverFluffy: '#F5F0EB',
  coverLeather: '#8B6340',
  coverSpring: '#FADADD',
  tabBar: '#FFFFFF',
  tabBarBorder: '#F5D0DC',
  favorite: '#FF6B9D',
  stamp: '#7B5EA7',
  error: '#E53935',
  white: '#FFFFFF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
} as const;

export const Shadow = {
  small: {
    shadowColor: '#F9A8C9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#5C4A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#5C4A4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
