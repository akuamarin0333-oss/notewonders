import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  Animated,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { useAppStore } from '@/store/useAppStore';
import { useStickerStore } from '@/store/useStickerStore';
import StickerCanvas from '@/components/StickerCanvas';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import type { Sticker } from '@/store/types';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

function SakuraDecor({ size = 16, color = '#FFB7C5', style }: { size?: number; color?: string; style?: object }) {
  return (
    <View style={[{ opacity: 0.7 }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M12 2C9.5 5 7 6 5 6c2 2 2 4 0 6 2.5-1 4.5 0 5.5 2 1-2 3-3 5.5-2-2-2-2-4 0-6-2 0-4.5-1-4-4z"
          fill={color}
        />
        <Circle cx={12} cy={9} r={2} fill="rgba(255,255,255,0.5)" />
      </Svg>
    </View>
  );
}

function PawDecor({ style }: { style?: object }) {
  return (
    <View style={[{ opacity: 0.15 }, style]} pointerEvents="none">
      <Svg width={28} height={28} viewBox="0 0 32 32">
        <Ellipse cx={16} cy={22} rx={7} ry={5.5} fill={Colors.primary} />
        <Circle cx={8.5} cy={13.5} r={3.5} fill={Colors.primary} />
        <Circle cx={16} cy={11} r={3.5} fill={Colors.primary} />
        <Circle cx={23.5} cy={13.5} r={3.5} fill={Colors.primary} />
      </Svg>
    </View>
  );
}

function LadybugDecor({ size = 28, style }: { size?: number; style?: object }) {
  return (
    <View style={[{ opacity: 0.85 }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Ellipse cx={20} cy={24} rx={13} ry={11} fill="#E53935" />
        <Path d="M20 13 C13 13 7 18 7 24 Q7 16 20 13Z" fill="#1a1a1a" />
        <Path d="M20 13 C27 13 33 18 33 24 Q33 16 20 13Z" fill="#1a1a1a" />
        <Path d="M20 13 L20 35" stroke="#1a1a1a" strokeWidth={2} />
        <Circle cx={13} cy={24} r={3} fill="#1a1a1a" />
        <Circle cx={27} cy={24} r={3} fill="#1a1a1a" />
        <Circle cx={13} cy={31} r={2.5} fill="#1a1a1a" />
        <Circle cx={27} cy={31} r={2.5} fill="#1a1a1a" />
        <Circle cx={20} cy={11} r={4} fill="#1a1a1a" />
      </Svg>
    </View>
  );
}

function StampButton({
  icon,
  label,
  onPress,
  color,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
  active?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.stampBtn} activeOpacity={0.75}>
      <View style={[styles.stampIcon, { backgroundColor: active ? color : '#F5F0EB', borderColor: color }]}>
        <Ionicons name={icon} size={20} color={active ? '#FFFFFF' : color} />
      </View>
      <Text style={[styles.stampLabel, { color: Colors.textLight }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function NotebookPageView() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    notebooks,
    pages,
    addPage,
    updatePage,
    deletePage,
    updateNotebook,
    toggleFavorite,
    addSticker,
    updateSticker,
    removeSticker,
  } = useAppStore();

  const notebook = useMemo(() => notebooks.find((n) => n.id === id), [notebooks, id]);
  const notebookPages = useMemo(
    () => pages.filter((p) => p.notebookId === id).sort((a, b) => a.pageNumber - b.pageNumber),
    [pages, id]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { pendingSticker, setPendingSticker } = useStickerStore();

  const currentPage = notebookPages[currentIndex] ?? null;

  // Spread dimensions — full width book
  const spreadWidth = width - Spacing.md * 2;
  const leftW = Math.floor(spreadWidth * 0.5);
  const rightW = spreadWidth - leftW;
  const spreadH = Math.min(height * 0.58, 380);

  const handleAddPage = useCallback(() => {
    if (!id) return;
    addPage(id);
    setCurrentIndex(notebookPages.length);
  }, [id, addPage, notebookPages.length]);

  const handleNav = useCallback(
    (dir: 1 | -1) => {
      const next = currentIndex + dir;
      if (next < 0 || next >= notebookPages.length) return;
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: dir * -20, duration: 70, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 110, useNativeDriver: true }),
      ]).start();
      setCurrentIndex(next);
    },
    [currentIndex, notebookPages.length, slideAnim]
  );

  const handleAddSticker = useCallback(
    (type: Sticker['type']) => {
      if (!currentPage) return;
      const sticker: Sticker = {
        id: generateId(),
        type,
        x: 16 + Math.random() * (rightW - 60),
        y: 16 + Math.random() * (spreadH - 60),
        scale: 1,
      };
      addSticker(currentPage.id, sticker);
    },
    [currentPage, addSticker, rightW, spreadH]
  );

  const handleDeletePage = useCallback(() => {
    if (!currentPage) return;
    Alert.alert(
      'ページを削除',
      `ページ ${currentPage.pageNumber} を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            deletePage(currentPage.id);
            setCurrentIndex((prev) => Math.max(0, prev - 1));
          },
        },
      ]
    );
  }, [currentPage, deletePage]);

  const handleRenameNotebook = useCallback(() => {
    if (!notebook) return;
    Alert.prompt(
      'ノート名を変更',
      '新しい名前を入力してください：',
      (newTitle) => {
        if (newTitle?.trim()) {
          updateNotebook(notebook.id, { title: newTitle.trim() });
        }
      },
      'plain-text',
      notebook.title
    );
  }, [notebook, updateNotebook]);

  useEffect(() => {
    if (pendingSticker && currentPage) {
      handleAddSticker(pendingSticker);
      setPendingSticker(null);
    }
  }, [pendingSticker, currentPage, handleAddSticker, setPendingSticker]);

  if (!notebook) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>ノートが見つかりません</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const COVER_ACCENT: Record<string, string> = {
    fluffy: Colors.primary,
    leather: '#C4956A',
    spring: '#A8D8EA',
  };
  const accent = COVER_ACCENT[notebook.coverTheme] ?? Colors.primary;

  const pageDate = currentPage
    ? new Date(currentPage.updatedAt).toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : '';

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* Top stamp bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.stampRow}>
          <StampButton
            icon="add-circle-outline"
            label="ページ追加"
            onPress={handleAddPage}
            color={accent}
          />
          <StampButton
            icon={currentPage?.isFavorite ? 'bookmark' : 'bookmark-outline'}
            label="お気に入り"
            onPress={() => currentPage && toggleFavorite(currentPage.id)}
            color={Colors.accentGreen}
            active={currentPage?.isFavorite}
          />
          <StampButton
            icon="home-outline"
            label="ホーム"
            onPress={() => router.push('/(tabs)')}
            color={Colors.textLight}
          />
          {currentPage !== null && (
            <StampButton
              icon="trash-outline"
              label="削除"
              onPress={handleDeletePage}
              color={Colors.error}
            />
          )}
        </View>
      </View>

      {/* Notebook title */}
      <TouchableOpacity onLongPress={handleRenameNotebook} style={styles.notebookTitleWrap}>
        <Text style={styles.notebookTitle} numberOfLines={1}>{notebook.title}</Text>
      </TouchableOpacity>

      {/* Book spread */}
      {notebookPages.length === 0 ? (
        <View style={styles.emptyNotebook}>
          <Text style={styles.emptyText}>このノートはまだ空です</Text>
          <TouchableOpacity style={[styles.addPageBtn, { backgroundColor: accent }]} onPress={handleAddPage}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.addPageBtnText}>最初のページを追加</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.spreadWrap}>
          <Animated.View
            style={[
              styles.spread,
              {
                width: spreadWidth,
                height: spreadH,
                transform: [{ translateX: slideAnim }],
              },
              Shadow.large,
            ]}
          >
            {/* Left page — writing */}
            <View style={[styles.leftPage, { width: leftW, height: spreadH }]}>
              {/* Ruled lines */}
              {Array.from({ length: 12 }).map((_, i) => (
                <View key={i} style={[styles.ruleLine, { top: 50 + i * 26 }]} />
              ))}

              {/* Page title input */}
              <TextInput
                style={styles.pageTitle}
                placeholder="Spring Thoughts / はるのきもち"
                placeholderTextColor={Colors.textMuted}
                value={currentPage?.title ?? ''}
                onChangeText={(t) => currentPage && updatePage(currentPage.id, { title: t })}
                maxLength={60}
              />

              {/* Date line */}
              <Text style={styles.pageDate}>{pageDate}</Text>

              {/* Content area */}
              <TextInput
                style={[styles.pageContent, { height: spreadH - 90 }]}
                multiline
                placeholder={'今日はぽかぽかして、\nおさんぽ日和だったね。\nさくらのはながきれいで、\nこころまであたたかくなったよ。'}
                placeholderTextColor={Colors.textMuted}
                value={currentPage?.content ?? ''}
                onChangeText={(t) => currentPage && updatePage(currentPage.id, { content: t })}
                textAlignVertical="top"
              />

              {/* Decorations */}
              <PawDecor style={{ position: 'absolute', bottom: 12, right: 8 }} />
              <SakuraDecor size={14} style={{ position: 'absolute', bottom: 14, left: 14 }} />
            </View>

            {/* Spine shadow */}
            <View style={styles.spine}>
              <View style={styles.spineInner} />
            </View>

            {/* Right page — sticker canvas */}
            <View style={[styles.rightPage, { width: rightW, height: spreadH }]}>
              {/* Cat photo sticker - decorative */}
              <View style={styles.photoSticker}>
                <View style={styles.photoFrame}>
                  <Image
                    source={require('@/assets/neko_cat_mascot.png')}
                    style={styles.photoImage}
                    contentFit="contain"
                  />
                  <View style={styles.photoTape} />
                  <View style={styles.photoBubble}>
                    <Text style={styles.photoBubbleText}>にゃー</Text>
                  </View>
                </View>
              </View>

              {/* Sticker canvas on top */}
              <StickerCanvas
                stickers={currentPage?.stickers ?? []}
                onUpdateSticker={(sid, updates) =>
                  currentPage && updateSticker(currentPage.id, sid, updates)
                }
                onRemoveSticker={(sid) => currentPage && removeSticker(currentPage.id, sid)}
                width={rightW}
                height={spreadH}
              />

              {/* Sakura decors */}
              <SakuraDecor size={18} color={Colors.sakura} style={{ position: 'absolute', top: 10, right: 14, zIndex: 0 }} />
              <SakuraDecor size={12} color={Colors.sakura} style={{ position: 'absolute', top: 30, left: 10, zIndex: 0 }} />

              {/* Ladybug */}
              <LadybugDecor size={32} style={{ position: 'absolute', bottom: 32, right: 8, zIndex: 1 }} />

              {/* Sticker pack button */}
              <TouchableOpacity
                style={[styles.stickerBtn, { borderColor: accent }]}
                onPress={() => router.push('/notebook/sticker-pack')}
              >
                <Ionicons name="happy-outline" size={14} color={accent} />
                <Text style={[styles.stickerBtnText, { color: accent }]}>ステッカー</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Sakura petals around spread */}
          <SakuraDecor size={13} style={{ position: 'absolute', left: 10, top: 20 }} />
          <SakuraDecor size={10} style={{ position: 'absolute', right: 12, top: 8 }} />
        </View>
      )}

      {/* Page navigation */}
      <View style={[styles.navRow, { paddingBottom: insets.bottom + 68 }]}>
        {notebookPages.length > 1 && (
          <TouchableOpacity
            onPress={() => handleNav(-1)}
            disabled={currentIndex === 0}
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          >
            <Ionicons name="chevron-back-circle" size={30} color={accent} />
          </TouchableOpacity>
        )}
        <View style={styles.pageCounterWrap}>
          <Text style={styles.pageCounter}>
            {notebookPages.length === 0
              ? 'ページなし'
              : `${currentIndex + 1} / ${notebookPages.length}`}
          </Text>
        </View>
        {notebookPages.length > 1 && (
          <TouchableOpacity
            onPress={() => handleNav(1)}
            disabled={currentIndex >= notebookPages.length - 1}
            style={[styles.navBtn, currentIndex >= notebookPages.length - 1 && styles.navBtnDisabled]}
          >
            <Ionicons name="chevron-forward-circle" size={30} color={accent} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backIcon: {
    width: 36,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(249,168,201,0.12)',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  stampRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  stampBtn: {
    alignItems: 'center',
    gap: 3,
  },
  stampIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  stampLabel: {
    fontFamily: Fonts.regular,
    fontSize: 9,
    letterSpacing: 0.2,
  },
  notebookTitleWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 4,
  },
  notebookTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 18,
    color: Colors.text,
    fontStyle: 'italic',
  },
  spreadWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    position: 'relative',
  },
  spread: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  leftPage: {
    backgroundColor: '#FFFEF8',
    padding: 12,
    paddingTop: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  ruleLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: Colors.pageLine,
  },
  pageTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 17,
    color: Colors.text,
    fontStyle: 'italic',
    zIndex: 2,
    paddingBottom: 2,
  },
  pageDate: {
    fontFamily: Fonts.handwritten,
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 4,
    zIndex: 2,
  },
  pageContent: {
    fontFamily: Fonts.handwritten,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 26,
    zIndex: 2,
    paddingTop: 2,
  },
  spine: {
    width: 10,
    backgroundColor: 'rgba(92,74,74,0.04)',
    alignItems: 'center',
  },
  spineInner: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(92,74,74,0.1)',
  },
  rightPage: {
    backgroundColor: '#FFF5F8',
    position: 'relative',
    overflow: 'hidden',
  },
  photoSticker: {
    position: 'absolute',
    top: 24,
    left: 8,
    right: 8,
    alignItems: 'center',
    zIndex: 1,
    transform: [{ rotate: '2deg' }],
  },
  photoFrame: {
    backgroundColor: Colors.surface,
    padding: 6,
    paddingBottom: 18,
    borderRadius: 4,
    shadowColor: '#5C4A4A',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  photoImage: {
    width: 110,
    height: 100,
  },
  photoTape: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 14,
    backgroundColor: 'rgba(249,168,201,0.45)',
    borderRadius: 2,
    transform: [{ rotate: '-2deg' }],
  },
  photoBubble: {
    position: 'absolute',
    top: 12,
    right: -18,
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoBubbleText: {
    fontFamily: Fonts.handwritten,
    fontSize: 10,
    color: Colors.text,
  },
  stickerBtn: {
    position: 'absolute',
    bottom: 10,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.round,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 4,
  },
  stickerBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 10,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 16,
  },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.28 },
  pageCounterWrap: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pageCounter: {
    fontFamily: Fonts.handwritten,
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 1,
  },
  emptyNotebook: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontFamily: Fonts.handwritten,
    fontSize: 18,
    color: Colors.textLight,
  },
  addPageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
  },
  addPageBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
  errorText: {
    fontFamily: Fonts.handwritten,
    fontSize: 18,
    color: Colors.textLight,
  },
  backBtn: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  backBtnText: {
    fontFamily: Fonts.semiBold,
    color: Colors.white,
    fontSize: 14,
  },
});
