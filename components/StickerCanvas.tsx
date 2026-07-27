import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  Text,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import type { Sticker, StickerType } from '@/store/types';
import { Colors } from '@/constants/Theme';

// ─── Static image map ────────────────────────────────────────────────────────

export const STICKER_IMAGES: Record<string, number> = {
  // きもち + アクション
  sticker_smiley_green: require('@/assets/sticker_smiley_green.png'),
  sticker_music_notes: require('@/assets/sticker_music_notes.png'),
  sticker_moon_stars: require('@/assets/sticker_moon_stars.png'),
  sticker_zzz_bunny: require('@/assets/sticker_zzz_bunny.png'),
  sticker_gift_box: require('@/assets/sticker_gift_box.png'),
  sticker_bath_duck: require('@/assets/sticker_bath_duck.png'),
  sticker_boba_tea: require('@/assets/sticker_boba_tea.png'),
  // ハート
  sticker_hearts_double: require('@/assets/sticker_hearts_double.png'),
  sticker_heart_green: require('@/assets/sticker_heart_green.png'),
  sticker_heart_arrow: require('@/assets/sticker_heart_arrow.png'),
  sticker_heart_sparkle: require('@/assets/sticker_heart_sparkle.png'),
  // ネコ
  sticker_cat_snowman: require('@/assets/sticker_cat_snowman.png'),
  // はる
  sticker_flower_garden: require('@/assets/sticker_flower_garden.png'),
  sticker_cherry_blossom: require('@/assets/sticker_cherry_blossom.png'),
  sticker_sakura: require('@/assets/sticker_sakura.png'),
  // なつ
  sticker_fireworks: require('@/assets/sticker_fireworks.png'),
  sticker_beach: require('@/assets/sticker_beach.png'),
  sticker_sunflower: require('@/assets/sticker_sunflower.png'),
  // あき
  sticker_autumn_leaves: require('@/assets/sticker_autumn_leaves.png'),
  sticker_halloween_pumpkin: require('@/assets/sticker_halloween_pumpkin.png'),
  // ふゆ
  sticker_kotatsu: require('@/assets/sticker_kotatsu.png'),
  sticker_christmas_tree: require('@/assets/sticker_christmas_tree.png'),
};

export function getStickerSource(type: StickerType, customUri?: string) {
  if (type === 'custom' && customUri) {
    return { uri: customUri };
  }
  return STICKER_IMAGES[type] ?? STICKER_IMAGES['sticker_smiley_green'];
}

// ─── StickerCanvas props ─────────────────────────────────────────────────────

interface StickerCanvasProps {
  stickers: Sticker[];
  onUpdateSticker: (id: string, updates: Partial<Sticker>) => void;
  onRemoveSticker: (id: string) => void;
  width: number;
  height: number;
}

// ─── DraggableSticker ────────────────────────────────────────────────────────

interface DraggableStickerProps {
  sticker: Sticker;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Sticker>) => void;
  onRemove: () => void;
}

const BASE_SIZE = 72;
const SCALE_STEP = 0.2;
const MIN_SCALE = 0.4;
const MAX_SCALE = 4.0;

function DraggableSticker({
  sticker,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}: DraggableStickerProps) {
  const size = BASE_SIZE * sticker.scale;
  const lastPos = useRef({ x: sticker.x, y: sticker.y });
  // Track whether this was a tap (small movement) vs drag
  const didMove = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
      onPanResponderGrant: () => {
        didMove.current = false;
      },
      onPanResponderMove: (_, gs) => {
        didMove.current = true;
        onUpdate({
          x: lastPos.current.x + gs.dx,
          y: lastPos.current.y + gs.dy,
        });
      },
      onPanResponderRelease: (_, gs) => {
        if (!didMove.current) {
          // Tap: toggle select
          onSelect();
        } else {
          lastPos.current = {
            x: lastPos.current.x + gs.dx,
            y: lastPos.current.y + gs.dy,
          };
        }
        didMove.current = false;
      },
    })
  ).current;

  const handleScaleUp = useCallback(() => {
    const next = Math.min(MAX_SCALE, sticker.scale + SCALE_STEP);
    onUpdate({ scale: next });
  }, [sticker.scale, onUpdate]);

  const handleScaleDown = useCallback(() => {
    const next = Math.max(MIN_SCALE, sticker.scale - SCALE_STEP);
    onUpdate({ scale: next });
  }, [sticker.scale, onUpdate]);

  const source = getStickerSource(sticker.type, sticker.customUri);

  return (
    <View
      style={[
        styles.stickerWrapper,
        {
          left: sticker.x,
          top: sticker.y,
          width: size,
          height: size,
          // Elevate selected sticker so its controls appear above siblings
          zIndex: isSelected ? 100 : 1,
        },
      ]}
    >
      {/* Drag handle covers the sticker image */}
      <View {...panResponder.panHandlers} style={StyleSheet.absoluteFillObject}>
        <Image
          source={source}
          style={{ width: size, height: size }}
          contentFit="contain"
        />
      </View>

      {/* Controls — only visible when selected */}
      {isSelected && (
        <>
          {/* Delete button — top right */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onRemove}
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          >
            <Text style={styles.deleteBtnText}>×</Text>
          </TouchableOpacity>

          {/* Scale buttons — left side, vertically centred */}
          <View style={[styles.scaleButtons, { top: size / 2 - 36 }]}>
            <TouchableOpacity
              style={styles.scaleBtn}
              onPress={handleScaleUp}
              hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
            >
              <Text style={styles.scaleBtnText}>＋</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scaleBtn}
              onPress={handleScaleDown}
              hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
            >
              <Text style={styles.scaleBtnText}>－</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// ─── StickerCanvas ───────────────────────────────────────────────────────────

export default function StickerCanvas({
  stickers,
  onUpdateSticker,
  onRemoveSticker,
  width,
  height,
}: StickerCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Track when a sticker was last selected so the background Pressable
  // doesn't immediately deselect it on the same tap event
  const lastSelectTimeRef = useRef(0);

  const handleSelect = useCallback((id: string) => {
    lastSelectTimeRef.current = Date.now();
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleBackgroundPress = useCallback(() => {
    // Suppress deselect if a sticker was selected very recently (same touch)
    if (Date.now() - lastSelectTimeRef.current < 150) return;
    setSelectedId(null);
  }, []);

  return (
    // Outer Pressable catches taps on empty space to deselect
    <Pressable
      style={[styles.canvas, { width, height }]}
      onPress={handleBackgroundPress}
    >
      {stickers.map((sticker) => (
        <DraggableSticker
          key={sticker.id}
          sticker={sticker}
          isSelected={selectedId === sticker.id}
          onSelect={() => handleSelect(sticker.id)}
          onUpdate={(updates) => onUpdateSticker(sticker.id, updates)}
          onRemove={() => {
            setSelectedId(null);
            onRemoveSticker(sticker.id);
          }}
        />
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'relative',
    overflow: 'visible',
  },
  stickerWrapper: {
    position: 'absolute',
  },
  deleteBtn: {
    position: 'absolute',
    top: -9,
    right: -9,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
    zIndex: 10,
  },
  deleteBtnText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  scaleButtons: {
    position: 'absolute',
    left: -30,
    gap: 6,
    alignItems: 'center',
    zIndex: 10,
  },
  scaleBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  scaleBtnText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: 'bold',
  },
});
