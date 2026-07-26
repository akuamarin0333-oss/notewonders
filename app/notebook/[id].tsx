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
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
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

  // Photo state for right page
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isTransformMode, setIsTransformMode] = useState(false);

  // Gesture transform values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

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

  const handlePickPhoto = useCallback(async () => {
    if (isTransformMode) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('許可が必要です', 'フォトライブラリへのアクセスを許可してください。');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        // Reset transform when new photo is picked
        scale.value = 1;
        savedScale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    } catch {
      Alert.alert('エラー', '写真の選択に失敗しました。');
    }
  }, [isTransformMode, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  const handleToggleTransform = useCallback(() => {
    setIsTransformMode((prev) => !prev);
  }, []);

  // Pinch gesture for scaling
  const pinchGesture = Gesture.Pinch()
    .enabled(isTransformMode)
    .onUpdate((e) => {
      scale.value = Math.max(0.5, Math.min(4, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .enabled(isTransformMode)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const photoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

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
                placeholder=""
                placeholderTextColor={Colors.textMuted}
                value={currentPage?.title ?? ''}
                onChangeText={(t) => currentPage && updatePage(currentPage.id, { title: t })}
                maxLength={60}
              />

              {/* Date line */}
              <Text style={styles.pageDate}>{pageDate}</Text>

              {/* Scrollable content area */}
              <ScrollView
                style={[styles.pageContentScroll, { height: spreadH - 90 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <TextInput
                  style={styles.pageContent}
                  multiline
                  placeholder=""
                  placeholderTextColor={Colors.textMuted}
                  value={currentPage?.content ?? ''}
                  onChangeText={(t) => currentPage && updatePage(currentPage.id, { content: t })}
                  textAlignVertical="top"
                  scrollEnabled={false}
                />
              </ScrollView>

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
              {/* Photo area with transform toggle */}
              <View style={styles.photoSticker}>
                {/* Transform toggle button */}
                <TouchableOpacity
                  style={[
                    styles.transformToggleBtn,
                    isTransformMode && styles.transformToggleBtnActive,
                  ]}
                  onPress={handleToggleTransform}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={isTransformMode ? 'move' : 'expand-outline'}
                    size={14}
                    color={isTransformMode ? Colors.white : Colors.textLight}
                  />
                </TouchableOpacity>

                {/* Photo frame with gesture support */}
                <GestureDetector gesture={composedGesture}>
                  <View style={[styles.photoFrame, isTransformMode && styles.photoFrameActive]}>
                    <TouchableOpacity
                      activeOpacity={isTransformMode ? 1 : 0.8}
                      onPress={handlePickPhoto}
                      disabled={isTransformMode}
                    >
                      <Reanimated.View style={photoAnimatedStyle}>
                        <Image
                          source={photoUri ? { uri: photoUri } : require('@/assets/neko_cat_mascot.png')}
                          style={styles.photoImage}
                          contentFit={photoUri ? 'cover' : 'contain'}
                        />
                      </Reanimated.View>
                    </TouchableOpacity>
                    {!photoUri && (
                      <View style={styles.photoHint}>
                        <Ionicons name="image-outline" size={12} color={Colors.textMuted} />
                      </View>
                    )}
                    <View style={styles.photoTape} />
                    <View style={styles.photoBubble}>
                      <Text style={styles.photoBubbleText}>にゃー</Text>
                    </View>
                  </View>
                </GestureDetector>
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
  pageContentScroll: {
    zIndex: 2,
    flexGrow: 0,
  },
  pageContent: {
    fontFamily: Fonts.handwritten,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 26,
    paddingTop: 2,
    minHeight: 200,
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
    zIndex: 2,
    transform: [{ rotate: '2deg' }],
  },
  transformToggleBtn: {
    position: 'absolute',
    top: -10,
    right: -6,
    zIndex: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5C4A4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  transformToggleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
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
    overflow: 'hidden',
  },
  photoFrameActive: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  photoImage: {
    width: 110,
    height: 100,
  },
  photoHint: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
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
