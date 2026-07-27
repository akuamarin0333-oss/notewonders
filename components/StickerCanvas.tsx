import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, PanResponder, TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
import type { Sticker, StickerType } from '@/store/types';
import { Colors } from '@/constants/Theme';

// ─── Static image map ───────────────────────────────────────────────────────

export const STICKER_IMAGES: Record<string, ReturnType<typeof require>> = {
  sticker_angry: require('@/assets/sticker_angry.png'),
  sticker_love: require('@/assets/sticker_love.png'),
  sticker_sleepy: require('@/assets/sticker_sleepy.png'),
  sticker_sad: require('@/assets/sticker_sad.png'),
  sticker_surprised: require('@/assets/sticker_surprised.png'),
  sticker_sigh: require('@/assets/sticker_sigh.png'),
  sticker_furious: require('@/assets/sticker_furious.png'),
  sticker_crying: require('@/assets/sticker_crying.png'),
  sticker_neutral: require('@/assets/sticker_neutral.png'),
  sticker_playful: require('@/assets/sticker_playful.png'),
  sticker_waving: require('@/assets/sticker_waving.png'),
  sticker_skating: require('@/assets/sticker_skating.png'),
  sticker_running: require('@/assets/sticker_running.png'),
  sticker_swing: require('@/assets/sticker_swing.png'),
  sticker_surfing: require('@/assets/sticker_surfing.png'),
  sticker_singing: require('@/assets/sticker_singing.png'),
  sticker_sakura: require('@/assets/sticker_sakura.png'),
  sticker_easter: require('@/assets/sticker_easter.png'),
  sticker_gardening: require('@/assets/sticker_gardening.png'),
  sticker_bubbles: require('@/assets/sticker_bubbles.png'),
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
  onUpdate: (updates: Partial<Sticker>) => void;
  onRemove: () => void;
}

function DraggableSticker({ sticker, onUpdate, onRemove }: DraggableStickerProps) {
  const BASE_SIZE = 72;
  const size = BASE_SIZE * sticker.scale;
  const lastPos = useRef({ x: sticker.x, y: sticker.y });
  const lastScale = useRef(sticker.scale);
  // Track pinch: distances between touches
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);

  const getDistance = (touches: { pageX: number; pageY: number }[]) => {
    if (touches.length < 2) return null;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const touches = Array.from(e.nativeEvent.touches);
        if (touches.length === 2) {
          const dist = getDistance(touches as { pageX: number; pageY: number }[]);
          if (dist !== null) {
            pinchStart.current = { dist, scale: lastScale.current };
          }
        }
      },
      onPanResponderMove: (e, gs) => {
        const touches = Array.from(e.nativeEvent.touches);
        if (touches.length === 2 && pinchStart.current) {
          // Pinch to scale
          const dist = getDistance(touches as { pageX: number; pageY: number }[]);
          if (dist !== null) {
            const ratio = dist / pinchStart.current.dist;
            const newScale = Math.min(4, Math.max(0.3, pinchStart.current.scale * ratio));
            lastScale.current = newScale;
            onUpdate({ scale: newScale });
          }
        } else {
          // Drag
          onUpdate({
            x: lastPos.current.x + gs.dx,
            y: lastPos.current.y + gs.dy,
          });
        }
      },
      onPanResponderRelease: (_, gs) => {
        pinchStart.current = null;
        lastPos.current = {
          x: lastPos.current.x + gs.dx,
          y: lastPos.current.y + gs.dy,
        };
      },
    })
  ).current;

  const source = getStickerSource(sticker.type, sticker.customUri);

  return (
    <View
      {...panResponder.panHandlers}
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
      <Image
        source={source}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={onRemove}
        hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
      >
        <Text style={styles.removeBtnText}>×</Text>
      </TouchableOpacity>
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
  const handleUpdate = useCallback(
    (id: string, updates: Partial<Sticker>) => onUpdateSticker(id, updates),
    [onUpdateSticker]
  );
  const handleRemove = useCallback(
    (id: string) => onRemoveSticker(id),
    [onRemoveSticker]
  );

  return (
    <View style={[styles.canvas, { width, height }]}>
      {stickers.map((sticker) => (
        <DraggableSticker
          key={sticker.id}
          sticker={sticker}
          onUpdate={(updates) => handleUpdate(sticker.id, updates)}
          onRemove={() => handleRemove(sticker.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'relative',
    overflow: 'hidden',
  },
  stickerWrapper: {
    position: 'absolute',
  },
  removeBtn: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  removeBtnText: {
    color: Colors.white,
    fontSize: 13,
    lineHeight: 15,
    fontWeight: 'bold',
  },
});
