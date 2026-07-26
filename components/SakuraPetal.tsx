import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface SakuraPetalProps {
  x: number;
  size?: number;
  delay?: number;
  duration?: number;
}

export default function SakuraPetal({ x, size = 16, delay = 0, duration = 4000 }: SakuraPetalProps) {
  const yAnim = useRef(new Animated.Value(-40)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 0.8, duration: 300, useNativeDriver: true }),
          Animated.timing(yAnim, { toValue: 600, duration, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 1, duration, useNativeDriver: true }),
        ]),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(yAnim, { toValue: -40, duration: 0, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, yAnim, rotateAnim, opacityAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.petal,
        {
          left: x,
          transform: [{ translateY: yAnim }, { rotate }],
          opacity: opacityAnim,
          width: size,
          height: size,
        },
      ]}
      pointerEvents="none"
    >
      <Svg viewBox="0 0 24 24" width={size} height={size}>
        <Path
          d="M12 2C9 2 6 5 6 8c0 2 1 3.5 3 5-2 1.5-3 3-3 5 0 3 3 6 6 6s6-3 6-6c0-2-1-3.5-3-5 2-1.5 3-3 3-5 0-3-3-6-6-6z"
          fill="#FFB7C5"
          opacity={0.85}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  petal: {
    position: 'absolute',
    top: 0,
  },
});
