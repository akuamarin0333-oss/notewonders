import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { Colors, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import SakuraPetal from '@/components/SakuraPetal';
import { useAppStore } from '@/store/useAppStore';
import type { CoverTheme } from '@/store/types';

const THEMES: {
  key: CoverTheme;
  label: string;
  labelJa: string;
  bg: string;
  accent: string;
}[] = [
  { key: 'spring', label: 'Spring', labelJa: 'はる', bg: '#FADADD', accent: '#D45B7A' },
  { key: 'fluffy', label: 'Fluffy', labelJa: 'ふわふわ', bg: '#F5F0EB', accent: '#F9A8C9' },
  { key: 'leather', label: 'Leather', labelJa: 'レザー', bg: '#8B6340', accent: '#C4956A' },
  { key: 'blue', label: 'Blue', labelJa: 'ブルー', bg: '#A8D8EA', accent: '#4A90C4' },
];

// Cover background colors for the main cover display
const COVER_BG: Record<CoverTheme, string> = {
  leather: '#8B6340',
  fluffy: '#F5F0EB',
  spring: '#FADADD',
  blue: '#A8D8EA',
};

const COVER_IMAGES: Record<CoverTheme, number> = {
  leather: require('@/assets/cover_leather_new.png'),
  fluffy: require('@/assets/cover_fluffy_new.png'),
  spring: require('@/assets/cover_spring_new.png'),
  blue: require('@/assets/cover_blue_new.png'),
};

function PawSvg({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Ellipse cx={16} cy={22} rx={7} ry={5.5} fill={color} />
      <Circle cx={8.5} cy={13.5} r={3.5} fill={color} />
      <Circle cx={16} cy={11} r={3.5} fill={color} />
      <Circle cx={23.5} cy={13.5} r={3.5} fill={color} />
      <Ellipse cx={12} cy={22} rx={1.8} ry={2.2} fill="rgba(255,255,255,0.45)" />
      <Ellipse cx={16} cy={24} rx={1.8} ry={2.2} fill="rgba(255,255,255,0.45)" />
      <Ellipse cx={20} cy={22} rx={1.8} ry={2.2} fill="rgba(255,255,255,0.45)" />
    </Svg>
  );
}

function SakuraSvg({ color = '#FFB7C5', size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2C9.5 5 7 6 5 6c2 2 2 4 0 6 2.5-1 4.5 0 5.5 2 1-2 3-3 5.5-2-2-2-2-4 0-6-2 0-4.5-1-4-4z"
        fill={color}
      />
      <Circle cx={12} cy={9} r={2} fill="rgba(255,255,255,0.6)" />
    </Svg>
  );
}

export default function CoverScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { settings, updateSettings } = useAppStore();
  const [selectedTheme, setSelectedTheme] = useState<CoverTheme>(settings.coverTheme);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const openAnim = useRef(new Animated.Value(0)).current;

  const theme = THEMES.find((t) => t.key === selectedTheme) ?? THEMES[1];
  const isLeather = selectedTheme === 'leather';
  const textColor = isLeather ? '#FFF5EB' : Colors.text;
  const mutedColor = isLeather ? 'rgba(255,245,235,0.6)' : Colors.textLight;
  const bgColor = COVER_BG[selectedTheme];

  const handleTap = useCallback(() => {
    updateSettings({ coverTheme: selectedTheme });
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.02, duration: 80, useNativeDriver: true }),
      Animated.timing(openAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
    ]).start(() => {
      router.replace('/(tabs)');
    });
  }, [selectedTheme, updateSettings, scaleAnim, openAnim]);

  const handleSelectTheme = useCallback((t: CoverTheme) => {
    setSelectedTheme(t);
    updateSettings({ coverTheme: t });
  }, [updateSettings]);

  const coverOpacity = openAnim.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });
  const coverScale = Animated.multiply(
    scaleAnim,
    openAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] })
  );

  return (
    <View style={[styles.root, { backgroundColor: '#FFF5F8' }]}>
      {/* Floating sakura petals */}
      {[18, 65, 130, 200, 270, 320].map((x, i) => (
        <SakuraPetal key={i} x={x} size={11 + (i % 3) * 4} delay={i * 550} duration={3000 + i * 420} />
      ))}

      <Animated.View
        style={[
          styles.coverContainer,
          {
            opacity: coverOpacity,
            transform: [{ scale: coverScale }],
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 10,
            minHeight: height,
            backgroundColor: bgColor,
          },
        ]}
      >
        {/* Leather texture lines */}
        {isLeather && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} style={[styles.leatherLine, { top: 60 + i * 60 }]} />
        ))}

        {/* Stitch border */}
        <View
          style={[
            styles.stitchBorder,
            { borderColor: isLeather ? 'rgba(255,245,235,0.3)' : theme.accent },
            { top: insets.top + 14, bottom: insets.bottom + 14 },
          ]}
        />

        {/* Scattered sakura decorations */}
        <View style={[styles.decor, { top: insets.top + 22, left: 28 }]} pointerEvents="none">
          <SakuraSvg color={theme.accent} size={16} />
        </View>
        <View style={[styles.decor, { top: insets.top + 30, right: 40 }]} pointerEvents="none">
          <SakuraSvg color={theme.accent} size={12} />
        </View>
        <View style={[styles.decor, { top: insets.top + 55, right: 22 }]} pointerEvents="none">
          <SakuraSvg color={theme.accent} size={18} />
        </View>

        {/* Spacer */}
        <View style={styles.titleSpacer} />

        {/* Cat mascot */}
        <View style={styles.catSection}>
          <Image
            source={require('@/assets/neko_mascot_latest.png')}
            style={styles.catImage}
            contentFit="contain"
          />
        </View>

        {/* Open Notebook CTA */}
        <TouchableOpacity onPress={handleTap} style={styles.openBtnRow} activeOpacity={0.75}>
          <Text style={[styles.openBtnText, { color: textColor }]}>Open Notebook</Text>
          <PawSvg color={theme.accent} size={20} />
        </TouchableOpacity>

        {/* カバーをえらぶ section */}
        <View style={styles.themeSection}>
          <Text style={[styles.themeSectionLabel, { color: mutedColor }]}>カバーをえらぶ</Text>
          <View style={styles.themeRow}>
            {THEMES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => handleSelectTheme(t.key)}
                style={styles.themeChipWrap}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.themeChip,
                    selectedTheme === t.key
                      ? [styles.themeChipSelected, { borderColor: t.accent, shadowColor: t.accent }]
                      : { borderColor: 'rgba(92,74,74,0.2)' },
                  ]}
                >
                  {/* Cover image thumbnail */}
                  <Image
                    source={COVER_IMAGES[t.key]}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                  />
                  {selectedTheme === t.key && (
                    <View style={styles.themeChipCheck}>
                      <Svg width={14} height={14} viewBox="0 0 24 24">
                        <Circle cx={12} cy={12} r={12} fill={t.accent} />
                        <Path d="M7 12 L10 15 L17 8" stroke="white" strokeWidth={2.5} strokeLinecap="round" />
                      </Svg>
                    </View>
                  )}
                </View>
                <Text style={[styles.themeChipLabel, { color: mutedColor }]}>{t.labelJa}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  coverContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  leatherLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,245,235,0.12)',
  },
  stitchBorder: {
    position: 'absolute',
    left: 18,
    right: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.xl,
    opacity: 0.5,
    zIndex: 0,
  },
  decor: {
    position: 'absolute',
    zIndex: 1,
  },
  titleSpacer: {
    height: 24,
    zIndex: 2,
  },
  catSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  catImage: {
    width: 240,
    height: 240,
  },
  openBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    zIndex: 2,
  },
  openBtnText: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 22,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  themeSection: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    zIndex: 2,
    marginBottom: 8,
  },
  themeSectionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 14,
  },
  themeChipWrap: {
    alignItems: 'center',
    gap: 6,
  },
  themeChip: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
    position: 'relative',
  },
  themeChipSelected: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  themeChipCheck: {
    position: 'absolute',
    bottom: 3,
    right: 3,
  },
  themeChipLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
