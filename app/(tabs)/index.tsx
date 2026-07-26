import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { useAppStore } from '@/store/useAppStore';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import type { CoverTheme, Notebook } from '@/store/types';

const COVER_THEMES: { key: CoverTheme; label: string }[] = [
  { key: 'fluffy', label: 'Fluffy' },
  { key: 'leather', label: 'Leather' },
  { key: 'spring', label: 'Spring' },
];

const COVER_COLORS: Record<CoverTheme, { bg: string; accent: string; spine: string; text: string }> = {
  fluffy: { bg: '#F5F0EB', accent: '#F9A8C9', spine: '#E8C9D5', text: '#5C4A4A' },
  leather: { bg: '#8B6340', accent: '#C4956A', spine: '#6B4D30', text: '#FFF5EB' },
  spring: { bg: '#FADADD', accent: '#A8D8EA', spine: '#C9E8F0', text: '#5C4A4A' },
};

function PawSvg({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Ellipse cx={16} cy={22} rx={7} ry={5.5} fill={color} />
      <Circle cx={8.5} cy={13.5} r={3.5} fill={color} />
      <Circle cx={16} cy={11} r={3.5} fill={color} />
      <Circle cx={23.5} cy={13.5} r={3.5} fill={color} />
    </Svg>
  );
}

function SakuraSvg({ color = '#FFB7C5', size = 13 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2C9.5 5 7 6 5 6c2 2 2 4 0 6 2.5-1 4.5 0 5.5 2 1-2 3-3 5.5-2-2-2-2-4 0-6-2 0-4.5-1-4-4z"
        fill={color}
      />
    </Svg>
  );
}

function NotebookCard({
  notebook,
  pageCount,
  onPress,
  onLongPress,
}: {
  notebook: Notebook;
  pageCount: number;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const c = COVER_COLORS[notebook.coverTheme] ?? COVER_COLORS.fluffy;
  const lastEdited = new Date(notebook.lastEdited);
  const dateStr = lastEdited.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.82}
      style={[styles.card, Shadow.medium]}
    >
      <View style={[styles.cardCover, { backgroundColor: c.bg }]}>
        {/* Spine */}
        <View style={[styles.cardSpine, { backgroundColor: c.spine }]} />
        {/* Clasp */}
        <View style={[styles.cardClasp, { backgroundColor: c.accent }]} />

        {/* Decoration inside card */}
        <View style={styles.cardDecorTop}>
          {notebook.coverTheme === 'spring' ? (
            <SakuraSvg color={c.accent} size={22} />
          ) : notebook.coverTheme === 'leather' ? (
            <PawSvg color={c.accent} size={22} />
          ) : (
            <SakuraSvg color={c.accent} size={22} />
          )}
        </View>
        {/* Ladybug for fluffy, paw for leather, clover for spring */}
        <View style={styles.cardDecorBottom}>
          {notebook.coverTheme === 'spring' ? (
            <Svg width={18} height={18} viewBox="0 0 40 40">
              <Circle cx={14} cy={14} r={7} fill="#8BC34A" opacity={0.8} />
              <Circle cx={26} cy={14} r={7} fill="#8BC34A" opacity={0.8} />
              <Circle cx={14} cy={26} r={7} fill="#8BC34A" opacity={0.8} />
              <Circle cx={26} cy={26} r={7} fill="#8BC34A" opacity={0.8} />
            </Svg>
          ) : (
            <Svg width={18} height={18} viewBox="0 0 40 40">
              <Ellipse cx={20} cy={26} rx={13} ry={10} fill="#E53935" />
              <Path d="M20 16 C13 16 7 21 7 26 Q7 18 20 16Z" fill="#1a1a1a" />
              <Path d="M20 16 C27 16 33 21 33 26 Q33 18 20 16Z" fill="#1a1a1a" />
              <Path d="M20 16 L20 36" stroke="#1a1a1a" strokeWidth={2} />
              <Circle cx={13} cy={26} r={3} fill="#1a1a1a" />
              <Circle cx={27} cy={26} r={3} fill="#1a1a1a" />
            </Svg>
          )}
        </View>

        {/* Stitch border */}
        <View style={[styles.cardStitch, { borderColor: notebook.coverTheme === 'leather' ? 'rgba(255,245,235,0.25)' : c.accent }]} />
      </View>

      {/* Card info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{notebook.title || 'Untitled'}</Text>
          <TouchableOpacity
            onPress={onLongPress}
            style={styles.cardMenuBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-vertical" size={14} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
        <Text style={styles.cardMeta}>{pageCount}ページ</Text>
        <Text style={styles.cardDate}>{dateStr} 更新</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { notebooks, pages, addNotebook, deleteNotebook } = useAppStore();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTheme, setNewTheme] = useState<CoverTheme>('fluffy');
  const [isCreating, setIsCreating] = useState(false);

  const getPageCount = useCallback(
    (notebookId: string) => pages.filter((p) => p.notebookId === notebookId).length,
    [pages]
  );

  const handleOpenNotebook = useCallback((id: string) => {
    router.push(`/notebook/${id}`);
  }, []);

  const handleDeleteNotebook = useCallback(
    (id: string, title: string) => {
      Alert.alert(
        'ノートを削除',
        `「${title}」を削除しますか？元に戻せません。`,
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '削除', style: 'destructive', onPress: () => deleteNotebook(id) },
        ]
      );
    },
    [deleteNotebook]
  );

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const notebook = addNotebook(newTitle.trim(), newTheme);
      setShowNewModal(false);
      setNewTitle('');
      setNewTheme('fluffy');
      router.push(`/notebook/${notebook.id}`);
    } finally {
      setIsCreating(false);
    }
  }, [newTitle, newTheme, addNotebook]);

  const greetings = useMemo(
    () => ['こんにちは！今日も いい日だにゃ〜', '何を書く？楽しみだにゃ！', 'はるの おさんぽ日和だにゃ〜'],
    []
  );
  const greeting = useMemo(
    () => greetings[notebooks.length % greetings.length],
    [notebooks.length, greetings]
  );

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Neko Notebook</Text>
            <Text style={styles.headerJa}>ねこノート</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/(tabs)/settings')}>
            <Ionicons name="settings-outline" size={22} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Mascot + greeting */}
        <View style={styles.mascotRow}>
          <Image
            source={require('@/assets/neko_new_mascot.png')}
            style={styles.mascotImage}
            contentFit="contain"
          />
          <View style={styles.greetingBubble}>
            <View style={styles.greetingTail} />
            <Text style={styles.greetingText}>{greeting}</Text>
            <SakuraSvg color={Colors.primary} size={13} />
          </View>
        </View>

        {/* Notebook grid */}
        {notebooks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>まだノートがありません</Text>
            <Text style={styles.emptySubtitle}>下のボタンでノートを作ってみよう！</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {notebooks.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                pageCount={getPageCount(nb.id)}
                onPress={() => handleOpenNotebook(nb.id)}
                onLongPress={() => handleDeleteNotebook(nb.id, nb.title)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Create button */}
      <View style={[styles.createBtnWrap, { paddingBottom: insets.bottom + 72 }]}>
        <TouchableOpacity
          style={[styles.createBtn, Shadow.medium]}
          onPress={() => setShowNewModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.createBtnText}>新しいノートをつくる</Text>
          <PawSvg color="rgba(255,255,255,0.7)" size={16} />
        </TouchableOpacity>
      </View>

      {/* New Notebook Modal */}
      <Modal visible={showNewModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, Shadow.large]}>
            {/* Modal header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleRow}>
                <PawSvg color={Colors.primary} size={20} />
                <Text style={styles.modalTitle}>新しいノート</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowNewModal(false); setNewTitle(''); }}>
                <Ionicons name="close-circle" size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>タイトル</Text>
            <TextInput
              style={styles.textInput}
              placeholder="春のにっき..."
              placeholderTextColor={Colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              maxLength={40}
            />

            <Text style={styles.modalLabel}>カバーテーマ</Text>
            <View style={styles.themeRow}>
              {COVER_THEMES.map((t) => {
                const c = COVER_COLORS[t.key];
                return (
                  <TouchableOpacity
                    key={t.key}
                    onPress={() => setNewTheme(t.key)}
                    style={[
                      styles.themeOption,
                      { backgroundColor: c.bg, borderColor: newTheme === t.key ? c.accent : 'transparent' },
                      newTheme === t.key && { borderColor: c.accent },
                    ]}
                  >
                    <View style={[styles.themeSpine, { backgroundColor: c.spine }]} />
                    <PawSvg color={c.accent} size={20} />
                    <Text style={[styles.themeOptionLabel, { color: c.text }]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={!newTitle.trim() || isCreating}
              style={[styles.createModalBtn, (!newTitle.trim() || isCreating) && { opacity: 0.5 }]}
            >
              {isCreating ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="book-outline" size={18} color={Colors.white} />
                  <Text style={styles.createModalBtnText}>つくる</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 80,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: { gap: 1 },
  headerTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 30,
    fontStyle: 'italic',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  headerJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 16,
    color: Colors.primary,
    letterSpacing: 2,
  },
  settingsBtn: {
    marginTop: 4,
    padding: 4,
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: 0,
  },
  mascotImage: {
    width: 72,
    height: 72,
  },
  greetingBubble: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    borderColor: Colors.border,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Shadow.small,
    marginLeft: 10,
  },
  greetingTail: {
    position: 'absolute',
    left: -9,
    top: '50%',
    marginTop: -8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: Colors.border,
  },
  greetingText: {
    flex: 1,
    fontFamily: Fonts.handwritten,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 21,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47.5%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderCurve: 'continuous',
  },
  cardCover: {
    height: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  cardSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
  },
  cardClasp: {
    position: 'absolute',
    right: -4,
    top: '50%',
    marginTop: -14,
    width: 8,
    height: 28,
    borderRadius: 4,
    opacity: 0.9,
  },
  cardDecorTop: {
    position: 'absolute',
    top: 10,
    right: 18,
  },
  cardDecorBottom: {
    position: 'absolute',
    bottom: 10,
    left: 18,
  },
  cardStitch: {
    position: 'absolute',
    left: 16,
    right: 14,
    top: 7,
    bottom: 7,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
    opacity: 0.35,
  },
  cardInfo: {
    padding: Spacing.sm,
    paddingTop: 6,
    backgroundColor: Colors.surface,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  cardMenuBtn: {
    padding: 2,
  },
  cardMeta: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textLight,
  },
  cardDate: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 20,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
  },
  createBtnWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: BorderRadius.round,
  },
  createBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(92,74,74,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.sm,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 24,
    color: Colors.text,
  },
  modalLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.textLight,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: 10,
    fontFamily: Fonts.handwritten,
    fontSize: 18,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    height: 64,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  themeSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  themeOptionLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
  },
  createModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
  createModalBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.white,
  },
});
