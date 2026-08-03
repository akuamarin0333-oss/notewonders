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

// ─── Static image map — every key must be a literal require() so Metro can
//     bundle each asset individually.  Do NOT compute keys dynamically.
// ─────────────────────────────────────────────────────────────────────────────

export const STICKER_IMAGES: Record<string, ReturnType<typeof require>> = {
  // きもち + アクション
  sticker_smiley_green:     require('@/assets/sticker_smiley_green.png'),
  sticker_music_notes:      require('@/assets/sticker_music_notes.png'),
  sticker_moon_stars:       require('@/assets/sticker_moon_stars.png'),
  sticker_zzz_bunny:        require('@/assets/sticker_zzz_bunny.png'),
  sticker_gift_box:         require('@/assets/sticker_gift_box.png'),
  sticker_bath_duck:        require('@/assets/sticker_bath_duck.png'),
  sticker_boba_tea:         require('@/assets/sticker_boba_tea.png'),
  // ハート
  sticker_hearts_double:    require('@/assets/sticker_hearts_double.png'),
  sticker_heart_green:      require('@/assets/sticker_heart_green.png'),
  sticker_heart_arrow:      require('@/assets/sticker_heart_arrow.png'),
  sticker_heart_sparkle:    require('@/assets/sticker_heart_sparkle.png'),
  // ネコ — each one is a separate require() with its own literal path
  sticker_autumn_cat:       require('@/assets/sticker_autumn_cat.png'),
  sticker_bath_cat:         require('@/assets/sticker_bath_cat.png'),
  sticker_beach_cat:        require('@/assets/sticker_beach_cat.png'),
  sticker_butterfly_cat:    require('@/assets/sticker_butterfly_cat.png'),
  sticker_cat_snowman:      require('@/assets/sticker_cat_snowman.png'),
  sticker_cloud_cat:        require('@/assets/sticker_cloud_cat.png'),
  sticker_cooking_cat:      require('@/assets/sticker_cooking_cat.png'),
  sticker_festival_cat:     require('@/assets/sticker_festival_cat.png'),
  sticker_flower_cat:       require('@/assets/sticker_flower_cat.png'),
  sticker_icecream_cat:     require('@/assets/sticker_icecream_cat.png'),
  sticker_moon_cat:         require('@/assets/sticker_moon_cat.png'),
  sticker_onsen_cat:        require('@/assets/sticker_onsen_cat.png'),
  sticker_pancake_cat:      require('@/assets/sticker_pancake_cat.png'),
  sticker_pumpkin_cat:      require('@/assets/sticker_pumpkin_cat.png'),
  sticker_shopping_cat:     require('@/assets/sticker_shopping_cat.png'),
  sticker_snowy_cat:        require('@/assets/sticker_snowy_cat.png'),
  sticker_stargazing_cat:   require('@/assets/sticker_stargazing_cat.png'),
  sticker_sunny_cat:        require('@/assets/sticker_sunny_cat.png'),
  sticker_thunder_cat:      require('@/assets/sticker_thunder_cat.png'),
  sticker_winter_cat:       require('@/assets/sticker_winter_cat.png'),
  // はる
  sticker_flower_garden:    require('@/assets/sticker_flower_garden.png'),
  sticker_cherry_blossom:   require('@/assets/sticker_cherry_blossom.png'),
  sticker_sakura:           require('@/assets/sticker_sakura.png'),
  // なつ
  sticker_fireworks:        require('@/assets/sticker_fireworks.png'),
  sticker_beach:            require('@/assets/sticker_beach.png'),
  sticker_sunflower:        require('@/assets/sticker_sunflower.png'),
  // あき
  sticker_autumn_leaves:    require('@/assets/sticker_autumn_leaves.png'),
  sticker_halloween_pumpkin: require('@/assets/sticker_halloween_pumpkin.png'),
  // ふゆ
  sticker_kotatsu:          require('@/assets/sticker_kotatsu.png'),
  sticker_christmas_tree:   require('@/assets/sticker_christmas_tree.png'),
};

export function getStickerSource(type: StickerType, customUri?: string) {
  if (type === 'custom' && customUri) {
    return { uri: customUri };
  }
  const asset = STICKER_IMAGES[type];
  // Explicit check: only fall back when the key is truly missing
  if (asset === undefined || asset === null) {
    return STICKER_IMAGES['sticker_smiley_green'];
  }
  return asset;
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

const BASE_SIZE  = 72;
const SCALE_STEP = 0.2;
const MIN_SCALE  = 0.4;
const MAX_SCALE  = 4.0;

function DraggableSticker({
  sticker,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}: DraggableStickerProps) {
  const size     = BASE_SIZE * sticker.scale;
  const lastPos  = useRef({ x: sticker.x, y: sticker.y });
  const didMove  = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, gs) =>
        Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
      onPanResponderGrant: () => {
        didMove.current = false;
      },
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5) {
          didMove.current = true;
          onUpdate({
            x: lastPos.current.x + gs.dx,
            y: lastPos.current.y + gs.dy,
          });
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (!didMove.current) {
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
    onUpdate({ scale: Math.min(MAX_SCALE, sticker.scale + SCALE_STEP) });
  }, [sticker.scale, onUpdate]);

  const handleScaleDown = useCallback(() => {
    onUpdate({ scale: Math.max(MIN_SCALE, sticker.scale - SCALE_STEP) });
  }, [sticker.scale, onUpdate]);

  const source = getStickerSource(sticker.type, sticker.customUri);

  return (
    <View
      style={[
        styles.stickerWrapper,
        {
          left:   sticker.x,
          top:    sticker.y,
          width:  size,
          height: size,
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
          // Disable caching so each sticker always loads its own asset
          cachePolicy="none"
        />
      </View>

      {/* Controls — only visible when selected */}
      {isSelected && (
        <>
          {/* Delete (×) button — top-left */}
          <View
            style={styles.deleteBtn}
            onStartShouldSetResponder={() => true}
            onResponderGrant={onRemove}
          >
            <Text style={styles.deleteBtnText}>×</Text>
          </View>

          {/* Scale buttons — right side, with generous gap between + and − */}
          <View style={[styles.scaleButtons, { top: size / 2 - 46 }]}>
            <View
              style={styles.scaleBtn}
              onStartShouldSetResponder={() => true}
              onResponderGrant={handleScaleUp}
            >
              <Text style={styles.scaleBtnText}>＋</Text>
            </View>
            {/* Spacer for easier tap targets */}
            <View style={styles.scaleSpacer} />
            <View
              style={styles.scaleBtn}
              onStartShouldSetResponder={() => true}
              onResponderGrant={handleScaleDown}
            >
              <Text style={styles.scaleBtnText}>－</Text>
            </View>
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
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const lastSelectTimeRef               = useRef(0);

  const handleSelect = useCallback((id: string) => {
    lastSelectTimeRef.current = Date.now();
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleBackgroundPress = useCallback(() => {
    if (Date.now() - lastSelectTimeRef.current < 150) return;
    setSelectedId(null);
  }, []);

  return (
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
    overflow: 'visible',
  },
  // Delete button — top-left of the sticker
  deleteBtn: {
    position:        'absolute',
    top:             -9,
    left:            -9,
    width:           24,
    height:          24,
    borderRadius:    12,
    backgroundColor: '#E53935',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.25,
    shadowRadius:    2,
    elevation:       4,
    zIndex:          10,
  },
  deleteBtnText: {
    color:      Colors.white,
    fontSize:   15,
    lineHeight: 17,
    fontWeight: 'bold',
  },
  // Scale buttons — right side of the sticker
  scaleButtons: {
    position:  'absolute',
    right:     -30,
    alignItems: 'center',
    zIndex:    10,
  },
  scaleBtn: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: Colors.primaryDark,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.2,
    shadowRadius:    2,
    elevation:       3,
  },
  scaleSpacer: {
    height: 8,
  },
  scaleBtnText: {
    color:      Colors.white,
    fontSize:   15,
    lineHeight: 17,
    fontWeight: 'bold',
  },
});
