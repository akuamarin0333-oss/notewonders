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
  Modal,
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

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId = 'heart' | 'neko' | 'haru' | 'natsu' | 'aki' | 'fuyu' | 'mystickers';

interface Tab {
  id: TabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: Tab[] = [
  { id: 'heart',      label: 'ハート',     icon: 'heart' },
  { id: 'neko',       label: 'ネコ',       icon: 'paw-outline' },
  { id: 'haru',       label: 'はる',       icon: 'flower-outline' },
  { id: 'natsu',      label: 'なつ',       icon: 'sunny' },
  { id: 'aki',        label: 'あき',       icon: 'leaf' },
  { id: 'fuyu',       label: 'ふゆ',       icon: 'snow' },
  { id: 'mystickers', label: 'マイスタンプ', icon: 'person' },
];

// ─── Sticker data per tab ─────────────────────────────────────────────────────

interface StickerItem {
  type: StickerType;
  label: string;
}

const HEART_STICKERS: StickerItem[] = [
  { type: 'sticker_hearts_double', label: 'ダブルハート' },
  { type: 'sticker_heart_green',   label: '緑のハート' },
  { type: 'sticker_heart_arrow',   label: '矢のハート' },
  { type: 'sticker_heart_sparkle', label: 'キラキラハート' },
  { type: 'sticker_smiley_green',  label: 'スマイル' },
  { type: 'sticker_music_notes',   label: '音符' },
  { type: 'sticker_moon_stars',    label: '月と星' },
  { type: 'sticker_zzz_bunny',     label: 'ねむうさぎ' },
  { type: 'sticker_gift_box',      label: 'プレゼント' },
  { type: 'sticker_bath_duck',     label: 'アヒル' },
  { type: 'sticker_boba_tea',      label: 'タピオカ' },
];

const HARU_STICKERS: StickerItem[] = [
  { type: 'sticker_flower_garden',  label: '花畑' },
  { type: 'sticker_cherry_blossom', label: '桜の木' },
  { type: 'sticker_sakura',         label: 'さくら' },
];

const NATSU_STICKERS: StickerItem[] = [
  { type: 'sticker_fireworks', label: '花火' },
  { type: 'sticker_beach',     label: 'ビーチ' },
  { type: 'sticker_sunflower', label: 'ひまわり' },
];

const AKI_STICKERS: StickerItem[] = [
  { type: 'sticker_autumn_leaves',    label: '紅葉' },
  { type: 'sticker_halloween_pumpkin', label: 'かぼちゃ' },
];

const FUYU_STICKERS: StickerItem[] = [
  { type: 'sticker_cat_snowman',   label: '雪だるま猫' },
  { type: 'sticker_kotatsu',       label: 'こたつ' },
  { type: 'sticker_christmas_tree', label: 'クリスマス' },
];

// ネコステッカー (cat stickers)
const NEKO_STICKERS: StickerItem[] = [
  { type: 'sticker_moon_cat',       label: 'お月見猫' },
  { type: 'sticker_onsen_cat',      label: '温泉猫' },
  { type: 'sticker_icecream_cat',   label: 'アイス猫' },
  { type: 'sticker_flower_cat',     label: 'お花猫' },
  { type: 'sticker_pancake_cat',    label: 'パンケーキ猫' },
  { type: 'sticker_cooking_cat',    label: '料理猫' },
  { type: 'sticker_shopping_cat',   label: '買い物猫' },
  { type: 'sticker_thunder_cat',    label: '雷猫' },
  { type: 'sticker_sunny_cat',      label: '晴れ猫' },
  { type: 'sticker_cloud_cat',      label: '曇り猫' },
  { type: 'sticker_snowy_cat',      label: '雪猫' },
  { type: 'sticker_butterfly_cat',  label: '蝶々猫' },
  { type: 'sticker_beach_cat',      label: 'ビーチ猫' },
  { type: 'sticker_winter_cat',     label: '冬猫' },
  { type: 'sticker_autumn_cat',     label: '秋猫' },
  { type: 'sticker_festival_cat',   label: 'お祭り猫' },
  { type: 'sticker_pumpkin_cat',    label: 'かぼちゃ猫' },
  { type: 'sticker_stargazing_cat', label: '星空猫' },
  { type: 'sticker_bath_cat',       label: 'お風呂猫' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StickerPack() {
  const insets = useSafeAreaInsets();
  const { setPendingSticker, customStickers, loadCustomStickers, addCustomSticker, removeCustomSticker } =
    useStickerStore();

  const [activeTab, setActiveTab] = useState<TabId>('heart');
  const [addingCustom, setAddingCustom] = useState(false);
  // ID of the custom sticker pending deletion confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        mediaTypes: 'images' as ImagePicker.MediaType,
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

  // Called when user taps × on a custom sticker — sets ID for confirm modal
  const handleRequestDelete = useCallback((id: string) => {
    setDeletingId(id);
  }, []);

  // Called when user confirms deletion inside the modal
  const handleConfirmDelete = useCallback(() => {
    if (!deletingId) return;
    const idToDelete = deletingId;
    setDeletingId(null);
    removeCustomSticker(idToDelete);
  }, [deletingId, removeCustomSticker]);

  const handleCancelDelete = useCallback(() => {
    setDeletingId(null);
  }, []);

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
        /*
         * Key approach: render the card as a plain View, NOT a Pressable/Touchable.
         * The image tap and the × button are each independent Touchables — siblings
         * inside the View. No nesting = no event swallowing on RN Web.
         */
        <View key={cs.id} style={[styles.stickerCard, styles.customCard, Shadow.small]}>
          {/* Tap the image to select the sticker */}
          <TouchableOpacity
            onPress={() => handleSelect('custom', cs.uri)}
            activeOpacity={0.72}
            style={styles.customImgTouchable}
          >
            <Image
              source={{ uri: cs.uri }}
              style={styles.stickerImg}
              contentFit="contain"
            />
          </TouchableOpacity>

          {/*
           * × delete button — completely outside the image Touchable.
           * High zIndex, generous hitSlop, and stopPropagation via
           * onStartShouldSetResponder so the card cannot steal the event.
           */}
          <View
            style={styles.customRemoveBtnWrap}
            // Intercept the touch at the responder level so the parent View
            // cannot capture it first
            onStartShouldSetResponder={() => true}
            onResponderGrant={() => handleRequestDelete(cs.id)}
          >
            <Ionicons name="close-circle" size={22} color={Colors.primaryDark} />
          </View>
        </View>
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
      case 'heart':      return renderStickerGrid(HEART_STICKERS);
      case 'neko':       return renderStickerGrid(NEKO_STICKERS);
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
                name={tab.icon}
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

      {/* Delete confirmation modal (web-safe — no Alert.alert) */}
      <Modal
        visible={deletingId !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmCard, Shadow.large]}>
            <Ionicons name="trash-outline" size={28} color={Colors.error} />
            <Text style={styles.confirmTitle}>スタンプを削除</Text>
            <Text style={styles.confirmMessage}>このスタンプを削除しますか？</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={handleCancelDelete}
              >
                <Text style={styles.confirmCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.confirmDeleteText}>削除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Custom sticker card — View wrapper (no padding because children handle it)
  customCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'visible',
    position: 'relative',
  },
  // The touchable area for selecting the sticker image
  customImgTouchable: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  // × button wrapper — absolute, high zIndex, uses RN responder system directly
  customRemoveBtnWrap: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    // Shadow so the button stands out clearly on any background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 5,
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

  // ─── Delete confirm modal ──────────────────────────────────────────────────
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  confirmCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  confirmTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 20,
    color: Colors.text,
  },
  confirmMessage: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textLight,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.white,
  },
});
