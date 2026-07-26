import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import NekoEmoji from '@/components/NekoEmoji';
import Svg, { Path, Circle } from 'react-native-svg';

function SakuraBadge() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M12 2 C10 5 6 6 4 6 C6 8 6 10 4 12 C7 11 9 12 10 14 C11 12 13 11 16 12 C14 10 14 8 16 6 C14 6 14 5 12 2Z" fill="#FFB7C5" />
      <Circle cx={12} cy={8} r={2} fill="#FFE4EC" />
    </Svg>
  );
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { pages, notebooks, toggleFavorite } = useAppStore();

  const favoritePages = useMemo(
    () => pages.filter((p) => p.isFavorite).sort((a, b) => b.updatedAt - a.updatedAt),
    [pages]
  );

  const getNotebook = (notebookId: string) => notebooks.find((n) => n.id === notebookId);

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Favorites</Text>
            <Text style={styles.titleJa}>お気に入り</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="bookmark" size={24} color={Colors.favorite} />
            {favoritePages.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{favoritePages.length}</Text>
              </View>
            )}
          </View>
        </View>

        {favoritePages.length === 0 ? (
          <View style={styles.emptyState}>
            <NekoEmoji size={90} mood="sleeping" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the bookmark icon while reading a page to save it here!
            </Text>
            <View style={styles.emptyHint}>
              <SakuraBadge />
              <Text style={styles.emptyHintText}>お気に入りはまだありません</Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              {favoritePages.length} saved {favoritePages.length === 1 ? 'page' : 'pages'}
            </Text>
            {favoritePages.map((page) => {
              const notebook = getNotebook(page.notebookId);
              const updatedDate = new Date(page.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <TouchableOpacity
                  key={page.id}
                  style={[styles.card, Shadow.small]}
                  onPress={() => router.push(`/notebook/${page.notebookId}`)}
                  activeOpacity={0.85}
                >
                  {/* Left colored bar */}
                  <View
                    style={[
                      styles.cardBar,
                      {
                        backgroundColor:
                          notebook?.coverTheme === 'leather'
                            ? '#C4956A'
                            : notebook?.coverTheme === 'spring'
                            ? Colors.accent
                            : Colors.primary,
                      },
                    ]}
                  />

                  <View style={styles.cardContent}>
                    {/* Page title */}
                    <View style={styles.cardHeader}>
                      <Text style={styles.pageTitle} numberOfLines={1}>
                        {page.title || 'Untitled page'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleFavorite(page.id)}
                        style={styles.unbookmarkBtn}
                      >
                        <Ionicons name="bookmark" size={18} color={Colors.favorite} />
                      </TouchableOpacity>
                    </View>

                    {/* Preview */}
                    <Text style={styles.pagePreview} numberOfLines={3}>
                      {page.content || 'No content written yet...'}
                    </Text>

                    {/* Sticker count */}
                    {page.stickers.length > 0 && (
                      <View style={styles.stickerInfo}>
                        <Ionicons name="happy-outline" size={12} color={Colors.textLight} />
                        <Text style={styles.stickerInfoText}>
                          {page.stickers.length} sticker{page.stickers.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                      <View style={styles.notebookRef}>
                        <Ionicons name="book-outline" size={12} color={Colors.textLight} />
                        <Text style={styles.notebookName} numberOfLines={1}>
                          {notebook?.title ?? 'Unknown notebook'}
                        </Text>
                      </View>
                      <View style={styles.dateBadge}>
                        <SakuraBadge />
                        <Text style={styles.dateText}>{updatedDate}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 30,
    color: Colors.text,
  },
  titleJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 16,
    color: Colors.primary,
  },
  headerIcon: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.white,
  },
  sectionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 32,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 24,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  emptyHintText: {
    fontFamily: Fonts.handwritten,
    fontSize: 14,
    color: Colors.textMuted,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    borderColor: Colors.border,
    borderWidth: 1,
  },
  cardBar: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pageTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 19,
    color: Colors.text,
    flex: 1,
  },
  unbookmarkBtn: {
    padding: 2,
  },
  pagePreview: {
    fontFamily: Fonts.handwritten,
    fontSize: 15,
    color: Colors.textLight,
    lineHeight: 22,
  },
  stickerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stickerInfoText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textLight,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  notebookRef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notebookName: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textLight,
    maxWidth: 140,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textLight,
  },
});
