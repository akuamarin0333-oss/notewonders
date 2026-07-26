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

const THEMES: { key: CoverTheme; label: string; bg: string; accent: string; pawColor: string }[] = [
  { key: 'fluffy', label: 'Fluffy', bg: '#F5F0EB', accent: '#F9A8C9', pawColor: '#F9A8C9' },
  { key: 'leather', label: 'Leather', bg: '#8B6340', accent: '#C4956A', pawColor: '#C4956A' },
  { key: 'spring', label: 'Spring', bg: '#FADADD', accent: '#A8D8EA', pawColor: '#A8D8EA' },
];

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

function CloverSvg({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={14} cy={14} r={7} fill="#8BC34A" opacity={0.85} />
      <Circle cx={26} cy={14} r={7} fill="#8BC34A" opacity={0.85} />
      <Circle cx={14} cy={26} r={7} fill="#8BC34A" opacity={0.85} />
      <Circle cx={26} cy={26} r={7} fill="#8BC34A" opacity={0.85} />
      <Path d="M20 38 L20 20" stroke="#5D8A2A" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function LadybugSvg({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Ellipse cx={20} cy={24} rx={13} ry={11} fill="#E53935" />
      <Path d="M20 13 C13 13 7 18 7 24 Q7 16 20 13Z" fill="#1a1a1a" />
      <Path d="M20 13 C27 13 33 18 33 24 Q33 16 20 13Z" fill="#1a1a1a" />
      <Path d="M20 13 L20 35" stroke="#1a1a1a" strokeWidth={2} />
      <Circle cx={13} cy={24} r={3.5} fill="#1a1a1a" />
      <Circle cx={27} cy={24} r={3.5} fill="#1a1a1a" />
      <Circle cx={13} cy={31} r={2.5} fill="#1a1a1a" />
      <Circle cx={27} cy={31} r={2.5} fill="#1a1a1a" />
      <Circle cx={20} cy={11} r={4} fill="#1a1a1a" />
      <Circle cx={18} cy={10} r={1} fill="#E53935" />
      <Circle cx={22} cy={10} r={1} fill="#E53935" />
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

  const theme = THEMES.find((t) => t.key === selectedTheme) ?? THEMES[0];
  const isLeather = selectedTheme === 'leather';
  const textColor = isLeather ? '#FFF5EB' : Colors.text;
  const mutedColor = isLeather ? 'rgba(255,245,235,0.6)' : Colors.textLight;

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
            backgroundColor: theme.bg,
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

        {/* Title section */}
        <View style={styles.titleSection}>
          <Text style={[styles.titleEn, { color: textColor }]}>Neko Notebook</Text>
          <Text style={[styles.titleJa, { color: theme.accent }]}>ねこノート</Text>
          {/* Edition badge */}
          <View style={[styles.editionBadge, { borderColor: theme.accent }]}>
            <Text style={[styles.editionEn, { color: textColor }]}>SPRING EDITION</Text>
            <Text style={[styles.editionJa, { color: theme.accent }]}>春の限定版</Text>
          </View>
        </View>

        {/* Cat mascot */}
        <View style={styles.catSection}>
          <Image
            source={require('@/assets/neko_cat_mascot.png')}
            style={styles.catImage}
            contentFit="contain"
          />
          {/* Clover bottom left */}
          <View style={styles.cloverDecor} pointerEvents="none">
            <CloverSvg size={36} />
          </View>
          {/* Ladybug bottom right */}
          <View style={styles.ladybugDecor} pointerEvents="none">
            <LadybugSvg size={28} />
          </View>
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
                    { backgroundColor: t.bg },
                    selectedTheme === t.key
                      ? [styles.themeChipSelected, { borderColor: t.accent, shadowColor: t.accent }]
                      : { borderColor: 'rgba(92,74,74,0.12)' },
                  ]}
                >
                  {t.key === 'spring' ? (
                    <SakuraSvg color={t.accent} size={26} />
                  ) : (
                    <PawSvg color={t.pawColor} size={26} />
                  )}
                </View>
                <Text style={[styles.themeChipLabel, { color: mutedColor }]}>{t.label}</Text>
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
  titleSection: {
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
    zIndex: 2,
  },
  titleEn: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 34,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  titleJa: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 22,
    letterSpacing: 3,
  },
  editionBadge: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderWidth: 1.2,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    gap: 1,
  },
  editionEn: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
    letterSpacing: 2.5,
  },
  editionJa: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    letterSpacing: 1,
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
  cloverDecor: {
    position: 'absolute',
    bottom: 4,
    left: 0,
  },
  ladybugDecor: {
    position: 'absolute',
    bottom: 8,
    right: 10,
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
    gap: 20,
  },
  themeChipWrap: {
    alignItems: 'center',
    gap: 6,
  },
  themeChip: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  themeChipSelected: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  themeChipLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
