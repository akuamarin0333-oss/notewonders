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
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Ellipse, Line } from 'react-native-svg';
import { useAppStore } from '@/store/useAppStore';
import { useStickerStore } from '@/store/useStickerStore';
import StickerCanvas from '@/components/StickerCanvas';
import { Colors, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import { useTranslation } from '@/constants/i18n';
import type { CoverTheme, Sticker } from '@/store/types';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Book spine width
const SPINE_W = 14;
// Line spacing for ruled lines
const LINE_SPACING = 26;
// Padding from page top
const PAGE_TOP_PADDING = 12;
// Date/title header height before content starts
const HEADER_HEIGHT = 52;

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
  spineColor: string;
  spineAccent: string;
  coverEdgeColor: string;
}

const PAGE_THEMES: Record<CoverTheme, PageTheme> = {
  leather: {
    leftBg: '#FBF5EE',
    rightBg: '#F7EFE4',
    ruleLine: '#D4C4A8',
    dateColor: '#8B6340',
    tapeColor: 'rgba(196,149,106,0.72)',
    accentColor: '#C4956A',
    decorColor: '#C4956A',
    spineColor: '#6B4420',
    spineAccent: '#8B5A2B',
    coverEdgeColor: '#7A4E28',
  },
  fluffy: {
    leftBg: '#FFFEF8',
    rightBg: '#FFF5F8',
    ruleLine: '#EDD5DC',
    dateColor: Colors.primary,
    tapeColor: 'rgba(249,168,201,0.72)',
    accentColor: Colors.primary,
    decorColor: Colors.sakura,
    spineColor: '#C4845A',
    spineAccent: '#D4956A',
    coverEdgeColor: '#C07040',
  },
  spring: {
    leftBg: '#FFF8FC',
    rightBg: '#FFF0F7',
    ruleLine: '#F5C8D8',
    dateColor: '#D45B7A',
    tapeColor: 'rgba(244,114,162,0.65)',
    accentColor: '#D45B7A',
    decorColor: '#FFB7C5',
    spineColor: '#8B4050',
    spineAccent: '#A05060',
    coverEdgeColor: '#7A3545',
  },
  blue: {
    leftBg: '#F0F8FF',
    rightBg: '#E8F4FC',
    ruleLine: '#B8D8F0',
    dateColor: '#4A90C4',
    tapeColor: 'rgba(100,180,230,0.65)',
    accentColor: '#4A90C4',
    decorColor: '#A8D8EA',
    spineColor: '#2E6DA0',
    spineAccent: '#3A80B8',
    coverEdgeColor: '#2860A0',
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

  const rotDeg = (photo.id.charCodeAt(0) % 7) - 3;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.polaroidOuter,
        { left: photo.x, top: photo.y, transform: [{ scale: photo.scale }] },
      ]}
    >
      <View style={styles.polaroidTapeRow}>
        <MaskingTape width={74} color={tapeColor} />
        <View style={styles.polaroidTapeControls}>
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

      <View style={[
        styles.polaroidCard,
        { transform: [{ rotate: `${rotDeg}deg` }] },
        photo.isTransformMode && styles.polaroidCardActive,
      ]}>
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

        <TouchableOpacity
          onPress={() => !photo.isTransformMode && onPickPhoto(photo.id)}
          activeOpacity={photo.isTransformMode ? 1 : 0.85}
          disabled={photo.isTransformMode}
        >
          <Image
            source={photo.uri ? { uri: photo.uri } : require('@/assets/neko_mascot_latest.png')}
            style={styles.polaroidImage}
            contentFit={photo.uri ? 'cover' : 'contain'}
          />
        </TouchableOpacity>

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

// ─── Real notebook spread with spine, page curl and paper texture ────────────

// ─── Ruled lines overlay for the left page ───────────────────────────────────

function RuledLines({
  width,
  height,
  color,
  startY,
}: {
  width: number;
  height: number;
  color: string;
  startY: number;
}) {
  const lines = [];
  for (let y = startY; y < height - 10; y += LINE_SPACING) {
    lines.push(
      <Line
        key={y}
        x1={10}
        y1={y}
        x2={width - 10}
        y2={y}
        stroke={color}
        strokeWidth={0.8}
        opacity={0.7}
      />
    );
  }
  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      {lines}
    </Svg>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotebookPageView() {
  const insets = useSafeAreaInsets();
  const { width, height: screenHeight } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTranslation();
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

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [rightPageDims, setRightPageDims] = useState({ width: 180, height: 400 });

  // Custom confirmation dialog state (replaces Alert.alert which is blocked in sandboxed web)
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ visible: false, title: '', message: '', onConfirm: () => {} });

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

  const currentPage = notebookPages[currentIndex] ?? null;

  const spreadWidth = width - Spacing.sm * 2;
  // Spine is 14px, left and right split evenly
  const SPINE_W = 14;
  const leftW = Math.floor((spreadWidth - SPINE_W) * 0.48);
  const rightW = spreadWidth - SPINE_W - leftW;

  const pageTheme = useMemo(
    () => PAGE_THEMES[notebook?.coverTheme ?? 'fluffy'],
    [notebook?.coverTheme]
  );

  // Compute available spread height
  const topBarHeight = insets.top + 70;
  const titleBarHeight = 28;
  const bottomNavHeight = insets.bottom + 50;
  const spreadHeight = screenHeight - topBarHeight - titleBarHeight - bottomNavHeight;

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

  const handleDeletePage = useCallback(() => {
    if (!currentPage) return;
    const doDelete = () => {
      setPhotos([]);
      deletePage(currentPage.id);
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    };
    showConfirm(
      'ページを削除',
      'このページ（テキスト・写真・ステッカー全て）を削除しますか？',
      doDelete
    );
  }, [currentPage, deletePage, showConfirm]);

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

  const handlePickPhotoForItem = useCallback(async (photoId: string) => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('許可が必要です', 'フォトライブラリへのアクセスを許可してください。');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as ImagePicker.MediaType,
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

  useEffect(() => {
    if (!pendingSticker || !currentPage) return;
    // Clear pendingSticker BEFORE adding to prevent double-fire:
    // addSticker updates pages → currentPage changes → this effect would re-run
    // but pendingSticker will already be null so the guard exits early.
    const sticker = pendingSticker;
    setPendingSticker(null);
    const newSticker: Sticker = {
      id: generateId(),
      type: sticker.type,
      customUri: sticker.customUri,
      x: 16 + Math.random() * (rightPageDims.width - 72),
      y: 16 + Math.random() * (rightPageDims.height - 72),
      scale: 1,
    };
    addSticker(currentPage.id, newSticker);
  }, [pendingSticker, currentPage, setPendingSticker, addSticker, rightPageDims]);

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
          <SakuraDecor size={18} color="#A8D8EA" style={{ position: 'absolute', top: 10, right: 14, zIndex: 0 }} />
          <SakuraDecor size={12} color="#7EC8E3" style={{ position: 'absolute', top: 30, left: 10, zIndex: 0 }} />
          <LadybugDecor size={28} style={{ position: 'absolute', bottom: 60, right: 8, zIndex: 1 }} />
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
          <SakuraDecor size={14} color="#A8D8EA" style={{ position: 'absolute', bottom: 12, right: 8 }} />
          <SakuraDecor size={10} color="#7EC8E3" style={{ position: 'absolute', bottom: 14, left: 14 }} />
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

  const bgColor = notebook.coverTheme === 'blue' ? '#4A90C4' : '#C8A882';

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      {/* Wooden table / fabric texture background */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Subtle wood grain lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 60 + i * 80,
              height: 1,
              backgroundColor: 'rgba(160,120,80,0.18)',
            }}
          />
        ))}
      </View>

      {/* Top stamp bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={22} color="#FFF5EB" />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.stampRow}
        >
          <StampButton
            icon="add-circle-outline"
            label={t.addPage}
            onPress={handleAddPage}
            color={accent}
          />
          <StampButton
            icon="camera-outline"
            label={t.addPhoto}
            onPress={handleAddPhoto}
            color={Colors.accent}
          />
          <StampButton
            icon={currentPage?.isFavorite ? 'bookmark' : 'bookmark-outline'}
            label={t.favorite}
            onPress={() => currentPage && toggleFavorite(currentPage.id)}
            color={Colors.accentGreen}
            active={currentPage?.isFavorite}
          />
          <StampButton
            icon="home-outline"
            label={t.homeBtn}
            onPress={() => router.push('/(tabs)')}
            color={Colors.textLight}
          />
          {currentPage !== null && (
            <StampButton
              icon="trash-outline"
              label={t.deleteBtn}
              onPress={handleDeletePage}
              color={Colors.error}
            />
          )}
        </ScrollView>

        <TouchableOpacity onPress={handleRenameNotebook} style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={18} color="#FFF5EB" />
        </TouchableOpacity>
      </View>

      {/* Notebook title */}
      <TouchableOpacity onLongPress={handleRenameNotebook} style={styles.notebookTitleWrap}>
        <Text style={styles.notebookTitle} numberOfLines={1}>{notebook.title}</Text>
      </TouchableOpacity>

      {/* Book spread */}
      {notebookPages.length === 0 ? (
        <View style={styles.emptyNotebook}>
          <Image
            source={require('@/assets/neko_mascot_latest.png')}
            style={{ width: 100, height: 100 }}
            contentFit="contain"
          />
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
              {
                transform: [{ translateX: slideAnim }],
                alignItems: 'center',
              },
            ]}
          >
            {/* Real book spread */}
            <View
              style={[
                styles.bookOuter,
                {
                  width: spreadWidth,
                  height: spreadHeight,
                  shadowColor: '#2A1A0A',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.45,
                  shadowRadius: 18,
                  elevation: 16,
                },
              ]}
            >
              {/* Cover edge - top strip */}
              <View
                style={{
                  height: 8,
                  backgroundColor: pageTheme.coverEdgeColor,
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                }}
              />

              {/* Pages area */}
              <View style={{ flex: 1, flexDirection: 'row' }}>
                {/* Left page — writing */}
                <View
                  style={[
                    styles.leftPage,
                    {
                      width: leftW,
                      backgroundColor: pageTheme.leftBg,
                    },
                  ]}
                >
                  {/* Ruled lines drawn as SVG below content */}
                  <RuledLines
                    width={leftW}
                    height={spreadHeight - 16}
                    color={pageTheme.ruleLine}
                    startY={PAGE_TOP_PADDING + HEADER_HEIGHT}
                  />

                  {/* Left red margin line */}
                  <View
                    style={{
                      position: 'absolute',
                      left: 28,
                      top: PAGE_TOP_PADDING + HEADER_HEIGHT - 6,
                      bottom: 8,
                      width: 1,
                      backgroundColor: 'rgba(230,100,100,0.3)',
                    }}
                  />

                  {/* Page content: title + date + text input */}
                  <View style={styles.leftPageContent}>
                    <TextInput
                      style={[styles.pageTitle, { color: pageTheme.dateColor }]}
                      placeholder="タイトル..."
                      placeholderTextColor={`${pageTheme.dateColor}60`}
                      value={currentPage?.title ?? ''}
                      onChangeText={(t) => currentPage && updatePage(currentPage.id, { title: t })}
                      maxLength={60}
                      multiline
                      numberOfLines={2}
                      scrollEnabled={false}
                    />
                    <Text style={[styles.pageDate, { color: pageTheme.dateColor }]}>{pageDate}</Text>

                    {/* Inline text on ruled lines — no border, handwriting style */}
                    <TextInput
                      style={[
                        styles.pageContent,
                        {
                          color: Colors.text,
                          lineHeight: LINE_SPACING,
                          // Offset text to sit ON the rule line (baseline)
                          paddingTop: LINE_SPACING - 18,
                        },
                      ]}
                      multiline
                      placeholder=""
                      placeholderTextColor={Colors.textMuted}
                      value={currentPage?.content ?? ''}
                      onChangeText={(t) => currentPage && updatePage(currentPage.id, { content: t })}
                      textAlignVertical="top"
                      scrollEnabled={false}
                    />
                  </View>

                  {renderLeftPageDecors()}
                </View>

                {/* Spine — realistic book spine */}
                <View style={[styles.spine, { backgroundColor: pageTheme.spineColor }]}>
                  {/* Spine highlight */}
                  <View
                    style={{
                      position: 'absolute',
                      left: 2,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                    }}
                  />
                  {/* Center shadow line */}
                  <View style={styles.spineInner} />
                  {/* Right shadow */}
                  <View
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      backgroundColor: 'rgba(0,0,0,0.25)',
                    }}
                  />
                </View>

                {/* Right page — photos + stickers */}
                <View
                  style={[
                    styles.rightPage,
                    {
                      width: rightW,
                      backgroundColor: pageTheme.rightBg,
                    },
                  ]}
                  onLayout={(e) =>
                    setRightPageDims({
                      width: e.nativeEvent.layout.width,
                      height: e.nativeEvent.layout.height,
                    })
                  }
                >
                  {/* Subtle dot grid on right page */}
                  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                    <Svg width={rightW} height={spreadHeight - 16} style={StyleSheet.absoluteFillObject}>
                      {Array.from({ length: Math.ceil((spreadHeight - 16) / 18) }).map((_, row) =>
                        Array.from({ length: Math.ceil(rightW / 18) }).map((__, col) => (
                          <Circle
                            key={`${row}-${col}`}
                            cx={8 + col * 18}
                            cy={8 + row * 18}
                            r={0.9}
                            fill={pageTheme.ruleLine}
                            opacity={0.5}
                          />
                        ))
                      )}
                    </Svg>
                  </View>

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

                  {/* Sticker canvas */}
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
              </View>

              {/* Cover edge - bottom strip */}
              <View
                style={{
                  height: 8,
                  backgroundColor: pageTheme.coverEdgeColor,
                  borderBottomLeftRadius: 6,
                  borderBottomRightRadius: 6,
                }}
              />
            </View>
          </Animated.View>

          {/* Page counter */}
          <View style={[styles.pageCounterOverlay, { bottom: insets.bottom + 6 }]}>
            {notebookPages.length > 1 && (
              <TouchableOpacity
                onPress={() => handleNav(-1)}
                disabled={currentIndex === 0}
                style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
              >
                <Ionicons name="chevron-back-circle" size={28} color="#FFF5EB" />
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
                <Ionicons name="chevron-forward-circle" size={28} color="#FFF5EB" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Custom web-safe confirmation dialog */}
      <Modal
        visible={confirmDialog.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDialog((d) => ({ ...d, visible: false }))}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
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
                <Text style={styles.confirmDeleteText}>削除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },

  // Top bar (on the brown background)
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backIcon: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,245,235,0.25)',
    marginTop: 4,
    flexShrink: 0,
  },
  moreBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,245,235,0.2)',
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

  // Title (on brown bg)
  notebookTitleWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 6,
  },
  notebookTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 16,
    color: '#FFF5EB',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Book outer wrapper
  bookOuter: {
    borderRadius: 6,
    overflow: 'hidden',
  },

  // Cover edges (top/bottom strips showing the cover)
  coverEdgeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    zIndex: 2,
  },
  coverEdgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    zIndex: 2,
  },

  // Page depth shadows
  leftPageShadow: {
    position: 'absolute',
    left: 0,
    top: 7,
    width: 12,
    zIndex: 1,
    // Dark gradient from the spine outward (simulated with opacity)
    backgroundColor: 'rgba(0,0,0,0)',
  },
  rightPageShadow: {
    position: 'absolute',
    right: 0,
    top: 7,
    width: 12,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0)',
  },

  // Spread container
  spreadWrap: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: Spacing.sm,
  },

  // Left page
  leftPage: {
    position: 'relative',
    overflow: 'hidden',
  },
  leftPageContent: {
    position: 'absolute',
    top: PAGE_TOP_PADDING,
    left: 30, // after margin line
    right: 8,
    bottom: 8,
    zIndex: 2,
  },
  pageTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 15,
    fontStyle: 'italic',
    paddingVertical: 0,
    marginBottom: 2,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    outlineWidth: 0,
    outlineStyle: 'none',
    outline: 'none',
    flexShrink: 1,
    flexWrap: 'wrap',
  } as object,
  pageDate: {
    fontFamily: Fonts.handwritten,
    fontSize: 12,
    marginBottom: 4,
  },
  // Text input that sits directly on ruled lines, no borders
  pageContent: {
    fontFamily: Fonts.handwritten,
    fontSize: 14.5,
    color: Colors.text,
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
    // No outline on web
    outlineWidth: 0,
    outlineStyle: 'none',
    outline: 'none',
  } as object,

  // Spine — realistic brown book spine
  spine: {
    width: SPINE_W,
    position: 'relative',
    overflow: 'hidden',
  },
  spineInner: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  // Right page
  rightPage: {
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

  // Page counter overlay
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
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255,245,235,0.3)',
  },
  pageCounter: {
    fontFamily: Fonts.handwritten,
    fontSize: 14,
    color: '#FFF5EB',
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
    color: '#FFF5EB',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  addPageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
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
    marginBottom: -5,
    gap: 4,
  },
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

  // ─── Custom confirmation dialog (web-safe) ─────────────────────────────────
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  confirmCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 340,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 20,
    color: Colors.text,
    textAlign: 'center',
  },
  confirmMessage: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textLight,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.white,
  },
});
