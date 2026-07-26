import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import NekoEmoji from '@/components/NekoEmoji';
import type { CoverTheme, FontStyle, Language } from '@/store/types';

const COVER_THEMES: { key: CoverTheme; label: string; labelJa: string; bg: string; accent: string }[] = [
  { key: 'fluffy', label: 'Fluffy', labelJa: 'ふわふわ', bg: '#F5F0EB', accent: '#F9A8C9' },
  { key: 'leather', label: 'Leather', labelJa: 'かわ', bg: '#8B6340', accent: '#C4956A' },
  { key: 'spring', label: 'Spring', labelJa: 'はる', bg: '#FADADD', accent: '#A8D8EA' },
];

const FONT_STYLES: { key: FontStyle; label: string; labelJa: string; preview: string }[] = [
  { key: 'handwritten', label: 'Handwritten', labelJa: 'てがき', preview: 'Spring notes~' },
  { key: 'clean', label: 'Clean', labelJa: 'すっきり', preview: 'Spring notes' },
  { key: 'playful', label: 'Playful', labelJa: 'たのしい', preview: 'Spring notes!' },
];

const LANGUAGES: { key: Language; label: string; flag: string }[] = [
  { key: 'en', label: 'English', flag: 'EN' },
  { key: 'ja', label: '日本語', flag: 'JA' },
];

function SectionHeader({ title, titleJa }: { title: string; titleJa: string }) {
  return (
    <View style={sStyles.sectionHeader}>
      <Text style={sStyles.sectionTitle}>{title}</Text>
      <Text style={sStyles.sectionTitleJa}>{titleJa}</Text>
    </View>
  );
}

const sStyles = StyleSheet.create({
  sectionHeader: { marginBottom: Spacing.sm, marginTop: Spacing.md },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitleJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 12,
    color: Colors.primary,
  },
});

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useAppStore();

  const handleCoverTheme = useCallback(
    (key: CoverTheme) => updateSettings({ coverTheme: key }),
    [updateSettings]
  );

  const handleFontStyle = useCallback(
    (key: FontStyle) => updateSettings({ fontStyle: key }),
    [updateSettings]
  );

  const handleLanguage = useCallback(
    (key: Language) => updateSettings({ language: key }),
    [updateSettings]
  );

  const handleSpringToggle = useCallback(
    (val: boolean) => updateSettings({ springTheme: val }),
    [updateSettings]
  );

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.titleJa}>せってい</Text>
          </View>
          <NekoEmoji size={56} mood="happy" />
        </View>

        {/* Cover Theme */}
        <SectionHeader title="Cover Theme" titleJa="カバーテーマ" />
        <View style={[styles.card, Shadow.small]}>
          <View style={styles.coverThemeRow}>
            {COVER_THEMES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => handleCoverTheme(t.key)}
                style={[
                  styles.coverChip,
                  { backgroundColor: t.bg, borderColor: t.accent },
                  settings.coverTheme === t.key && styles.coverChipActive,
                ]}
              >
                {settings.coverTheme === t.key && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={14} color={t.accent} />
                  </View>
                )}
                <View style={[styles.coverSpine, { backgroundColor: t.accent }]} />
                <Text style={[styles.coverChipLabel, { color: t.key === 'leather' ? '#FFF5EB' : Colors.text }]}>
                  {t.label}
                </Text>
                <Text style={[styles.coverChipLabelJa, { color: t.accent }]}>{t.labelJa}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Font Style */}
        <SectionHeader title="Font Style" titleJa="フォントスタイル" />
        <View style={[styles.card, Shadow.small]}>
          {FONT_STYLES.map((f, i) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => handleFontStyle(f.key)}
              style={[
                styles.fontRow,
                i < FONT_STYLES.length - 1 && styles.fontRowBorder,
                settings.fontStyle === f.key && styles.fontRowActive,
              ]}
            >
              <View style={styles.fontInfo}>
                <Text style={[styles.fontLabel, { fontFamily: f.key === 'handwritten' ? Fonts.handwrittenBold : f.key === 'playful' ? Fonts.handwrittenSemiBold : Fonts.bold }]}>
                  {f.label}
                </Text>
                <Text style={styles.fontLabelJa}>{f.labelJa}</Text>
              </View>
              <Text
                style={[
                  styles.fontPreview,
                  { fontFamily: f.key === 'handwritten' ? Fonts.handwritten : f.key === 'playful' ? Fonts.handwrittenSemiBold : Fonts.regular },
                ]}
              >
                {f.preview}
              </Text>
              {settings.fontStyle === f.key && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Seasonal Theme */}
        <SectionHeader title="Seasonal Theme" titleJa="きせつのテーマ" />
        <View style={[styles.card, Shadow.small]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="flower-outline" size={20} color={Colors.sakura} />
              <View>
                <Text style={styles.toggleLabel}>Spring Theme</Text>
                <Text style={styles.toggleLabelJa}>はるのテーマ（桜とクローバー）</Text>
              </View>
            </View>
            <Switch
              value={settings.springTheme}
              onValueChange={handleSpringToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Language */}
        <SectionHeader title="Language" titleJa="言語" />
        <View style={[styles.card, Shadow.small]}>
          <View style={styles.langRow}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.key}
                onPress={() => handleLanguage(l.key)}
                style={[
                  styles.langChip,
                  settings.language === l.key && styles.langChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.langFlag,
                    { color: settings.language === l.key ? Colors.white : Colors.textLight },
                  ]}
                >
                  {l.flag}
                </Text>
                <Text
                  style={[
                    styles.langLabel,
                    { color: settings.language === l.key ? Colors.white : Colors.text },
                  ]}
                >
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App info */}
        <SectionHeader title="About" titleJa="アプリについて" />
        <View style={[styles.card, Shadow.small]}>
          <View style={styles.aboutRow}>
            <NekoEmoji size={40} mood="love" />
            <View style={styles.aboutInfo}>
              <Text style={styles.appName}>Neko Notebook</Text>
              <Text style={styles.appNameJa}>ねこノート</Text>
              <Text style={styles.appVersion}>Spring Edition v1.0</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 30,
    color: Colors.text,
  },
  titleJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 16,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  coverThemeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  coverChip: {
    flex: 1,
    padding: Spacing.sm,
    paddingLeft: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    position: 'relative',
    minHeight: 80,
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  coverChipActive: {
    ...Shadow.small,
  },
  coverSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    opacity: 0.8,
  },
  coverChipLabel: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 14,
  },
  coverChipLabelJa: {
    fontFamily: Fonts.regular,
    fontSize: 10,
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  fontRowBorder: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  fontRowActive: {
    backgroundColor: '#FFF5F8',
    borderRadius: BorderRadius.md,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  fontInfo: { gap: 2 },
  fontLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  fontLabelJa: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.textLight,
  },
  fontPreview: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'right',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  toggleLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.text,
  },
  toggleLabelJa: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.textLight,
  },
  langRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  langChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  langChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  langFlag: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  langLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aboutInfo: { gap: 2 },
  appName: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 20,
    color: Colors.text,
  },
  appNameJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 16,
    color: Colors.primary,
  },
  appVersion: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textLight,
  },
});
