import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import { renderStickerSvg } from '@/components/StickerCanvas';
import type { StickerType } from '@/store/types';
import { useStickerStore } from '@/store/useStickerStore';

const STICKERS: { type: StickerType; label: string; labelJa: string }[] = [
  { type: 'cat', label: 'Cat', labelJa: 'ねこ' },
  { type: 'sakura', label: 'Sakura', labelJa: 'さくら' },
  { type: 'ladybug', label: 'Ladybug', labelJa: 'てんとう虫' },
  { type: 'easter-egg', label: 'Easter Egg', labelJa: 'たまご' },
  { type: 'clover', label: 'Clover', labelJa: 'クローバー' },
  { type: 'paw', label: 'Paw Print', labelJa: 'あしあと' },
  { type: 'heart', label: 'Heart', labelJa: 'ハート' },
  { type: 'butterfly', label: 'Butterfly', labelJa: 'ちょうちょ' },
  { type: 'star', label: 'Star', labelJa: 'ほし' },
  { type: 'mushroom', label: 'Mushroom', labelJa: 'きのこ' },
];

export default function StickerPack() {
  const insets = useSafeAreaInsets();
  const { setPendingSticker } = useStickerStore();

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleSelect = useCallback((type: StickerType) => {
    setPendingSticker(type);
    router.back();
  }, [setPendingSticker]);

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* Grab bar */}
      <View style={styles.grabBar} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sticker Pack</Text>
          <Text style={styles.titleJa}>ステッカーパック</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close-circle" size={28} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Tap a sticker to add it to the right page</Text>

      <ScrollView
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {STICKERS.map((s) => (
          <TouchableOpacity
            key={s.type}
            onPress={() => handleSelect(s.type)}
            style={[styles.stickerCard, Shadow.small]}
            activeOpacity={0.75}
          >
            <View style={styles.stickerPreview}>
              {renderStickerSvg(s.type, 64)}
            </View>
            <Text style={styles.stickerLabel}>{s.label}</Text>
            <Text style={styles.stickerLabelJa}>{s.labelJa}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  grabBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 28,
    color: Colors.text,
  },
  titleJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 16,
    color: Colors.primary,
  },
  closeBtn: {
    padding: 4,
  },
  hint: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  stickerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: 90,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 4,
  },
  stickerPreview: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.text,
  },
  stickerLabelJa: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.textLight,
  },
});
