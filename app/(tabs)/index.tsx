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
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { useAppStore } from '@/store/useAppStore';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import { useTranslation } from '@/constants/i18n';
import type { CoverTheme, Notebook } from '@/store/types';

const COVER_THEMES: { key: CoverTheme; label: string; labelJa: string }[] = [
  { key: 'spring',  label: 'Spring',  labelJa: 'はる' },
  { key: 'fluffy',  label: 'Fluffy',  labelJa: 'ふわふわ' },
  { key: 'leather', label: 'Leather', labelJa: 'レザー' },
  { key: 'blue',    label: 'Blue',    labelJa: 'ブルー' },
];

const COVER_IMAGES: Record<CoverTheme, number> = {
  leather: require('@/assets/cover_leather_new.png'),
  fluffy:  require('@/assets/cover_fluffy_new.png'),
  spring:  require('@/assets/cover_spring_new.png'),
  blue:    require('@/assets/cover_blue_new.png'),
};

const COVER_COLORS: Record<CoverTheme, { bg: string; accent: string; spine: string; text: string }> = {
  fluffy:  { bg: '#F5F0EB', accent: '#F9A8C9', spine: '#E8C9D5', text: '#5C4A4A' },
  leather: { bg: '#8B6340', accent: '#C4956A', spine: '#6B4D30', text: '#FFF5EB' },
  spring:  { bg: '#FADADD', accent: '#D45B7A', spine: '#F5B8CC', text: '#5C4A4A' },
  blue:    { bg: '#A8D8EA', accent: '#4A90C4', spine: '#7EC8E3', text: '#2C5F7A' },
};

function PawSvg({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Ellipse cx={16} cy={22} rx={7}   ry={5.5} fill={color} />
      <Circle  cx={8.5} cy={13.5} r={3.5} fill={color} />
      <Circle  cx={16}  cy={11}   r={3.5} fill={color} />
      <Circle  cx={23.5} cy={13.5} r={3.5} fill={color} />
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
  onMenuPress,
}: {
  notebook: Notebook;
  pageCount: number;
  onPress: () => void;
  onMenuPress: () => void;
}) {
  const c = COVER_COLORS[notebook.coverTheme] ?? COVER_COLORS.fluffy;
  const lastEdited = new Date(notebook.lastEdited);
  const dateStr    = lastEdited.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
  const coverImg   = COVER_IMAGES[notebook.coverTheme] ?? COVER_IMAGES.fluffy;

  return (
    <View style={[styles.card, Shadow.medium]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[styles.cardCover, { backgroundColor: c.bg }]}>
          <Image
            source={coverImg}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <View style={[styles.cardStitch, {
            borderColor: notebook.coverTheme === 'leather'
              ? 'rgba(255,245,235,0.3)'
              : 'rgba(255,255,255,0.4)',
          }]} />
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{notebook.title || 'Untitled'}</Text>
          </View>
          <Text style={styles.cardMeta}>{pageCount}ページ</Text>
          <Text style={styles.cardDate}>{dateStr} 更新</Text>
        </View>
      </Pressable>

      <TouchableOpacity
        onPress={onMenuPress}
        style={styles.cardMenuBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="ellipsis-vertical" size={16} color={Colors.textLight} />
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { notebooks, pages, settings, addNotebook, deleteNotebook } = useAppStore();
  const t = useTranslation();
  const [showNewModal, setShowNewModal]   = useState(false);
  const [newTitle, setNewTitle]           = useState('');
  const [newTheme, setNewTheme]           = useState<CoverTheme>('fluffy');
  const [isCreating, setIsCreating]       = useState(false);
  const [menuTarget, setMenuTarget]       = useState<{ id: string; title: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible:   boolean;
    title:     string;
    message:   string;
    onConfirm: () => void;
  }>({ visible: false, title: '', message: '', onConfirm: () => {} });

  // The user-customised notebook name (e.g. "ネコノート")
  const notebookBrand = `${settings.notebookName ?? 'ネコ'}ノート`;

  const getPageCount = useCallback(
    (notebookId: string) => pages.filter((p) => p.notebookId === notebookId).length,
    [pages]
  );

  const handleOpenNotebook = useCallback((id: string) => {
    router.push(`/notebook/${id}`);
  }, []);

  const showConfirm = useCallback(
    (title: string, message: string, onConfirm: () => void) => {
      if (Platform.OS !== 'web') {
        Alert.alert(title, message, [
          { text: 'キャンセル', style: 'cancel' },
          { text: '削除', style: 'destructive', onPress: onConfirm },
        ]);
      } else {
        setConfirmDialog({ visible: true, title, message, onConfirm });
      }
    },
    []
  );

  const handleDeleteNotebook = useCallback(
    (id: string, title: string) => {
      setMenuTarget(null);
      showConfirm(
        'この手帳を削除しますか？',
        `「${title}」とその中の全ページを完全に削除します。この操作は元に戻せません。`,
        () => deleteNotebook(id)
      );
    },
    [deleteNotebook, showConfirm]
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

  const greetings = useMemo(() => t.greetings, [t]);
  const greeting  = useMemo(
    () => greetings[notebooks.length % greetings.length],
    [notebooks.length, greetings]
  );

  // Count total favorite pages for the favorites quick card
  const favCount = useMemo(() => pages.filter((p) => p.isFavorite).length, [pages]);

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{notebookBrand}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Mascot + greeting */}
        <View style={styles.mascotRow}>
          <Image
            source={require('@/assets/neko_mascot_latest.png')}
            style={styles.mascotImage}
            contentFit="contain"
          />
          <View style={styles.greetingBubble}>
            <View style={styles.greetingTail} />
            <Text style={styles.greetingText}>{greeting}</Text>
            <SakuraSvg color={Colors.primary} size={13} />
          </View>
        </View>

        {/* Quick access row — Calendar & Favorites */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, Shadow.small]}
            onPress={() => router.push('/(tabs)/calendar')}
            activeOpacity={0.82}
          >
            <Text style={styles.quickCardEmoji}>🌸</Text>
            <Text style={styles.quickCardLabel}>カレンダー</Text>
            <Text style={styles.quickCardSub}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, Shadow.small]}
            onPress={() => router.push('/(tabs)/favorites')}
            activeOpacity={0.82}
          >
            <Text style={styles.quickCardEmoji}>⭐</Text>
            <Text style={styles.quickCardLabel}>お気に入り</Text>
            <Text style={styles.quickCardSub}>{favCount} pages</Text>
          </TouchableOpacity>
        </View>

        {/* Notebook grid */}
        {notebooks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.noNotebooks}</Text>
            <Text style={styles.emptySubtitle}>{t.noNotebooksHint}</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {notebooks.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                pageCount={getPageCount(nb.id)}
                onPress={() => handleOpenNotebook(nb.id)}
                onMenuPress={() => setMenuTarget({ id: nb.id, title: nb.title })}
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
          <Text style={styles.createBtnText}>{t.newNotebook}</Text>
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
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleRow}>
                <PawSvg color={Colors.primary} size={20} />
                <Text style={styles.modalTitle}>{t.newNotebookTitle}</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowNewModal(false); setNewTitle(''); }}>
                <Ionicons name="close-circle" size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>{t.titleLabel}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="春のにっき..."
              placeholderTextColor={Colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              maxLength={40}
            />

            <Text style={styles.modalLabel}>{t.themeLabel}</Text>
            <View style={styles.themeGrid}>
              {COVER_THEMES.map((th) => {
                const isSelected = newTheme === th.key;
                const c = COVER_COLORS[th.key];
                return (
                  <TouchableOpacity
                    key={th.key}
                    onPress={() => setNewTheme(th.key)}
                    style={[
                      styles.themeOption,
                      isSelected && [styles.themeOptionSelected, { borderColor: c.accent }],
                    ]}
                  >
                    <Image
                      source={COVER_IMAGES[th.key]}
                      style={styles.themeOptionImage}
                      contentFit="cover"
                    />
                    {isSelected && (
                      <View style={styles.themeCheckmark}>
                        <Ionicons name="checkmark-circle" size={18} color={c.accent} />
                      </View>
                    )}
                    <View style={[styles.themeOptionLabel, { backgroundColor: isSelected ? c.accent : 'rgba(0,0,0,0.35)' }]}>
                      <Text style={styles.themeOptionLabelText}>{th.labelJa}</Text>
                    </View>
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
                  <Text style={styles.createModalBtnText}>{t.createBtn}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Notebook action menu */}
      <Modal
        visible={menuTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuTarget(null)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuTarget(null)}>
          <View style={[styles.menuCard, Shadow.large]}>
            <Text style={styles.menuNotebookTitle} numberOfLines={1}>
              {menuTarget?.title}
            </Text>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                if (menuTarget) handleDeleteNotebook(menuTarget.id, menuTarget.title);
              }}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.menuItemTextDanger}>削除</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuCancelItem]}
              onPress={() => setMenuTarget(null)}
            >
              <Text style={styles.menuCancelText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Custom confirm dialog (web-safe) */}
      <Modal
        visible={confirmDialog.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDialog((d) => ({ ...d, visible: false }))}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmCard, Shadow.large]}>
            <Ionicons name="trash-outline" size={28} color={Colors.error} />
            <Text style={styles.confirmTitle}>{confirmDialog.title}</Text>
            <Text style={styles.confirmMessage}>{confirmDialog.message}</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmDialog((d) => ({ ...d, visible: false }))}
              >
                <Text style={styles.confirmCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={() => {
                  setConfirmDialog((d) => ({ ...d, visible: false }));
                  confirmDialog.onConfirm();
                }}
              >
                <Text style={styles.confirmDeleteText}>削除する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom:     80,
    flexGrow:          1,
  },
  header: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    justifyContent:  'space-between',
    marginBottom:    Spacing.md,
  },
  headerLeft: { gap: 1 },
  headerTitle: {
    fontFamily:    Fonts.handwrittenBold,
    fontSize:      30,
    fontStyle:     'italic',
    color:         Colors.text,
    letterSpacing: 0.3,
  },
  settingsBtn: {
    marginTop: 4,
    padding:   4,
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Spacing.lg,
    gap:           0,
  },
  mascotImage: {
    width:  72,
    height: 72,
  },
  greetingBubble: {
    flex:            1,
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.lg,
    padding:         Spacing.sm + 2,
    borderColor:     Colors.border,
    borderWidth:     1.5,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    ...Shadow.small,
    marginLeft: 10,
  },
  greetingTail: {
    position:         'absolute',
    left:             -9,
    top:              '50%',
    marginTop:        -8,
    width:            0,
    height:           0,
    borderTopWidth:   8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor:   'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: Colors.border,
  },
  greetingText: {
    flex:       1,
    fontFamily: Fonts.handwritten,
    fontSize:   15,
    color:      Colors.text,
    lineHeight: 21,
  },
  quickRow: {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  Spacing.md,
  },
  quickCard: {
    flex:            1,
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.lg,
    padding:         Spacing.sm,
    alignItems:      'center',
    gap:             3,
    borderColor:     Colors.border,
    borderWidth:     1,
    borderCurve:     'continuous',
  },
  quickCardEmoji: {
    fontSize:   24,
    lineHeight: 30,
  },
  quickCardLabel: {
    fontFamily: Fonts.handwritten,
    fontSize:   13,
    color:      Colors.text,
  },
  quickCardSub: {
    fontFamily: Fonts.regular,
    fontSize:   9,
    color:      Colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           12,
  },
  card: {
    width:           '47.5%',
    borderRadius:    BorderRadius.lg,
    overflow:        'visible',
    backgroundColor: Colors.surface,
    borderCurve:     'continuous',
    position:        'relative',
  },
  cardCover: {
    height:              120,
    position:            'relative',
    overflow:            'hidden',
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  cardStitch: {
    position:     'absolute',
    left:         10,
    right:        10,
    top:          6,
    bottom:       6,
    borderWidth:  1,
    borderStyle:  'dashed',
    borderRadius: BorderRadius.sm,
    opacity:      0.5,
  },
  cardInfo: {
    padding:         Spacing.sm,
    paddingTop:      6,
    backgroundColor: Colors.surface,
    gap:             2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize:   15,
    color:      Colors.text,
    flex:       1,
  },
  cardMenuBtn: {
    position:        'absolute',
    top:             6,
    right:           6,
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.12,
    shadowRadius:    2,
    elevation:       2,
  },
  cardMeta: {
    fontFamily: Fonts.regular,
    fontSize:   11,
    color:      Colors.textLight,
  },
  cardDate: {
    fontFamily: Fonts.regular,
    fontSize:   10,
    color:      Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    gap:        10,
  },
  emptyTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize:   20,
    color:      Colors.text,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize:   13,
    color:      Colors.textLight,
    textAlign:  'center',
  },
  createBtnWrap: {
    position:  'absolute',
    bottom:    0,
    left:      0,
    right:     0,
    alignItems: 'center',
  },
  createBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius:    BorderRadius.round,
  },
  createBtnText: {
    fontFamily:    Fonts.semiBold,
    fontSize:      15,
    color:         Colors.white,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(92,74,74,0.4)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.xl,
    padding:         Spacing.lg,
    width:           '100%',
    gap:             Spacing.sm,
  },
  modalHeaderRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    4,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  modalTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize:   24,
    color:      Colors.text,
  },
  modalLabel: {
    fontFamily:    Fonts.semiBold,
    fontSize:      12,
    color:         Colors.textLight,
    letterSpacing: 0.5,
    marginTop:     4,
  },
  textInput: {
    borderWidth:   1.5,
    borderColor:   Colors.border,
    borderRadius:  BorderRadius.md,
    padding:       10,
    fontFamily:    Fonts.handwritten,
    fontSize:      18,
    color:         Colors.text,
    backgroundColor: Colors.surfaceAlt,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  themeOption: {
    width:        '48%',
    height:       80,
    borderRadius: BorderRadius.md,
    overflow:     'hidden',
    borderWidth:  2,
    borderColor:  'transparent',
    position:     'relative',
  },
  themeOptionSelected: {
    borderWidth: 2.5,
  },
  themeOptionImage: {
    width:  '100%',
    height: '100%',
  },
  themeCheckmark: {
    position:        'absolute',
    top:             6,
    right:           6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius:    10,
  },
  themeOptionLabel: {
    position:       'absolute',
    bottom:         0,
    left:           0,
    right:          0,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignItems:     'center',
  },
  themeOptionLabelText: {
    fontFamily:    Fonts.semiBold,
    fontSize:      10,
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },
  createModalBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius:   BorderRadius.md,
    marginTop:      4,
  },
  createModalBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize:   16,
    color:      Colors.white,
  },

  // Notebook action menu
  menuOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems:      'center',
    justifyContent:  'flex-end',
    paddingBottom:   32,
    paddingHorizontal: Spacing.lg,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.xl,
    width:           '100%',
    overflow:        'hidden',
  },
  menuNotebookTitle: {
    fontFamily:      Fonts.handwrittenBold,
    fontSize:        16,
    color:           Colors.textLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    textAlign:       'center',
  },
  menuDivider: {
    height:          1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  menuItem: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
  },
  menuItemTextDanger: {
    fontFamily: Fonts.semiBold,
    fontSize:   16,
    color:      Colors.error,
  },
  menuCancelItem: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'center',
    marginTop:      4,
  },
  menuCancelText: {
    fontFamily: Fonts.semiBold,
    fontSize:   15,
    color:      Colors.textLight,
  },

  // Confirm dialog
  confirmOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         32,
  },
  confirmCard: {
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.xl,
    padding:         Spacing.lg,
    width:           '100%',
    maxWidth:        340,
    alignItems:      'center',
    gap:             Spacing.sm,
  },
  confirmTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize:   20,
    color:      Colors.text,
    textAlign:  'center',
  },
  confirmMessage: {
    fontFamily: Fonts.regular,
    fontSize:   13,
    color:      Colors.textLight,
    textAlign:  'center',
    lineHeight: 20,
  },
  confirmBtns: {
    flexDirection: 'row',
    gap:           Spacing.sm,
    marginTop:     4,
    width:         '100%',
  },
  confirmCancelBtn: {
    flex:           1,
    paddingVertical: 12,
    borderRadius:   BorderRadius.md,
    borderWidth:    1.5,
    borderColor:    Colors.border,
    alignItems:     'center',
  },
  confirmCancelText: {
    fontFamily: Fonts.semiBold,
    fontSize:   14,
    color:      Colors.textLight,
  },
  confirmDeleteBtn: {
    flex:            1,
    paddingVertical: 12,
    borderRadius:    BorderRadius.md,
    backgroundColor: Colors.error,
    alignItems:      'center',
  },
  confirmDeleteText: {
    fontFamily: Fonts.semiBold,
    fontSize:   14,
    color:      Colors.white,
  },
});
