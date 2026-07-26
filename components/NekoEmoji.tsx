import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Ellipse } from 'react-native-svg';

// SVG-based kawaii cat face (no emoji)
interface NekoEmojiProps {
  size?: number;
  mood?: 'happy' | 'love' | 'sleeping' | 'excited';
}

export default function NekoEmoji({ size = 80, mood = 'happy' }: NekoEmojiProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        {/* Body */}
        <Ellipse cx={cx} cy={cy + s * 0.05} rx={s * 0.38} ry={s * 0.32} fill="#FFF0E6" />
        {/* Left ear */}
        <Path
          d={`M ${cx - s * 0.22} ${cy - s * 0.2} L ${cx - s * 0.32} ${cy - s * 0.38} L ${cx - s * 0.1} ${cy - s * 0.28} Z`}
          fill="#FFF0E6"
        />
        {/* Right ear */}
        <Path
          d={`M ${cx + s * 0.22} ${cy - s * 0.2} L ${cx + s * 0.32} ${cy - s * 0.38} L ${cx + s * 0.1} ${cy - s * 0.28} Z`}
          fill="#FFF0E6"
        />
        {/* Left ear inner */}
        <Path
          d={`M ${cx - s * 0.2} ${cy - s * 0.22} L ${cx - s * 0.28} ${cy - s * 0.34} L ${cx - s * 0.12} ${cy - s * 0.26} Z`}
          fill="#F9A8C9"
        />
        {/* Right ear inner */}
        <Path
          d={`M ${cx + s * 0.2} ${cy - s * 0.22} L ${cx + s * 0.28} ${cy - s * 0.34} L ${cx + s * 0.12} ${cy - s * 0.26} Z`}
          fill="#F9A8C9"
        />
        {/* Head */}
        <Circle cx={cx} cy={cy - s * 0.06} r={s * 0.3} fill="#FFF0E6" />
        {/* Blush left */}
        <Ellipse cx={cx - s * 0.16} cy={cy + s * 0.04} rx={s * 0.07} ry={s * 0.045} fill="#F9A8C9" opacity={0.6} />
        {/* Blush right */}
        <Ellipse cx={cx + s * 0.16} cy={cy + s * 0.04} rx={s * 0.07} ry={s * 0.045} fill="#F9A8C9" opacity={0.6} />

        {/* Eyes based on mood */}
        {mood === 'happy' || mood === 'excited' ? (
          <>
            {/* Happy eyes (curved) */}
            <Path d={`M ${cx - s * 0.12} ${cy - s * 0.1} Q ${cx - s * 0.07} ${cy - s * 0.16} ${cx - s * 0.02} ${cy - s * 0.1}`} stroke="#5C4A4A" strokeWidth={s * 0.025} fill="none" strokeLinecap="round" />
            <Path d={`M ${cx + s * 0.02} ${cy - s * 0.1} Q ${cx + s * 0.07} ${cy - s * 0.16} ${cx + s * 0.12} ${cy - s * 0.1}`} stroke="#5C4A4A" strokeWidth={s * 0.025} fill="none" strokeLinecap="round" />
          </>
        ) : mood === 'love' ? (
          <>
            {/* Heart eyes */}
            <Path d={`M ${cx - s * 0.11} ${cy - s * 0.12} C ${cx - s * 0.09} ${cy - s * 0.16} ${cx - s * 0.04} ${cy - s * 0.16} ${cx - s * 0.07} ${cy - s * 0.1}`} stroke="#F9A8C9" strokeWidth={s * 0.025} fill="#F9A8C9" />
            <Path d={`M ${cx + s * 0.11} ${cy - s * 0.12} C ${cx + s * 0.09} ${cy - s * 0.16} ${cx + s * 0.04} ${cy - s * 0.16} ${cx + s * 0.07} ${cy - s * 0.1}`} stroke="#F9A8C9" strokeWidth={s * 0.025} fill="#F9A8C9" />
          </>
        ) : (
          <>
            {/* Sleeping eyes */}
            <Path d={`M ${cx - s * 0.12} ${cy - s * 0.1} Q ${cx - s * 0.07} ${cy - s * 0.08} ${cx - s * 0.02} ${cy - s * 0.1}`} stroke="#5C4A4A" strokeWidth={s * 0.022} fill="none" strokeLinecap="round" />
            <Path d={`M ${cx + s * 0.02} ${cy - s * 0.1} Q ${cx + s * 0.07} ${cy - s * 0.08} ${cx + s * 0.12} ${cy - s * 0.1}`} stroke="#5C4A4A" strokeWidth={s * 0.022} fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Nose */}
        <Path d={`M ${cx - s * 0.025} ${cy + s * 0.02} L ${cx} ${cy - s * 0.015} L ${cx + s * 0.025} ${cy + s * 0.02} Z`} fill="#F9A8C9" />
        {/* Mouth */}
        <Path d={`M ${cx - s * 0.04} ${cy + s * 0.04} Q ${cx} ${cy + s * 0.085} ${cx + s * 0.04} ${cy + s * 0.04}`} stroke="#5C4A4A" strokeWidth={s * 0.02} fill="none" strokeLinecap="round" />
        {/* Whiskers */}
        <Path d={`M ${cx - s * 0.06} ${cy + s * 0.015} L ${cx - s * 0.22} ${cy + s * 0.01}`} stroke="#B0909090" strokeWidth={s * 0.015} strokeLinecap="round" opacity={0.5} />
        <Path d={`M ${cx - s * 0.06} ${cy + s * 0.03} L ${cx - s * 0.22} ${cy + s * 0.035}`} stroke="#B0909090" strokeWidth={s * 0.015} strokeLinecap="round" opacity={0.5} />
        <Path d={`M ${cx + s * 0.06} ${cy + s * 0.015} L ${cx + s * 0.22} ${cy + s * 0.01}`} stroke="#B0909090" strokeWidth={s * 0.015} strokeLinecap="round" opacity={0.5} />
        <Path d={`M ${cx + s * 0.06} ${cy + s * 0.03} L ${cx + s * 0.22} ${cy + s * 0.035}`} stroke="#B0909090" strokeWidth={s * 0.015} strokeLinecap="round" opacity={0.5} />

        {/* Sparkle for excited */}
        {mood === 'excited' && (
          <>
            <Path d={`M ${cx + s * 0.38} ${cy - s * 0.2} L ${cx + s * 0.42} ${cy - s * 0.26} L ${cx + s * 0.46} ${cy - s * 0.2} L ${cx + s * 0.42} ${cy - s * 0.14} Z`} fill="#FFD700" opacity={0.9} />
            <Path d={`M ${cx - s * 0.38} ${cy - s * 0.1} L ${cx - s * 0.4} ${cy - s * 0.15} L ${cx - s * 0.42} ${cy - s * 0.1} L ${cx - s * 0.4} ${cy - s * 0.05} Z`} fill="#F9A8C9" opacity={0.9} />
          </>
        )}
      </Svg>
    </View>
  );
}
