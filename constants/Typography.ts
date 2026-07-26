import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Caveat_400Regular,
  Caveat_600SemiBold,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat';

export const FontMap = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Caveat_400Regular,
  Caveat_600SemiBold,
  Caveat_700Bold,
};

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  handwritten: 'Caveat_400Regular',
  handwrittenSemiBold: 'Caveat_600SemiBold',
  handwrittenBold: 'Caveat_700Bold',
} as const;

export type FontWeight = keyof typeof Fonts;
