import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import { STICKER_IMAGES } from '@/components/StickerCanvas';
import type { StickerType } from '@/store/types';
import { useStickerStore } from '@/store/useStickerStore';

// ─── Tab definitions ─────────────────────────────────────────────────────────

type TabId = 'kimochi' | 'action' | 'haru' | 'natsu' | 'aki' | 'fuyu' | 'mystickers';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'kimochi', label: 'きもち', icon: 'heart' },
  { id: 'action', label: 'アクション', icon: 'flash' },
  { id: 'haru', label: 'はる', icon: 'flower-outline' },
  { id: 'natsu', label: 'なつ', icon: 'sunny' },
  { id: 'aki', label: 'あき', icon: 'leaf' },
  { id: 'fuyu', label: 'ふゆ', icon: 'snow' },
  { id: 'mystickers', label: 'マイスタンプ', icon: 'person' },
];

// ─── Sticker data per tab ─────────────────────────────────────────────────────

interface StickerItem {
  type: StickerType;
  label: string;
}

const KIMOCHI_STICKERS: StickerItem[] = [
  { type: 'sticker_angry', label: '怒り' },
  { type: 'sticker_love', label: 'ハート' },
  { type: 'sticker_sleepy', label: '眠い' },
  { type: 'sticker_sad', label: '悲しい' },
  { type: 'sticker_surprised', label: 'びっくり' },
  { type: 'sticker_sigh', label: 'ため息' },
  { type: 'sticker_furious', label: '激怒' },
  { type: 'sticker_crying', label: '泣く' },
  { type: 'sticker_neutral', label: '無表情' },
];

const ACTION_STICKERS: StickerItem[] = [
  { type: 'sticker_playful', label: 'あそぶ' },
  { type: 'sticker_waving', label: 'バイバイ' },
  { type: 'sticker_skating', label: 'スケート' },
  { type: 'sticker_running', label: '走る' },
  { type: 'sticker_swing', label: 'ブランコ' },
  { type: 'sticker_surfing', label: 'サーフィン' },
  { type: 'sticker_singing', label: '歌う' },
];

const HARU_STICKERS: StickerItem[] = [
  { type: 'sticker_sakura_cat', label: '桜と猫' },
  { type: 'sticker_flower_garden', label: '花畑' },
  { type: 'sticker_cherry_blossom', label: '桜の木' },
  { type: 'sticker_koinobori', label: 'こいのぼり' },
  { type: 'sticker_sakura', label: 'さくら' },
  { type: 'sticker_easter', label: 'イースター' },
  { type: 'sticker_gardening', label: 'ガーデン' },
];

const NATSU_STICKERS: StickerItem[] = [
  { type: 'sticker_fireworks', label: '花火' },
  { type: 'sticker_watermelon', label: 'スイカ' },
  { type: 'sticker_hydrangea', label: '紫陽花' },
  { type: 'sticker_beach', label: 'ビーチ' },
  { type: 'sticker_sunflower', label: 'ひまわり' },
  { type: 'sticker_bubbles', label: 'シャボン玉' },
];

const AKI_STICKERS: StickerItem[] = [
  { type: 'sticker_autumn_leaves', label: '紅葉' },
  { type: 'sticker_art_cat', label: '芸術の秋' },
  { type: 'sticker_halloween_pumpkin', label: 'かぼちゃ' },
  { type: 'sticker_halloween_witch', label: '魔女猫' },
];

const FUYU_STICKERS: StickerItem[] = [
  { type: 'sticker_snowball', label: '雪遊び' },
  { type: 'sticker_kotatsu', label: 'こたつ' },
  { type: 'sticker_cozy_fireplace', label: '暖炉' },
  { type: 'sticker_christmas_elf', label: 'エルフ' },
  { type: 'sticker_christmas_tree', label: 'クリスマス' },
  { type: 'sticker_newyear', label: 'お正月' },
  { type: 'sticker_rainy_cat', label: '雨の日' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function StickerPack() {
  const insets = useSafeAreaInsets();
  const { setPendingSticker, customStickers, loadCustomStickers, addCustomSticker, removeCustomSticker } =
    useStickerStore();

  const [activeTab, setActiveTab] = useState<TabId>('kimochi');
  const [addingCustom, setAddingCustom] = useState(false);

  useEffect(() => {
    loadCustomStickers();
  }, [loadCustomStickers]);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleSelect = useCallback(
    (type: StickerType, customUri?: string) => {
      setPendingSticker({ type, customUri });
      router.back();
    },
    [setPendingSticker]
  );

  const handleAddCustomSticker = useCallback(async () => {
    if (addingCustom) return;
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('許可が必要です', 'フォトライブラリへのアクセスを許可してください。');
          return;
        }
      }
      setAddingCustom(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await addCustomSticker(result.assets[0].uri);
      }
    } catch {
      Alert.alert('エラー', '画像の選択に失敗しました。');
    } finally {
      setAddingCustom(false);
    }
  }, [addingCustom, addCustomSticker]);

  const handleRemoveCustomSticker = useCallback(
    (id: string) => {
      const doRemove = () => removeCustomSticker(id);
      if (Platform.OS === 'web') {
        const ok = window.confirm('このスタンプを削除しますか？');
        if (ok) doRemove();
      } else {
        Alert.alert('スタンプを削除', 'このスタンプを削除しますか？', [
          { text: 'キャンセル', style: 'cancel' },
          { text: '削除', style: 'destructive', onPress: doRemove },
        ]);
      }
    },
    [removeCustomSticker]
  );

  const renderStickerGrid = (items: StickerItem[]) => (
    <ScrollView
      contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {items.map((s) => (
        <TouchableOpacity
          key={s.type}
          onPress={() => handleSelect(s.type)}
          style={[styles.stickerCard, Shadow.small]}
          activeOpacity={0.72}
        >
          <Image
            source={STICKER_IMAGES[s.type]}
            style={styles.stickerImg}
            contentFit="contain"
          />
          <Text style={styles.stickerLabel}>{s.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderMyStickers = () => (
    <ScrollView
      contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Add button */}
      <TouchableOpacity
        onPress={handleAddCustomSticker}
        style={[styles.stickerCard, styles.addCard, Shadow.small]}
        activeOpacity={0.72}
      >
        {addingCustom ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Ionicons name="add" size={32} color={Colors.primaryDark} />
        )}
        <Text style={[styles.stickerLabel, { color: Colors.primaryDark }]}>追加</Text>
      </TouchableOpacity>

      {customStickers.map((cs) => (
        <TouchableOpacity
          key={cs.id}
          onPress={() => handleSelect('custom', cs.uri)}
          style={[styles.stickerCard, Shadow.small]}
          activeOpacity={0.72}
        >
          <Image
            source={{ uri: cs.uri }}
            style={styles.stickerImg}
            contentFit="contain"
          />
          <TouchableOpacity
            style={styles.customRemoveBtn}
            onPress={() => handleRemoveCustomSticker(cs.id)}
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          >
            <Ionicons name="close-circle" size={18} color={Colors.primaryDark} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {customStickers.length === 0 && !addingCustom && (
        <View style={styles.emptyCustom}>
          <Ionicons name="images-outline" size={36} color={Colors.border} />
          <Text style={styles.emptyCustomText}>
            {'「＋追加」を押してギャラリーから\nマイスタンプを登録しよう！'}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'kimochi':    return renderStickerGrid(KIMOCHI_STICKERS);
      case 'action':     return renderStickerGrid(ACTION_STICKERS);
      case 'haru':       return renderStickerGrid(HARU_STICKERS);
      case 'natsu':      return renderStickerGrid(NATSU_STICKERS);
      case 'aki':        return renderStickerGrid(AKI_STICKERS);
      case 'fuyu':       return renderStickerGrid(FUYU_STICKERS);
      case 'mystickers': return renderMyStickers();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* Grab bar */}
      <View style={styles.grabBar} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>スタンプ</Text>
          <Text style={styles.subtitle}>ページにスタンプを貼ろう！</Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeBtn}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="close-circle" size={28} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Tab bar — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.tabBar}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, isActive && styles.tabActive]}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tab.icon as 'heart'}
                size={14}
                color={isActive ? Colors.white : Colors.textLight}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab content */}
      <View style={styles.contentArea}>{renderTabContent()}</View>
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
    paddingBottom: Spacing.sm,
    paddingTop: 2,
  },
  title: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 26,
    color: Colors.text,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
    marginTop: 2,
  },
  tabBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 7,
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  tabLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.textLight,
  },
  tabLabelActive: {
    color: Colors.white,
  },
  contentArea: {
    flex: 1,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    gap: 10,
    justifyContent: 'flex-start',
  },
  stickerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: 90,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stickerImg: {
    width: 64,
    height: 64,
  },
  stickerLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
  },
  addCard: {
    borderStyle: 'dashed',
    borderColor: Colors.primaryDark,
    borderWidth: 2,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    minHeight: 100,
  },
  customRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.white,
    borderRadius: 9,
  },
  emptyCustom: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyCustomText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
