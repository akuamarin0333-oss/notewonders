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

export const STICKER_IMAGES: Record<string, ReturnType<typeof require>> = {
  // きもち
  sticker_angry: require('@/assets/sticker_angry.png'),
  sticker_love: require('@/assets/sticker_love.png'),
  sticker_sleepy: require('@/assets/sticker_sleepy.png'),
  sticker_sad: require('@/assets/sticker_sad.png'),
  sticker_surprised: require('@/assets/sticker_surprised.png'),
  sticker_sigh: require('@/assets/sticker_sigh.png'),
  sticker_furious: require('@/assets/sticker_furious.png'),
  sticker_crying: require('@/assets/sticker_crying.png'),
  sticker_neutral: require('@/assets/sticker_neutral.png'),
  // アクション
  sticker_playful: require('@/assets/sticker_playful.png'),
  sticker_waving: require('@/assets/sticker_waving.png'),
  sticker_skating: require('@/assets/sticker_skating.png'),
  sticker_running: require('@/assets/sticker_running.png'),
  sticker_swing: require('@/assets/sticker_swing.png'),
  sticker_surfing: require('@/assets/sticker_surfing.png'),
  sticker_singing: require('@/assets/sticker_singing.png'),
  // はる
  sticker_sakura_cat: require('@/assets/sticker_sakura_cat.png'),
  sticker_flower_garden: require('@/assets/sticker_flower_garden.png'),
  sticker_cherry_blossom: require('@/assets/sticker_cherry_blossom.png'),
  sticker_koinobori: require('@/assets/sticker_koinobori.png'),
  sticker_sakura: require('@/assets/sticker_sakura.png'),
  sticker_easter: require('@/assets/sticker_easter.png'),
  sticker_gardening: require('@/assets/sticker_gardening.png'),
  // なつ
  sticker_fireworks: require('@/assets/sticker_fireworks.png'),
  sticker_watermelon: require('@/assets/sticker_watermelon.png'),
  sticker_hydrangea: require('@/assets/sticker_hydrangea.png'),
  sticker_beach: require('@/assets/sticker_beach.png'),
  sticker_sunflower: require('@/assets/sticker_sunflower.png'),
  sticker_bubbles: require('@/assets/sticker_bubbles.png'),
  // あき
  sticker_autumn_leaves: require('@/assets/sticker_autumn_leaves.png'),
  sticker_art_cat: require('@/assets/sticker_art_cat.png'),
  sticker_halloween_pumpkin: require('@/assets/sticker_halloween_pumpkin.png'),
  sticker_halloween_witch: require('@/assets/sticker_halloween_witch.png'),
  // ふゆ
  sticker_snowball: require('@/assets/sticker_snowball.png'),
  sticker_kotatsu: require('@/assets/sticker_kotatsu.png'),
  sticker_cozy_fireplace: require('@/assets/sticker_cozy_fireplace.png'),
  sticker_christmas_elf: require('@/assets/sticker_christmas_elf.png'),
  sticker_christmas_tree: require('@/assets/sticker_christmas_tree.png'),
  sticker_newyear: require('@/assets/sticker_newyear.png'),
  sticker_rainy_cat: require('@/assets/sticker_rainy_cat.png'),
};

export function getStickerSource(type: StickerType, customUri?: string) {
  if (type === 'custom' && customUri) {
    return { uri: customUri };
  }
  return STICKER_IMAGES[type] ?? STICKER_IMAGES['sticker_angry'];
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

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleBackgroundPress = useCallback(() => {
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
