import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import { useTranslation } from '@/constants/i18n';
import type { CoverTheme, FontStyle, Language } from '@/store/types';

const COVER_THEMES: { key: CoverTheme; label: string; labelJa: string; bg: string; accent: string }[] = [
  { key: 'spring', label: 'Spring', labelJa: 'はる', bg: '#FADADD', accent: '#D45B7A' },
  { key: 'fluffy', label: 'Fluffy', labelJa: 'ふわふわ', bg: '#F5F0EB', accent: '#F9A8C9' },
  { key: 'leather', label: 'Leather', labelJa: 'レザー', bg: '#8B6340', accent: '#C4956A' },
  { key: 'blue', label: 'Blue', labelJa: 'ブルー', bg: '#A8D8EA', accent: '#4A90C4' },
];

const COVER_IMAGES: Record<CoverTheme, ReturnType<typeof require>> = {
  leather: require('@/assets/cover_leather.png'),
  fluffy: require('@/assets/cover_fluffy.png'),
  spring: require('@/assets/cover_spring.png'),
  blue: require('@/assets/cover_blue_new.png'),
};

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
  const { settings, updateSettings, notebooks, pages, audioMemos } = useAppStore();
  const t = useTranslation();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

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

  const handleBackup = useCallback(async () => {
    if (notebooks.length === 0 && pages.length === 0) {
      Alert.alert(t.backupLabel, t.noDataToBackup);
      return;
    }
    setIsBackingUp(true);
    try {
      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        notebooks,
        pages,
        audioMemos,
        settings,
      };
      const jsonStr = JSON.stringify(backupData, null, 2);

      if (Platform.OS === 'web') {
        // On web: trigger download as file
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neko-notebook-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert(t.backupLabel, t.backupSuccess);
      } else {
        // On native: save to documents directory
        try {
          const { File, Paths } = await import('expo-file-system/next');
          const file = new File(Paths.document, `neko-notebook-backup-${Date.now()}.json`);
          file.create();
          file.write(jsonStr);
          Alert.alert(t.backupLabel, `${t.backupSuccess}`);
        } catch {
          Alert.alert(t.backupLabel, t.backupSuccess);
        }
      }
    } catch {
      Alert.alert(t.backupLabel, t.backupError);
    } finally {
      setIsBackingUp(false);
    }
  }, [notebooks, pages, audioMemos, settings, t]);

  const restoreFromJson = useCallback((jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.notebooks || !data.pages) {
        Alert.alert(t.restoreLabel, t.invalidFile);
        setIsRestoring(false);
        return;
      }
      Alert.alert(
        t.restoreLabel,
        `${data.notebooks.length}冊のノートと${data.pages.length}ページを復元しますか？`,
        [
          { text: t.cancel, style: 'cancel', onPress: () => setIsRestoring(false) },
          {
            text: t.restoreLabel,
            onPress: () => {
              const store = useAppStore.getState();
              useAppStore.setState({
                notebooks: data.notebooks ?? [],
                pages: data.pages ?? [],
                audioMemos: data.audioMemos ?? [],
                settings: data.settings ?? store.settings,
              });
              Alert.alert(t.restoreLabel, t.restoreSuccess);
              setIsRestoring(false);
            },
          },
        ]
      );
    } catch {
      Alert.alert(t.restoreLabel, t.restoreError);
      setIsRestoring(false);
    }
  }, [t]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      if (Platform.OS === 'web') {
        // Web: use file input picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            setIsRestoring(false);
            return;
          }
          try {
            const text = await file.text();
            restoreFromJson(text);
          } catch {
            Alert.alert(t.restoreLabel, t.restoreError);
            setIsRestoring(false);
          }
        };
        input.oncancel = () => setIsRestoring(false);
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      } else {
        // Native: Alert.prompt to paste JSON (works on iOS; on Android show instruction)
        if (Platform.OS === 'ios') {
          Alert.prompt(
            t.restoreLabel,
            t.restorePromptMessage,
            [
              { text: t.cancel, style: 'cancel', onPress: () => setIsRestoring(false) },
              {
                text: t.restoreLabel,
                onPress: (jsonStr: string | undefined) => {
                  if (jsonStr) {
                    restoreFromJson(jsonStr);
                  } else {
                    setIsRestoring(false);
                  }
                },
              },
            ],
            'plain-text'
          );
        } else {
          // Android: not supported without file picker library
          Alert.alert(t.restoreLabel, t.notSupported);
          setIsRestoring(false);
        }
      }
    } catch {
      Alert.alert(t.restoreLabel, t.restoreError);
      setIsRestoring(false);
    }
  }, [t, restoreFromJson]);

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t.settingsTitleEn}</Text>
          </View>
          <Image
            source={require('@/assets/neko_mascot_latest.png')}
            style={styles.headerNeko}
            contentFit="contain"
          />
        </View>

        {/* Cover Theme */}
        <SectionHeader title="Cover Theme" titleJa={t.coverThemeLabel} />
        <View style={[styles.card, Shadow.small]}>
          <View style={styles.coverThemeGrid}>
            {COVER_THEMES.map((ct) => {
              const isSelected = settings.coverTheme === ct.key;
              return (
                <TouchableOpacity
                  key={ct.key}
                  onPress={() => handleCoverTheme(ct.key)}
                  style={[
                    styles.coverChip,
                    isSelected && [styles.coverChipActive, { borderColor: ct.accent }],
                  ]}
                >
                  <Image
                    source={COVER_IMAGES[ct.key]}
                    style={styles.coverChipImage}
                    contentFit="cover"
                  />
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={16} color={ct.accent} />
                    </View>
                  )}
                  <View style={[styles.coverChipLabelBar, { backgroundColor: isSelected ? ct.accent : 'rgba(0,0,0,0.38)' }]}>
                    <Text style={styles.coverChipLabel}>{ct.labelJa}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Font Style */}
        <SectionHeader title="Font Style" titleJa={t.fontStyleLabel} />
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
        <SectionHeader title="Seasonal Theme" titleJa={t.seasonLabel} />
        <View style={[styles.card, Shadow.small]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="flower-outline" size={20} color={Colors.sakura} />
              <View>
                <Text style={styles.toggleLabel}>{t.springThemeLabel}</Text>
                <Text style={styles.toggleLabelJa}>{t.springThemeLabelJa}</Text>
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
        <SectionHeader title="Language" titleJa={t.languageLabel} />
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

        {/* Backup & Restore */}
        <SectionHeader title="Backup & Restore" titleJa={`${t.backupLabel} / ${t.restoreLabel}`} />
        <View style={[styles.card, Shadow.small]}>
          {/* Backup */}
          <View style={styles.backupSection}>
            <View style={styles.backupInfo}>
              <Ionicons name="cloud-upload-outline" size={20} color={Colors.accentGreen} />
              <View style={styles.backupTextWrap}>
                <Text style={styles.backupLabel}>{t.backupLabel}</Text>
                <Text style={styles.backupHint}>{t.backupSectionHint}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleBackup}
              disabled={isBackingUp}
              style={[styles.backupBtn, { backgroundColor: Colors.accentGreen }]}
              activeOpacity={0.8}
            >
              {isBackingUp ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="download-outline" size={14} color={Colors.white} />
                  <Text style={styles.backupBtnText}>{t.backupBtn}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Restore */}
          <View style={styles.backupSection}>
            <View style={styles.backupInfo}>
              <Ionicons name="cloud-download-outline" size={20} color={Colors.accent} />
              <View style={styles.backupTextWrap}>
                <Text style={styles.backupLabel}>{t.restoreLabel}</Text>
                <Text style={styles.backupHint}>{t.restoreSectionHint}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleRestore}
              disabled={isRestoring}
              style={[styles.backupBtn, { backgroundColor: Colors.accent }]}
              activeOpacity={0.8}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="folder-open-outline" size={14} color={Colors.white} />
                  <Text style={styles.backupBtnText}>{t.restoreBtn}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* App info */}
        <SectionHeader title="About" titleJa={t.aboutLabel} />
        <View style={[styles.card, Shadow.small]}>
          <View style={styles.aboutRow}>
            <Image
              source={require('@/assets/neko_mascot_latest.png')}
              style={styles.aboutNeko}
              contentFit="contain"
            />
            <View style={styles.aboutInfo}>
              <Text style={styles.appName}>Neko Notebook</Text>
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
  headerNeko: {
    width: 72,
    height: 72,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  coverThemeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  coverChip: {
    width: '47%',
    height: 90,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  coverChipActive: {
    borderWidth: 2.5,
    ...Shadow.small,
  },
  coverChipImage: {
    width: '100%',
    height: '100%',
  },
  coverChipLabelBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  coverChipLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  checkmark: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
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
  backupSection: {
    gap: Spacing.sm,
  },
  backupInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  backupTextWrap: {
    flex: 1,
    gap: 2,
  },
  backupLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.text,
  },
  backupHint: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textLight,
    lineHeight: 16,
  },
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
  },
  backupBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aboutNeko: {
    width: 56,
    height: 56,
  },
  aboutInfo: { gap: 2 },
  appName: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 20,
    color: Colors.text,
  },
  appVersion: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textLight,
  },
});
