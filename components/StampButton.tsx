import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';

interface StampButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  color?: string;
  size?: number;
}

export default function StampButton({
  icon,
  label,
  onPress,
  active = false,
  color = Colors.stamp,
  size = 44,
}: StampButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.wrapper}>
      <View
        style={[
          styles.stamp,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: active ? color : Colors.surface,
            borderColor: color,
          },
          !active && Shadow.small,
        ]}
      >
        <Ionicons
          name={icon}
          size={size * 0.45}
          color={active ? Colors.white : color}
        />
      </View>
      <Text style={[styles.label, { color: Colors.textLight }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 4,
  },
  stamp: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  label: {
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
});
