import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import NotebookCoverCard from '@/components/NotebookCoverCard';
import NekoEmoji from '@/components/NekoEmoji';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import type { CoverTheme } from '@/store/types';

const COVER_THEMES: { key: CoverTheme; label: string }[] = [
  { key: 'fluffy', label: 'Fluffy' },
  { key: 'leather', label: 'Leather' },
  { key: 'spring', label: 'Spring' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { notebooks, pages, addNotebook, deleteNotebook } = useAppStore();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTheme, setNewTheme] = useState<CoverTheme>('fluffy');
  const [isCreating, setIsCreating] = useState(false);

  const getPageCount = useCallback(
    (notebookId: string) => pages.filter((p) => p.notebookId === notebookId).length,
    [pages]
  );

  const handleOpenNotebook = useCallback((id: string) => {
    router.push(`/notebook/${id}`);
  }, []);

  const handleDeleteNotebook = useCallback(
    (id: string, title: string) => {
      Alert.alert(
        'Delete Notebook',
        `Delete "${title}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteNotebook(id),
          },
        ]
      );
    },
    [deleteNotebook]
  );

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const notebook = addNotebook(newTitle.trim(), newTheme);
      setShowNewModal(false);
      setNewTitle('');
      setNewTheme('fluffy');
      router.push(`/notebook/${notebook.id}`);
    } finally {
      setIsCreating(false);
    }
  }, [newTitle, newTheme, addNotebook]);

  const greetings = useMemo(() => ['Nyaa~! What will you write today?', 'Let\'s fill pages with memories!', 'Spring is a perfect time to journal!'], []);
  const greeting = useMemo(() => greetings[Math.floor(notebooks.length % greetings.length)], [notebooks.length, greetings]);

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>My Notebooks</Text>
            <Text style={styles.headerJa}>ねこノート</Text>
          </View>
          <View style={styles.mascot}>
            <NekoEmoji size={56} mood={notebooks.length > 0 ? 'happy' : 'excited'} />
          </View>
        </View>

        {/* Greeting bubble */}
        <View style={styles.greetingBubble}>
          <Text style={styles.greetingText}>{greeting}</Text>
        </View>

        {/* Grid of notebooks */}
        {notebooks.length === 0 ? (
          <View style={styles.emptyState}>
            <NekoEmoji size={90} mood="sleeping" />
            <Text style={styles.emptyTitle}>No notebooks yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to create your first notebook!</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {notebooks.map((nb) => (
              <NotebookCoverCard
                key={nb.id}
                notebook={nb}
                pageCount={getPageCount(nb.id)}
                onPress={() => handleOpenNotebook(nb.id)}
                onLongPress={() => handleDeleteNotebook(nb.id, nb.title)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, Shadow.large, { bottom: insets.bottom + 80 }]}
        onPress={() => setShowNewModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* New Notebook Modal */}
      <Modal visible={showNewModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, Shadow.large]}>
            <View style={styles.modalHeader}>
              <NekoEmoji size={40} mood="excited" />
              <Text style={styles.modalTitle}>New Notebook</Text>
            </View>
            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="My Spring Journal..."
              placeholderTextColor={Colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              maxLength={40}
            />
            <Text style={styles.modalLabel}>Cover Theme</Text>
            <View style={styles.themeRow}>
              {COVER_THEMES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setNewTheme(t.key)}
                  style={[styles.themeChip, newTheme === t.key && styles.themeChipActive]}
                >
                  <Text style={[styles.themeChipText, newTheme === t.key && styles.themeChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => { setShowNewModal(false); setNewTitle(''); }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                disabled={!newTitle.trim() || isCreating}
                style={[styles.createBtn, (!newTitle.trim() || isCreating) && styles.createBtnDisabled]}
              >
                {isCreating ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.createBtnText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerLeft: { gap: 2 },
  headerTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 32,
    color: Colors.text,
  },
  headerJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 18,
    color: Colors.primary,
  },
  mascot: {
    marginTop: -8,
  },
  greetingBubble: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderColor: Colors.border,
    borderWidth: 1,
    ...Shadow.small,
  },
  greetingText: {
    fontFamily: Fonts.handwritten,
    fontSize: 17,
    color: Colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 22,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(92,74,74,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 26,
    color: Colors.text,
  },
  modalLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    fontFamily: Fonts.handwritten,
    fontSize: 18,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  themeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  themeChipText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.textLight,
  },
  themeChipTextActive: {
    color: Colors.white,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.textLight,
  },
  createBtn: {
    flex: 2,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
});
