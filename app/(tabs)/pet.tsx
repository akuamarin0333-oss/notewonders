import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Colors, BorderRadius, Spacing, Shadow } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import NekoEmoji from '@/components/NekoEmoji';

type Mood = 'happy' | 'love' | 'sleeping' | 'excited';

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  anim: Animated.Value;
  type: 'heart' | 'star' | 'sparkle';
}

function HeartSvg({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 21 C12 21 3 14 3 8 C3 5 5 3 8 3 C10 3 11.5 4 12 5 C12.5 4 14 3 16 3 C19 3 21 5 21 8 C21 14 12 21 12 21Z" fill="#FF6B9D" />
    </Svg>
  );
}

function StarSvg({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2 L14.5 9 L22 9 L16 14 L18.5 21 L12 17 L5.5 21 L8 14 L2 9 L9.5 9 Z" fill="#FFD700" />
    </Svg>
  );
}

export default function PetACat() {
  const insets = useSafeAreaInsets();
  useWindowDimensions(); // keep for responsive re-renders
  const [mood, setMood] = useState<Mood>('sleeping');
  const [petsCount, setPetsCount] = useState(0);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [nadeText, setNadeText] = useState(false);
  const catScaleAnim = useRef(new Animated.Value(1)).current;
  const catRotateAnim = useRef(new Animated.Value(0)).current;
  const nextId = useRef(0);

  const spawnParticle = useCallback((tapX: number, tapY: number) => {
    const id = nextId.current++;
    const anim = new Animated.Value(0);
    const types: FloatingParticle['type'][] = ['heart', 'star', 'sparkle'];
    const type = types[id % types.length];
    const p: FloatingParticle = { id, x: tapX - 60, y: tapY - 60, anim, type };
    setParticles((prev) => [...prev.slice(-8), p]);
    Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }).start(() => {
      setParticles((prev) => prev.filter((pp) => pp.id !== id));
    });
  }, []);

  const handlePet = useCallback(
    (x: number, y: number) => {
      setPetsCount((n) => {
        const newCount = n + 1;
        if (newCount % 10 === 0) setMood('excited');
        else if (newCount % 5 === 0) setMood('love');
        else setMood('happy');
        return newCount;
      });

      setNadeText(true);
      setTimeout(() => setNadeText(false), 800);

      spawnParticle(x, y);

      Animated.sequence([
        Animated.timing(catScaleAnim, { toValue: 1.12, duration: 80, useNativeDriver: true }),
        Animated.timing(catRotateAnim, { toValue: 0.03, duration: 60, useNativeDriver: true }),
        Animated.timing(catRotateAnim, { toValue: -0.03, duration: 100, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(catScaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(catRotateAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]),
      ]).start();
    },
    [spawnParticle, catScaleAnim, catRotateAnim]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        handlePet(pageX, pageY);
      },
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        // Throttle on move
        handlePet(pageX, pageY);
      },
    })
  ).current;

  const catRotateDeg = catRotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-30deg', '30deg'],
  });

  const moodLabels: Record<Mood, { en: string; ja: string }> = {
    happy: { en: 'Happy', ja: 'うれしい' },
    love: { en: 'Loves it!', ja: 'だいすき' },
    sleeping: { en: 'Zzz...', ja: 'ねてる' },
    excited: { en: 'So excited!', ja: 'たのしい' },
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Pet a Cat</Text>
        <Text style={styles.titleJa}>ねこをなでなで</Text>
      </View>

      {/* Mood display */}
      <View style={[styles.moodBubble, Shadow.small]}>
        <Text style={styles.moodText}>{moodLabels[mood].en}</Text>
        <Text style={styles.moodJa}>{moodLabels[mood].ja}</Text>
      </View>

      {/* Main pet area */}
      <View style={styles.petArea} {...panResponder.panHandlers}>
        {/* Background pattern */}
        <View style={styles.bgPattern} pointerEvents="none">
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.bgDot,
                { left: 30 + i * 60, top: 20 + (i % 3) * 40 },
              ]}
            />
          ))}
        </View>

        {/* Cat */}
        <Animated.View
          style={{
            transform: [{ scale: catScaleAnim }, { rotate: catRotateDeg }],
          }}
        >
          <NekoEmoji size={180} mood={mood} />
        </Animated.View>

        {/* Nade text */}
        {nadeText && (
          <View style={styles.nadeTextWrap} pointerEvents="none">
            <Text style={styles.nadeText}>なでなで</Text>
          </View>
        )}

        {/* Floating particles */}
        {particles.map((p) => {
          const translateY = p.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -80],
          });
          const opacity = p.anim.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [1, 0.8, 0],
          });
          return (
            <Animated.View
              key={p.id}
              style={[
                styles.particle,
                {
                  left: p.x,
                  top: p.y,
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
              pointerEvents="none"
            >
              {p.type === 'heart' ? (
                <HeartSvg size={22} />
              ) : p.type === 'star' ? (
                <StarSvg size={18} />
              ) : (
                <Text style={styles.sparkleText}>✦</Text>
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { paddingBottom: insets.bottom + 80 }]}>
        <View style={[styles.statCard, Shadow.small]}>
          <Text style={styles.statNumber}>{petsCount}</Text>
          <Text style={styles.statLabel}>Pets given</Text>
          <Text style={styles.statLabelJa}>なでなでの数</Text>
        </View>
        <View style={[styles.statCard, Shadow.small]}>
          <NekoEmoji size={40} mood={mood} />
          <Text style={styles.statLabel}>Current mood</Text>
          <Text style={[styles.statLabelJa, { color: Colors.primary }]}>{moodLabels[mood].ja}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statCard, styles.resetCard, Shadow.small]}
          onPress={() => { setPetsCount(0); setMood('sleeping'); }}
        >
          <Text style={styles.resetIcon}>↺</Text>
          <Text style={styles.statLabel}>Reset</Text>
          <Text style={styles.statLabelJa}>リセット</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 32,
    color: Colors.text,
  },
  titleJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 18,
    color: Colors.primary,
  },
  moodBubble: {
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    marginBottom: 8,
  },
  moodText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.text,
  },
  moodJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 14,
    color: Colors.primary,
  },
  petArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bgPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  nadeTextWrap: {
    position: 'absolute',
    top: '25%',
    alignSelf: 'center',
    backgroundColor: 'rgba(249,168,201,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  nadeText: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 20,
    color: Colors.white,
  },
  particle: {
    position: 'absolute',
  },
  sparkleText: {
    fontSize: 18,
    color: Colors.accent,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  statNumber: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 28,
    color: Colors.primary,
  },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textLight,
  },
  statLabelJa: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.textLight,
  },
  resetCard: {
    borderColor: Colors.border,
  },
  resetIcon: {
    fontSize: 24,
    color: Colors.textLight,
  },
});
