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
  PanResponder,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { useAppStore } from '@/store/useAppStore';
import { useStickerStore } from '@/store/useStickerStore';
import StickerCanvas from '@/components/StickerCanvas';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import type { CoverTheme, Sticker } from '@/store/types';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

interface PhotoItem {
  id: string;
  uri: string | null;
  x: number;
  y: number;
  scale: number;
  isTransformMode: boolean;
}

// ─── Theme system for notebook pages ─────────────────────────────────────────

interface PageTheme {
  leftBg: string;
  rightBg: string;
  ruleLine: string;
  dateColor: string;
  tapeColor: string;
  accentColor: string;
  decorColor: string;
}

const PAGE_THEMES: Record<CoverTheme, PageTheme> = {
  leather: {
    leftBg: '#FBF5EE',
    rightBg: '#F7EFE4',
    ruleLine: '#D4B896',
    dateColor: '#8B6340',
    tapeColor: 'rgba(196,149,106,0.72)',
    accentColor: '#C4956A',
    decorColor: '#C4956A',
  },
  fluffy: {
    leftBg: '#FFFEF8',
    rightBg: '#FFF5F8',
    ruleLine: Colors.pageLine,
    dateColor: Colors.primary,
    tapeColor: 'rgba(249,168,201,0.72)',
    accentColor: Colors.primary,
    decorColor: Colors.sakura,
  },
  spring: {
    leftBg: '#FFF8FC',
    rightBg: '#FFF0F7',
    ruleLine: '#F5B8CC',
    dateColor: '#D45B7A',
    tapeColor: 'rgba(244,114,162,0.65)',
    accentColor: '#D45B7A',
    decorColor: '#FFB7C5',
  },
  blue: {
    leftBg: '#F0F8FF',
    rightBg: '#E8F4FB',
    ruleLine: '#A8D8EA',
    dateColor: '#3A8BAD',
    tapeColor: 'rgba(100,180,220,0.68)',
    accentColor: '#3A8BAD',
    decorColor: '#A8D8EA',
  },
};

// ─── Masking tape decoration ──────────────────────────────────────────────────

function MaskingTape({ width = 76, color = 'rgba(249,168,201,0.72)' }: { width?: number; color?: string }) {
  const count = Math.max(2, Math.floor(width / 14));
  return (
    <View style={[styles.tapeStrip, { width, backgroundColor: color }]}>
      {Array.from({ length: count }).map((_, i) => (
        <Svg key={i} width={10} height={10} viewBox="0 0 20 20">
          <Circle cx={10} cy={4} r={2.5} fill="rgba(255,255,255,0.6)" />
          <Circle cx={16} cy={10} r={2.5} fill="rgba(255,255,255,0.6)" />
          <Circle cx={10} cy={16} r={2.5} fill="rgba(255,255,255,0.6)" />
          <Circle cx={4} cy={10} r={2.5} fill="rgba(255,255,255,0.6)" />
          <Circle cx={10} cy={10} r={2} fill="rgba(255,200,215,0.88)" />
        </Svg>
      ))}
    </View>
  );
}

// ─── Decorative SVG helpers ───────────────────────────────────────────────────

function SakuraDecor({ size = 16, color = '#FFB7C5', style }: { size?: number; color?: string; style?: object }) {
  return (
    <View style={[{ opacity: 0.7 }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 2C9.5 5 7 6 5 6c2 2 2 4 0 6 2.5-1 4.5 0 5.5 2 1-2 3-3 5.5-2-2-2-2-4 0-6-2 0-4.5-1-4-4z" fill={color} />
        <Circle cx={12} cy={9} r={2} fill="rgba(255,255,255,0.5)" />
      </Svg>
    </View>
  );
}

function PawDecor({ style, color = Colors.primary }: { style?: object; color?: string }) {
  return (
    <View style={[{ opacity: 0.15 }, style]} pointerEvents="none">
      <Svg width={28} height={28} viewBox="0 0 32 32">
        <Ellipse cx={16} cy={22} rx={7} ry={5.5} fill={color} />
        <Circle cx={8.5} cy={13.5} r={3.5} fill={color} />
        <Circle cx={16} cy={11} r={3.5} fill={color} />
        <Circle cx={23.5} cy={13.5} r={3.5} fill={color} />
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

function CloverDecor({ size = 22, style }: { size?: number; style?: object }) {
  return (
    <View style={[{ opacity: 0.6 }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Circle cx={14} cy={14} r={7} fill="#8BC34A" opacity={0.85} />
        <Circle cx={26} cy={14} r={7} fill="#8BC34A" opacity={0.85} />
        <Circle cx={14} cy={26} r={7} fill="#8BC34A" opacity={0.85} />
        <Circle cx={26} cy={26} r={7} fill="#8BC34A" opacity={0.85} />
        <Path d="M20 38 L20 20" stroke="#5D8A2A" strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

// ─── Stamp button ─────────────────────────────────────────────────────────────

function StampButton({
  icon, label, onPress, color, active,
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

// ─── Polaroid photo item ──────────────────────────────────────────────────────

interface PolaroidItemProps {
  photo: PhotoItem;
  onPickPhoto: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
  onToggleTransform: (id: string) => void;
  tapeColor?: string;
}

function PolaroidItem({ photo, onPickPhoto, onRemove, onUpdatePhoto, onToggleTransform, tapeColor }: PolaroidItemProps) {
  // Use refs to track current values without causing stale closures
  const basePos = useRef({ x: photo.x, y: photo.y });
  const photoRef = useRef(photo);
  photoRef.current = photo;
  const onUpdateRef = useRef(onUpdatePhoto);
  onUpdateRef.current = onUpdatePhoto;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => photoRef.current.isTransformMode,
      onMoveShouldSetPanResponder: () => photoRef.current.isTransformMode,
      onPanResponderGrant: () => {
        // Sync base position at start of each gesture
        basePos.current = { x: photoRef.current.x, y: photoRef.current.y };
      },
      onPanResponderMove: (_, gs) => {
        onUpdateRef.current(photoRef.current.id, {
          x: basePos.current.x + gs.dx,
          y: basePos.current.y + gs.dy,
        });
      },
      onPanResponderRelease: (_, gs) => {
        basePos.current = {
          x: basePos.current.x + gs.dx,
          y: basePos.current.y + gs.dy,
        };
      },
    })
  ).current;

  // Cosmetic rotation — consistent per photo id, not animated
  const rotDeg = (photo.id.charCodeAt(0) % 7) - 3;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.polaroidOuter,
        { left: photo.x, top: photo.y, transform: [{ scale: photo.scale }] },
      ]}
    >
      {/* Masking tape — centered, slightly overhanging card */}
      <View style={styles.polaroidTapeRow}>
        <MaskingTape width={74} color={tapeColor} />

        {/* Transform controls placed NEXT TO the masking tape, outside the card */}
        <View style={styles.polaroidTapeControls}>
          {/* Toggle transform mode button */}
          <TouchableOpacity
            style={[styles.polaroidToggleBtn, photo.isTransformMode && styles.polaroidToggleBtnOn]}
            onPress={() => onToggleTransform(photo.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={photo.isTransformMode ? 'move' : 'expand-outline'}
              size={12}
              color={photo.isTransformMode ? Colors.white : Colors.textLight}
            />
          </TouchableOpacity>

          {/* Remove button — only in transform mode */}
          {photo.isTransformMode && (
            <TouchableOpacity
              style={styles.polaroidRemoveBtn}
              onPress={() => onRemove(photo.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={11} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* White polaroid card — slight rotation for charm */}
      <View style={[
        styles.polaroidCard,
        { transform: [{ rotate: `${rotDeg}deg` }] },
        photo.isTransformMode && styles.polaroidCardActive,
      ]}>
        {/* Scale controls — inside bottom of card, only in transform mode */}
        {photo.isTransformMode && (
          <View style={styles.polaroidScaleRow}>
            <TouchableOpacity
              style={styles.polaroidScaleBtn}
              onPress={() => onUpdateRef.current(photo.id, { scale: Math.max(0.4, photo.scale - 0.15) })}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="remove-outline" size={12} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.polaroidScaleBtn}
              onPress={() => onUpdateRef.current(photo.id, { scale: Math.min(3.5, photo.scale + 0.15) })}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="add-outline" size={12} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Photo / default cat image */}
        <TouchableOpacity
          onPress={() => !photo.isTransformMode && onPickPhoto(photo.id)}
          activeOpacity={photo.isTransformMode ? 1 : 0.85}
          disabled={photo.isTransformMode}
        >
          <Image
            source={photo.uri ? { uri: photo.uri } : require('@/assets/neko_mascot_final.png')}
            style={styles.polaroidImage}
            contentFit={photo.uri ? 'cover' : 'contain'}
          />
        </TouchableOpacity>

        {/* Polaroid film area at bottom */}
        <View style={styles.polaroidFilm}>
          {!photo.uri && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="camera-outline" size={9} color={Colors.textMuted} />
              <Text style={styles.polaroidHint}>タップして写真</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotebookPageView() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    notebooks, pages, addPage, updatePage, deletePage,
    updateNotebook, toggleFavorite, addSticker, updateSticker, removeSticker,
  } = useAppStore();

  const notebook = useMemo(() => notebooks.find((n) => n.id === id), [notebooks, id]);
  const notebookPages = useMemo(
    () => pages.filter((p) => p.notebookId === id).sort((a, b) => a.pageNumber - b.pageNumber),
    [pages, id]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { pendingSticker, setPendingSticker } = useStickerStore();

  // Multiple polaroid photos on the right page
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  // Measured right page dimensions for sticker canvas + initial photo placement
  const [rightPageDims, setRightPageDims] = useState({ width: 180, height: 400 });

  const currentPage = notebookPages[currentIndex] ?? null;

  // Spread width — fixed width, height fills remaining screen
  const spreadWidth = width - Spacing.md * 2;
  const leftW = Math.floor(spreadWidth * 0.5);
  const rightW = spreadWidth - leftW;

  // Theme based on notebook cover
  const pageTheme = useMemo(
    () => PAGE_THEMES[notebook?.coverTheme ?? 'fluffy'],
    [notebook?.coverTheme]
  );

  // ─── Callbacks ──────────────────────────────────────────────────────────────

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
        x: 16 + Math.random() * (rightPageDims.width - 60),
        y: 16 + Math.random() * (rightPageDims.height - 60),
        scale: 1,
      };
      addSticker(currentPage.id, sticker);
    },
    [currentPage, addSticker, rightPageDims]
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
    if (!notebook || Platform.OS !== 'ios') return;
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

  // Add a new polaroid photo item to the right page
  const handleAddPhoto = useCallback(() => {
    if (!currentPage) return;
    const offset = photos.length * 22;
    const maxX = Math.max(10, rightPageDims.width - 144);
    const maxY = Math.max(24, rightPageDims.height - 180);
    const newPhoto: PhotoItem = {
      id: generateId(),
      uri: null,
      x: Math.max(8, (16 + offset) % maxX),
      y: Math.max(22, (28 + offset) % maxY),
      scale: 1,
      isTransformMode: false,
    };
    setPhotos((prev) => [...prev, newPhoto]);
  }, [currentPage, photos.length, rightPageDims]);

  // Pick gallery photo for a specific polaroid item
  const handlePickPhotoForItem = useCallback(async (photoId: string) => {
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
        const uri = result.assets[0].uri;
        setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, uri } : p)));
      }
    } catch {
      Alert.alert('エラー', '写真の選択に失敗しました。');
    }
  }, []);

  // Stable update — uses functional state to avoid stale closure on photos array
  const handleUpdatePhoto = useCallback((photoId: string, updates: Partial<PhotoItem>) => {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, ...updates } : p)));
  }, []);

  const handleToggleTransform = useCallback((photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, isTransformMode: !p.isTransformMode } : p))
    );
  }, []);

  const handleRemovePhoto = useCallback((photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  // Apply pending sticker from sticker pack modal
  useEffect(() => {
    if (pendingSticker && currentPage) {
      handleAddSticker(pendingSticker);
      setPendingSticker(null);
    }
  }, [pendingSticker, currentPage, handleAddSticker, setPendingSticker]);

  // ─── Guard ───────────────────────────────────────────────────────────────────

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

  const accent = pageTheme.accentColor;

  const pageDate = currentPage
    ? new Date(currentPage.updatedAt).toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : '';

  // Choose right page decorations based on theme
  const renderRightPageDecors = () => {
    const theme = notebook.coverTheme;
    if (theme === 'leather') {
      return (
        <>
          <PawDecor color={pageTheme.decorColor} style={{ position: 'absolute', top: 10, right: 14, zIndex: 0 }} />
          <PawDecor color={pageTheme.decorColor} style={{ position: 'absolute', top: 30, left: 10, zIndex: 0 }} />
          <LadybugDecor size={0} style={{ display: 'none' }} />
        </>
      );
    }
    if (theme === 'fluffy') {
      return (
        <>
          <SakuraDecor size={18} color={Colors.sakura} style={{ position: 'absolute', top: 10, right: 14, zIndex: 0 }} />
          <SakuraDecor size={12} color={Colors.sakura} style={{ position: 'absolute', top: 30, left: 10, zIndex: 0 }} />
          <LadybugDecor size={32} style={{ position: 'absolute', bottom: 60, right: 8, zIndex: 1 }} />
        </>
      );
    }
    if (theme === 'spring') {
      return (
        <>
          <SakuraDecor size={18} color="#FFB7C5" style={{ position: 'absolute', top: 10, right: 14, zIndex: 0 }} />
          <SakuraDecor size={14} color="#F9A8C9" style={{ position: 'absolute', top: 30, left: 10, zIndex: 0 }} />
          <SakuraDecor size={10} color="#FFB7C5" style={{ position: 'absolute', bottom: 70, left: 12, zIndex: 0 }} />
        </>
      );
    }
    if (theme === 'blue') {
      return (
        <>
          <SakuraDecor size={16} color="#A8D8EA" style={{ position: 'absolute', top: 10, right: 14, zIndex: 0 }} />
          <CloverDecor size={20} style={{ position: 'absolute', top: 30, left: 10, zIndex: 0 }} />
          <SakuraDecor size={12} color="#A8D8EA" style={{ position: 'absolute', bottom: 70, right: 14, zIndex: 0 }} />
        </>
      );
    }
    return null;
  };

  const renderLeftPageDecors = () => {
    const theme = notebook.coverTheme;
    if (theme === 'leather') {
      return (
        <>
          <PawDecor color={pageTheme.decorColor} style={{ position: 'absolute', bottom: 12, right: 8 }} />
          <PawDecor color={pageTheme.decorColor} style={{ position: 'absolute', bottom: 14, left: 14 }} />
        </>
      );
    }
    if (theme === 'spring') {
      return (
        <>
          <SakuraDecor size={14} color="#FFB7C5" style={{ position: 'absolute', bottom: 12, right: 8 }} />
          <SakuraDecor size={10} color="#F9A8C9" style={{ position: 'absolute', bottom: 14, left: 14 }} />
        </>
      );
    }
    if (theme === 'blue') {
      return (
        <>
          <CloverDecor size={18} style={{ position: 'absolute', bottom: 12, right: 8 }} />
          <SakuraDecor size={12} color="#A8D8EA" style={{ position: 'absolute', bottom: 14, left: 14 }} />
        </>
      );
    }
    return (
      <>
        <PawDecor style={{ position: 'absolute', bottom: 12, right: 8 }} />
        <SakuraDecor size={14} style={{ position: 'absolute', bottom: 14, left: 14 }} />
      </>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* Top stamp bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.stampRow}
        >
          <StampButton
            icon="add-circle-outline"
            label="ページ追加"
            onPress={handleAddPage}
            color={accent}
          />
          <StampButton
            icon="camera-outline"
            label="写真追加"
            onPress={handleAddPhoto}
            color={Colors.accent}
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
        </ScrollView>

        {/* More options */}
        <TouchableOpacity onPress={handleRenameNotebook} style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={18} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Notebook title */}
      <TouchableOpacity onLongPress={handleRenameNotebook} style={styles.notebookTitleWrap}>
        <Text style={styles.notebookTitle} numberOfLines={1}>{notebook.title}</Text>
      </TouchableOpacity>

      {/* Book spread — fills remaining screen height */}
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
              { width: spreadWidth, transform: [{ translateX: slideAnim }] },
              Shadow.large,
            ]}
          >
            {/* Left page — writing */}
            <View style={[styles.leftPage, { width: leftW, backgroundColor: pageTheme.leftBg }]}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View key={i} style={[styles.ruleLine, { top: 50 + i * 26, backgroundColor: pageTheme.ruleLine }]} />
              ))}
              <TextInput
                style={styles.pageTitle}
                placeholder=""
                placeholderTextColor={Colors.textMuted}
                value={currentPage?.title ?? ''}
                onChangeText={(t) => currentPage && updatePage(currentPage.id, { title: t })}
                maxLength={60}
              />
              <Text style={[styles.pageDate, { color: pageTheme.dateColor }]}>{pageDate}</Text>
              <ScrollView
                style={styles.pageContentScroll}
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
              {renderLeftPageDecors()}
            </View>

            {/* Spine */}
            <View style={styles.spine}>
              <View style={styles.spineInner} />
            </View>

            {/* Right page — photos + stickers */}
            <View
              style={[styles.rightPage, { width: rightW, backgroundColor: pageTheme.rightBg }]}
              onLayout={(e) =>
                setRightPageDims({
                  width: e.nativeEvent.layout.width,
                  height: e.nativeEvent.layout.height,
                })
              }
            >
              {/* Polaroid photo items */}
              {photos.map((photo) => (
                <PolaroidItem
                  key={photo.id}
                  photo={photo}
                  onPickPhoto={handlePickPhotoForItem}
                  onRemove={handleRemovePhoto}
                  onUpdatePhoto={handleUpdatePhoto}
                  onToggleTransform={handleToggleTransform}
                  tapeColor={pageTheme.tapeColor}
                />
              ))}

              {/* Sticker canvas — absolutely covers the right page */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                <StickerCanvas
                  stickers={currentPage?.stickers ?? []}
                  onUpdateSticker={(sid, updates) =>
                    currentPage && updateSticker(currentPage.id, sid, updates)
                  }
                  onRemoveSticker={(sid) => currentPage && removeSticker(currentPage.id, sid)}
                  width={rightPageDims.width}
                  height={rightPageDims.height}
                />
              </View>

              {/* Theme-specific decorations */}
              {renderRightPageDecors()}

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

          {/* Sakura petals framing the spread */}
          <SakuraDecor size={13} color={pageTheme.decorColor} style={{ position: 'absolute', left: 6, top: 16 }} />
          <SakuraDecor size={10} color={pageTheme.decorColor} style={{ position: 'absolute', right: 8, top: 6 }} />

          {/* Page counter — overlaid at bottom of spread */}
          <View style={[styles.pageCounterOverlay, { bottom: insets.bottom + 10 }]}>
            {notebookPages.length > 1 && (
              <TouchableOpacity
                onPress={() => handleNav(-1)}
                disabled={currentIndex === 0}
                style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
              >
                <Ionicons name="chevron-back-circle" size={28} color={accent} />
              </TouchableOpacity>
            )}
            <View style={styles.pageCounterWrap}>
              <Text style={styles.pageCounter}>
                {`${currentIndex + 1} / ${notebookPages.length}`}
              </Text>
            </View>
            {notebookPages.length > 1 && (
              <TouchableOpacity
                onPress={() => handleNav(1)}
                disabled={currentIndex >= notebookPages.length - 1}
                style={[styles.navBtn, currentIndex >= notebookPages.length - 1 && styles.navBtnDisabled]}
              >
                <Ionicons name="chevron-forward-circle" size={28} color={accent} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },

  // Top bar
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
    flexShrink: 0,
  },
  moreBtn: {
    width: 36,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(249,168,201,0.08)',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    flexShrink: 0,
  },
  stampRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  stampBtn: { alignItems: 'center', gap: 3 },
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

  // Title
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

  // Spread — fills remaining height
  spreadWrap: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  spread: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },

  // Left page
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
    flex: 1,
  },
  pageContent: {
    fontFamily: Fonts.handwritten,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 26,
    paddingTop: 2,
    minHeight: 200,
  },

  // Spine
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

  // Right page
  rightPage: {
    backgroundColor: '#FFF5F8',
    position: 'relative',
    overflow: 'hidden',
  },

  // Sticker button
  stickerBtn: {
    position: 'absolute',
    bottom: 12,
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

  // Page counter overlay (absolute, bottom of spread)
  pageCounterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    zIndex: 20,
    paddingHorizontal: Spacing.md,
  },
  navBtn: { padding: 3 },
  navBtnDisabled: { opacity: 0.28 },
  pageCounterWrap: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#5C4A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pageCounter: {
    fontFamily: Fonts.handwritten,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 1,
  },

  // Empty state
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

  // Error
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

  // ─── Masking tape ────────────────────────────────────────────────────────────
  tapeStrip: {
    height: 18,
    backgroundColor: 'rgba(249,168,201,0.72)',
    borderRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 3,
    overflow: 'hidden',
  },

  // ─── Polaroid item ───────────────────────────────────────────────────────────
  polaroidOuter: {
    position: 'absolute',
    alignItems: 'flex-start',
    zIndex: 3,
  },
  polaroidTapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 4,
    marginBottom: -5, // tape overlaps top of card
    gap: 4,
  },
  // Controls displayed next to the tape (not inside the card)
  polaroidTapeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  polaroidCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingTop: 7,
    paddingBottom: 0,
    borderRadius: 3,
    shadowColor: '#5C4A4A',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
    overflow: 'visible',
  },
  polaroidCardActive: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  // Scale +/- row inside the card bottom
  polaroidScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  polaroidImage: {
    width: 116,
    height: 100,
    borderRadius: 2,
    backgroundColor: Colors.surfaceAlt,
  },
  polaroidFilm: {
    width: 116,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 7,
  },
  polaroidHint: {
    fontFamily: Fonts.regular,
    fontSize: 9,
    color: Colors.textMuted,
  },

  // Polaroid control buttons
  polaroidToggleBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  polaroidToggleBtnOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  polaroidRemoveBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  polaroidScaleBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
