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
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import SakuraPetal from '@/components/SakuraPetal';
import { useAppStore } from '@/store/useAppStore';
import type { CoverTheme } from '@/store/types';

const THEMES: { key: CoverTheme; label: string; labelJa: string; bg: string; accent: string }[] = [
  { key: 'fluffy', label: 'Fluffy', labelJa: 'ふわふわ', bg: '#F5F0EB', accent: '#F9A8C9' },
  { key: 'leather', label: 'Leather', labelJa: 'かわ', bg: '#8B6340', accent: '#C4956A' },
  { key: 'spring', label: 'Spring', labelJa: 'はる', bg: '#FADADD', accent: '#A8D8EA' },
];

export default function CoverScreen() {
  const insets = useSafeAreaInsets();
  useWindowDimensions(); // keep for responsive re-renders
  const { settings, updateSettings } = useAppStore();
  const [selectedTheme, setSelectedTheme] = useState<CoverTheme>(settings.coverTheme);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const openAnim = useRef(new Animated.Value(0)).current;

  const theme = THEMES.find((t) => t.key === selectedTheme) ?? THEMES[0];

  const handleTap = useCallback(() => {
    updateSettings({ coverTheme: selectedTheme });
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.02, duration: 80, useNativeDriver: true }),
      Animated.timing(openAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      router.replace('/(tabs)');
    });
  }, [selectedTheme, updateSettings, scaleAnim, openAnim]);

  const handleSelectTheme = useCallback((t: CoverTheme) => {
    setSelectedTheme(t);
    updateSettings({ coverTheme: t });
  }, [updateSettings]);

  const coverRotate = openAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-20deg'],
  });

  const coverOpacity = openAnim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* Floating sakura */}
      {[30, 80, 150, 220, 300].map((x, i) => (
        <SakuraPetal key={i} x={x} size={14 + (i % 3) * 4} delay={i * 700} duration={3500 + i * 400} />
      ))}

      {/* Top tap hint */}
      <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.subtitleEn}>TAP TO OPEN</Text>
      </View>

      {/* Notebook Cover */}
      <TouchableOpacity onPress={handleTap} activeOpacity={0.9} style={styles.coverArea}>
        <Animated.View
          style={[
            styles.notebook,
            Shadow.large,
            {
              backgroundColor: theme.bg,
              transform: [{ scale: scaleAnim }, { rotateY: coverRotate }],
              opacity: coverOpacity,
            },
          ]}
        >
          {/* Spine */}
          <View style={[styles.notebookSpine, { backgroundColor: theme.accent }]} />

          {/* Texture lines */}
          {selectedTheme === 'leather' &&
            [0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={[styles.textureHoriz, { top: 40 + i * 22, backgroundColor: '#FFF5EB', opacity: 0.1 }]} />
            ))}

          {/* Stitch border */}
          <View style={[styles.stitchBorder, { borderColor: theme.accent }]} />

          {/* Cat mascot */}
          <View style={styles.catArea}>
            <Image
              source={require('@/assets/neko_notebook_reference.png')}
              style={styles.catImage}
              contentFit="contain"
            />
          </View>

          {/* Bottom decorations */}
          <View style={styles.bottomDecorations}>
            <Svg width={120} height={40} viewBox="0 0 120 40">
              {/* Clover */}
              <G transform="translate(10,10)">
                <Circle cx={10} cy={4} r={4} fill="#8BC34A" opacity={0.7} />
                <Circle cx={16} cy={10} r={4} fill="#8BC34A" opacity={0.7} />
                <Circle cx={4} cy={10} r={4} fill="#8BC34A" opacity={0.7} />
                <Circle cx={10} cy={16} r={4} fill="#8BC34A" opacity={0.7} />
              </G>
              {/* Sakura */}
              <G transform="translate(55,5)">
                <Path d="M10 0 C8 4 4 5 2 5 C4 7 4 9 2 11 C5 10 7 11 8 13 C9 11 11 10 14 11 C12 9 12 7 14 5 C12 5 12 4 10 0Z" fill="#FFB7C5" opacity={0.7} />
              </G>
              {/* Eggs */}
              <Ellipse cx={100} cy={22} rx={8} ry={10} fill="#A8D8EA" opacity={0.7} />
              <Ellipse cx={88} cy={26} rx={6} ry={8} fill="#F9A8C9" opacity={0.7} />
            </Svg>
          </View>

          {/* Corner decorations */}
          <View style={styles.cornerTopRight}>
            <Svg width={30} height={30} viewBox="0 0 30 30">
              <Path d="M5 25 Q15 5 25 5" stroke={theme.accent} strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
            </Svg>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Theme selector */}
      <View style={[styles.themeSelector, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.themeLabel}>Cover Theme / カバーテーマ</Text>
        <View style={styles.themeRow}>
          {THEMES.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => handleSelectTheme(t.key)}
              style={[
                styles.themeChip,
                { backgroundColor: t.bg, borderColor: t.accent },
                selectedTheme === t.key && styles.themeChipActive,
              ]}
            >
              <Text style={[styles.themeChipText, { color: t.key === 'leather' ? '#FFF5EB' : Colors.text }]}>
                {t.label}
              </Text>
              <Text style={[styles.themeChipJa, { color: t.accent }]}>{t.labelJa}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    gap: 4,
  },
  subtitleEn: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 4,
  },
  coverArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notebook: {
    width: 240,
    height: 310,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  notebookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 12,
    opacity: 0.8,
  },
  textureHoriz: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  stitchBorder: {
    position: 'absolute',
    left: 18,
    right: 8,
    top: 8,
    bottom: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  catArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 12,
  },
  catImage: {
    width: 200,
    height: 200,
  },
  bottomDecorations: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 8,
    alignItems: 'center',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  themeSelector: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
  },
  themeLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textLight,
    letterSpacing: 1,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 70,
  },
  themeChipActive: {
    ...Shadow.small,
  },
  themeChipText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  themeChipJa: {
    fontFamily: Fonts.regular,
    fontSize: 10,
  },
});
