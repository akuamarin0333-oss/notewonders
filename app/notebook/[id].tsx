import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useStickerStore } from '@/store/useStickerStore';
import StickerCanvas from '@/components/StickerCanvas';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import type { Sticker } from '@/store/types';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

function PawPrintDecor({ style }: { style?: object }) {
  return (
    <View style={[{ opacity: 0.18 }, style]} pointerEvents="none">
      <Svg width={32} height={32} viewBox="0 0 32 32">
        <Ellipse cx={16} cy={22} rx={8} ry={6} fill={Colors.primary} />
        <Circle cx={8} cy={13} r={4} fill={Colors.primary} />
        <Circle cx={16} cy={10} r={4} fill={Colors.primary} />
        <Circle cx={24} cy={13} r={4} fill={Colors.primary} />
        <Ellipse cx={11} cy={22} rx={2} ry={2.5} fill="#E8809E" />
        <Ellipse cx={16} cy={24} rx={2} ry={2.5} fill="#E8809E" />
        <Ellipse cx={21} cy={22} rx={2} ry={2.5} fill="#E8809E" />
      </Svg>
    </View>
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

  const pageWidth = width - Spacing.md * 2;
  const leftPageWidth = pageWidth * 0.52;
  const rightPageWidth = pageWidth * 0.48;
  const pageHeight = height * 0.6;

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
        Animated.timing(slideAnim, { toValue: dir * -30, duration: 80, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
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
        x: 20 + Math.random() * (rightPageWidth - 70),
        y: 20 + Math.random() * (pageHeight - 70),
        scale: 1,
      };
      addSticker(currentPage.id, sticker);
    },
    [currentPage, addSticker, rightPageWidth, pageHeight]
  );

  // Consume pending sticker from sticker-pack modal
  useEffect(() => {
    if (pendingSticker && currentPage) {
      handleAddSticker(pendingSticker);
      setPendingSticker(null);
    }
  }, [pendingSticker, currentPage, handleAddSticker, setPendingSticker]);

  if (!notebook) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Notebook not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const COVER_ACCENT: Record<string, string> = {
    fluffy: Colors.primary,
    leather: '#C4956A',
    spring: Colors.accent,
  };
  const accent = COVER_ACCENT[notebook.coverTheme] ?? Colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* Top bar (stamp-style) */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.notebookTitle} numberOfLines={1}>
          {notebook.title}
        </Text>
        {/* Stamp icons */}
        <View style={styles.stampRow}>
          <TouchableOpacity onPress={handleAddPage} style={[styles.stampBtn, { borderColor: accent }]}>
            <Ionicons name="add-circle-outline" size={18} color={accent} />
            <Text style={[styles.stampLabel, { color: accent }]}>add page</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => currentPage && toggleFavorite(currentPage.id)}
            style={[styles.stampBtn, { borderColor: Colors.accentGreen }]}
          >
            <Ionicons
              name={currentPage?.isFavorite ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={currentPage?.isFavorite ? Colors.favorite : Colors.accentGreen}
            />
            <Text style={[styles.stampLabel, { color: Colors.accentGreen }]}>favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            style={[styles.stampBtn, { borderColor: Colors.textLight }]}
          >
            <Ionicons name="home-outline" size={18} color={Colors.textLight} />
            <Text style={[styles.stampLabel, { color: Colors.textLight }]}>home</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Page counter */}
      <View style={styles.pageCounter}>
        <Text style={styles.pageCounterText}>
          {notebookPages.length === 0
            ? 'No pages yet'
            : `Page ${currentIndex + 1} / ${notebookPages.length}`}
        </Text>
      </View>

      {/* Notebook spread */}
      {notebookPages.length === 0 ? (
        <View style={styles.emptyNotebook}>
          <Text style={styles.emptyText}>This notebook is empty</Text>
          <TouchableOpacity style={[styles.addPageBtn, { backgroundColor: accent }]} onPress={handleAddPage}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.addPageBtnText}>Add First Page</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View
          style={[
            styles.spreadWrapper,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View style={[styles.spread, { width: pageWidth, minHeight: pageHeight }]}>
            {/* Left page — writing area */}
            <View style={[styles.leftPage, { width: leftPageWidth, minHeight: pageHeight }]}>
              {/* Page label A */}
              <View style={styles.pageLabel}>
                <Text style={[styles.pageLabelText, { color: accent }]}>A</Text>
              </View>
              {/* Title input */}
              <TextInput
                style={styles.pageTitle}
                placeholder="Spring Thoughts..."
                placeholderTextColor={Colors.textMuted}
                value={currentPage?.title ?? ''}
                onChangeText={(t) => currentPage && updatePage(currentPage.id, { title: t })}
                maxLength={60}
              />
              {/* Subtitle */}
              {currentPage?.title ? (
                <Text style={styles.pageTitleJa}>（はるのきもち）</Text>
              ) : null}
              {/* Ruled lines + text area */}
              <View style={styles.ruledArea}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <View key={i} style={styles.rule} />
                ))}
                <TextInput
                  style={styles.pageContent}
                  multiline
                  placeholder="Write your thoughts here..."
                  placeholderTextColor={Colors.textMuted}
                  value={currentPage?.content ?? ''}
                  onChangeText={(t) => currentPage && updatePage(currentPage.id, { content: t })}
                  textAlignVertical="top"
                />
              </View>
              {/* Paw decoration */}
              <PawPrintDecor style={{ position: 'absolute', bottom: 24, right: 12 }} />
              {/* Sakura corner */}
              <View style={{ position: 'absolute', bottom: 20, left: 12, opacity: 0.25 }}>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path d="M12 2 C10 5 6 6 4 6 C6 8 6 10 4 12 C7 11 9 12 10 14 C11 12 13 11 16 12 C14 10 14 8 16 6 C14 6 14 5 12 2Z" fill={Colors.sakura} />
                </Svg>
              </View>
            </View>

            {/* Spine shadow */}
            <View style={styles.spineShadow} />

            {/* Right page — sticker canvas */}
            <View style={[styles.rightPage, { width: rightPageWidth, minHeight: pageHeight }]}>
              {/* Page label B */}
              <View style={[styles.pageLabel, { left: 8 }]}>
                <Text style={[styles.pageLabelText, { color: accent }]}>B</Text>
              </View>
              {/* Cat icon top right */}
              <View style={styles.catIcon}>
                <Ionicons name="paw" size={14} color={Colors.primary} />
              </View>

              <StickerCanvas
                stickers={currentPage?.stickers ?? []}
                onUpdateSticker={(sid, updates) =>
                  currentPage && updateSticker(currentPage.id, sid, updates)
                }
                onRemoveSticker={(sid) =>
                  currentPage && removeSticker(currentPage.id, sid)
                }
                width={rightPageWidth}
                height={pageHeight}
              />

              {/* Sticker pack button */}
              <TouchableOpacity
                style={[styles.stickerPickerBtn, { borderColor: accent, bottom: 12, right: 8 }]}
                onPress={() => router.push('/notebook/sticker-pack')}
              >
                <Ionicons name="happy-outline" size={16} color={accent} />
                <Text style={[styles.stickerPickerText, { color: accent }]}>stickers</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Page navigation */}
      {notebookPages.length > 1 && (
        <View style={[styles.navRow, { paddingBottom: insets.bottom + 64 }]}>
          <TouchableOpacity
            onPress={() => handleNav(-1)}
            disabled={currentIndex === 0}
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          >
            <Ionicons name="chevron-back-circle" size={32} color={Colors.primary} />
          </TouchableOpacity>
          {/* Ladybug page turn icon */}
          <View style={styles.ladybugIcon}>
            <Svg width={24} height={24} viewBox="0 0 40 40">
              <Ellipse cx={20} cy={22} rx={12} ry={10} fill={Colors.ladybug} />
              <Path d="M20 12 C14 12 8 17 8 22 Q8 14 20 12Z" fill="#1a1a1a" />
              <Path d="M20 12 C26 12 32 17 32 22 Q32 14 20 12Z" fill="#1a1a1a" />
              <Path d="M20 12 L20 32" stroke="#1a1a1a" strokeWidth={1.5} />
              <Circle cx={14} cy={22} r={3} fill="#1a1a1a" />
              <Circle cx={26} cy={22} r={3} fill="#1a1a1a" />
              <Circle cx={20} cy={10} r={4} fill="#1a1a1a" />
            </Svg>
          </View>
          <TouchableOpacity
            onPress={() => handleNav(1)}
            disabled={currentIndex >= notebookPages.length - 1}
            style={[styles.navBtn, currentIndex >= notebookPages.length - 1 && styles.navBtnDisabled]}
          >
            <Ionicons name="chevron-forward-circle" size={32} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    gap: 8,
  },
  backIcon: { padding: 4 },
  notebookTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 20,
    color: Colors.text,
    flex: 1,
  },
  stampRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stampBtn: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    borderStyle: 'dashed',
  },
  stampLabel: {
    fontFamily: Fonts.regular,
    fontSize: 8,
  },
  pageCounter: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  pageCounterText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textLight,
  },
  spreadWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  spread: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadow.large,
  },
  leftPage: {
    backgroundColor: '#FFFDF8',
    padding: Spacing.md,
    position: 'relative',
  },
  rightPage: {
    backgroundColor: '#F8FFFE',
    position: 'relative',
    overflow: 'hidden',
  },
  spineShadow: {
    width: 6,
    backgroundColor: 'rgba(92,74,74,0.12)',
  },
  pageLabel: {
    position: 'absolute',
    top: 8,
    right: 10,
    zIndex: 2,
  },
  pageLabelText: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 18,
    opacity: 0.4,
  },
  pageTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 20,
    color: Colors.text,
    marginBottom: 2,
    marginTop: 8,
  },
  pageTitleJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 8,
  },
  ruledArea: {
    flex: 1,
    position: 'relative',
    paddingTop: 4,
  },
  rule: {
    height: 1,
    backgroundColor: Colors.pageLine,
    marginBottom: 24,
  },
  pageContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontFamily: Fonts.handwritten,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 25,
  },
  catIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  stickerPickerBtn: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.round,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 3,
  },
  stickerPickerText: {
    fontFamily: Fonts.regular,
    fontSize: 10,
  },
  emptyNotebook: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontFamily: Fonts.handwritten,
    fontSize: 20,
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 24,
  },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.3 },
  ladybugIcon: { opacity: 0.8 },
  errorText: {
    fontFamily: Fonts.handwritten,
    fontSize: 20,
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
