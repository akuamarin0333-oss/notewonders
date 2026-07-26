import React, { useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Ellipse, Rect } from 'react-native-svg';
import type { Sticker, StickerType } from '@/store/types';
import { Colors } from '@/constants/Theme';

interface StickerCanvasProps {
  stickers: Sticker[];
  onUpdateSticker: (id: string, updates: Partial<Sticker>) => void;
  onRemoveSticker: (id: string) => void;
  width: number;
  height: number;
}

// SVG sticker definitions
function renderStickerSvg(type: StickerType, size: number) {
  const s = size;
  switch (type) {
    case 'cat':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Circle cx={20} cy={20} r={14} fill="#FFF0E6" />
          <Path d="M10 14 L6 6 L14 12Z" fill="#FFF0E6" />
          <Path d="M30 14 L34 6 L26 12Z" fill="#FFF0E6" />
          <Path d="M10.5 13.5 L7.5 7.5 L13.5 12Z" fill="#F9A8C9" />
          <Path d="M29.5 13.5 L32.5 7.5 L26.5 12Z" fill="#F9A8C9" />
          <Ellipse cx={14} cy={21} rx={3} ry={2} fill="#F9A8C9" opacity={0.5} />
          <Ellipse cx={26} cy={21} rx={3} ry={2} fill="#F9A8C9" opacity={0.5} />
          <Path d="M14 17 Q16 15 18 17" stroke="#5C4A4A" strokeWidth={1.2} fill="none" strokeLinecap="round" />
          <Path d="M22 17 Q24 15 26 17" stroke="#5C4A4A" strokeWidth={1.2} fill="none" strokeLinecap="round" />
          <Path d="M19 22 L20 20 L21 22Z" fill="#F9A8C9" />
          <Path d="M17 24 Q20 27 23 24" stroke="#5C4A4A" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'sakura':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Path d="M20 5 C18 9 14 10 12 10 C14 13 14 16 12 18 C15 17 17 18 18 20 C19 18 21 17 24 18 C22 16 22 13 24 10 C22 10 22 9 20 5Z" fill="#FFB7C5" />
          <Path d="M20 35 C18 31 14 30 12 30 C14 27 14 24 12 22 C15 23 17 22 18 20 C19 22 21 23 24 22 C22 24 22 27 24 30 C22 30 22 31 20 35Z" fill="#FFB7C5" />
          <Path d="M5 20 C9 18 10 14 10 12 C13 14 16 14 18 12 C17 15 18 17 20 18 C18 19 17 21 18 24 C16 22 13 22 10 24 C10 22 9 22 5 20Z" fill="#FFB7C5" />
          <Path d="M35 20 C31 18 30 14 30 12 C27 14 24 14 22 12 C23 15 22 17 20 18 C22 19 23 21 22 24 C24 22 27 22 30 24 C30 22 31 22 35 20Z" fill="#FFB7C5" />
          <Circle cx={20} cy={20} r={4} fill="#FFE4EC" />
          <Circle cx={20} cy={20} r={2} fill="#F9A8C9" />
        </Svg>
      );
    case 'ladybug':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Ellipse cx={20} cy={22} rx={12} ry={10} fill="#E53935" />
          <Path d="M20 12 C14 12 8 17 8 22 Q8 14 20 12Z" fill="#1a1a1a" />
          <Path d="M20 12 C26 12 32 17 32 22 Q32 14 20 12Z" fill="#1a1a1a" />
          <Path d="M20 12 L20 32" stroke="#1a1a1a" strokeWidth={1.5} />
          <Circle cx={14} cy={22} r={3} fill="#1a1a1a" />
          <Circle cx={26} cy={22} r={3} fill="#1a1a1a" />
          <Circle cx={16} cy={28} r={2} fill="#1a1a1a" />
          <Circle cx={24} cy={28} r={2} fill="#1a1a1a" />
          <Circle cx={12} cy={16} r={1.5} fill="#FFFFFF" />
          <Circle cx={28} cy={16} r={1.5} fill="#FFFFFF" />
          {/* Head */}
          <Circle cx={20} cy={12} r={4} fill="#1a1a1a" />
          <Circle cx={18} cy={10} r={1} fill="#FFFFFF" />
          <Circle cx={22} cy={10} r={1} fill="#FFFFFF" />
        </Svg>
      );
    case 'easter-egg':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Ellipse cx={20} cy={22} rx={11} ry={14} fill="#A8D8EA" />
          <Path d="M9 22 Q12 16 20 14 Q28 16 31 22 Q28 28 20 30 Q12 28 9 22Z" fill="#FFB7C5" opacity={0.6} />
          <Path d="M13 18 Q20 16 27 18" stroke="#FFFFFF" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.7} />
          <Path d="M11 24 Q20 22 29 24" stroke="#FFFFFF" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.7} />
          <Circle cx={15} cy={20} r={2} fill="#FFE4A0" opacity={0.8} />
          <Circle cx={25} cy={24} r={1.5} fill="#B8E0B0" opacity={0.8} />
        </Svg>
      );
    case 'clover':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Circle cx={20} cy={14} r={7} fill="#8BC34A" opacity={0.85} />
          <Circle cx={26} cy={20} r={7} fill="#8BC34A" opacity={0.85} />
          <Circle cx={14} cy={20} r={7} fill="#8BC34A" opacity={0.85} />
          <Circle cx={20} cy={26} r={7} fill="#8BC34A" opacity={0.85} />
          <Circle cx={20} cy={20} r={5} fill="#7CB342" opacity={0.9} />
          <Path d="M20 28 L20 36" stroke="#5D4037" strokeWidth={2} strokeLinecap="round" />
          {/* Heart on one leaf */}
          <Path d="M18 13 C18 11 22 11 22 13 C22 15 20 17 20 17 C20 17 18 15 18 13Z" fill="#FFFFFF" opacity={0.5} />
        </Svg>
      );
    case 'paw':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Ellipse cx={20} cy={26} rx={9} ry={7} fill="#F9A8C9" />
          <Circle cx={11} cy={16} r={4} fill="#F9A8C9" />
          <Circle cx={20} cy={13} r={4} fill="#F9A8C9" />
          <Circle cx={29} cy={16} r={4} fill="#F9A8C9" />
          <Ellipse cx={15} cy={26} rx={2.5} ry={3} fill="#E8809E" opacity={0.5} />
          <Ellipse cx={20} cy={28} rx={2.5} ry={3} fill="#E8809E" opacity={0.5} />
          <Ellipse cx={25} cy={26} rx={2.5} ry={3} fill="#E8809E" opacity={0.5} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Path d="M20 32 C20 32 6 22 6 14 C6 9 10 6 14 6 C17 6 19 8 20 10 C21 8 23 6 26 6 C30 6 34 9 34 14 C34 22 20 32 20 32Z" fill="#FF6B9D" />
          <Path d="M14 12 C12 12 10 14 10 16" stroke="#FFFFFF" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.5} />
        </Svg>
      );
    case 'butterfly':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Path d="M20 20 C18 14 10 8 6 14 C2 20 14 26 20 20Z" fill="#A8D8EA" opacity={0.9} />
          <Path d="M20 20 C22 14 30 8 34 14 C38 20 26 26 20 20Z" fill="#F9A8C9" opacity={0.9} />
          <Path d="M20 20 C18 24 10 28 8 24 C6 20 14 18 20 20Z" fill="#A8D8EA" opacity={0.7} />
          <Path d="M20 20 C22 24 30 28 32 24 C34 20 26 18 20 20Z" fill="#F9A8C9" opacity={0.7} />
          <Path d="M20 10 L20 30" stroke="#8B6340" strokeWidth={1.5} strokeLinecap="round" />
          <Circle cx={20} cy={10} r={1.5} fill="#8B6340" />
          <Path d="M17 9 Q16 6 14 5" stroke="#8B6340" strokeWidth={1} fill="none" strokeLinecap="round" />
          <Path d="M23 9 Q24 6 26 5" stroke="#8B6340" strokeWidth={1} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Path d="M20 5 L23 15 L34 15 L25 22 L28 33 L20 26 L12 33 L15 22 L6 15 L17 15 Z" fill="#FFD700" />
          <Path d="M20 10 L22 17 L14 17" stroke="#FFFFFF" strokeWidth={1} fill="none" opacity={0.4} />
        </Svg>
      );
    case 'mushroom':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Ellipse cx={20} cy={20} rx={14} ry={10} fill="#E53935" />
          <Rect x={15} y={20} width={10} height={14} rx={3} fill="#FFF0E6" />
          <Circle cx={14} cy={16} r={3} fill="#FFFFFF" opacity={0.8} />
          <Circle cx={24} cy={14} r={2.5} fill="#FFFFFF" opacity={0.8} />
          <Circle cx={28} cy={20} r={2} fill="#FFFFFF" opacity={0.8} />
          <Ellipse cx={17} cy={26} rx={1.5} ry={2} fill="#F9A8C9" opacity={0.5} />
          <Ellipse cx={23} cy={26} rx={1.5} ry={2} fill="#F9A8C9" opacity={0.5} />
        </Svg>
      );
    default:
      return null;
  }
}

interface DraggableStickerProps {
  sticker: Sticker;
  onUpdate: (updates: Partial<Sticker>) => void;
  onRemove: () => void;
}

function DraggableSticker({ sticker, onUpdate, onRemove }: DraggableStickerProps) {
  const lastPos = useRef({ x: sticker.x, y: sticker.y });
  const size = 44 * sticker.scale;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        onUpdate({
          x: lastPos.current.x + gs.dx,
          y: lastPos.current.y + gs.dy,
        });
      },
      onPanResponderRelease: (_, gs) => {
        lastPos.current = {
          x: lastPos.current.x + gs.dx,
          y: lastPos.current.y + gs.dy,
        };
      },
    })
  ).current;

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
      {renderStickerSvg(sticker.type, size)}
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Text style={styles.removeBtnText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function StickerCanvas({
  stickers,
  onUpdateSticker,
  onRemoveSticker,
  width,
  height,
}: StickerCanvasProps) {
  return (
    <View style={[styles.canvas, { width, height }]}>
      {stickers.map((sticker) => (
        <DraggableSticker
          key={sticker.id}
          sticker={sticker}
          onUpdate={(updates) => onUpdateSticker(sticker.id, updates)}
          onRemove={() => onRemoveSticker(sticker.id)}
        />
      ))}
    </View>
  );
}

export { renderStickerSvg };

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
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: Colors.white,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: 'bold',
  },
});
