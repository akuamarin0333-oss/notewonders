import React, { useState, useMemo, useCallback } from 'react';
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
import Svg, { Path, Circle } from 'react-native-svg';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_JA = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];


function SakuraIcon({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2 C10 5 6 6 4 6 C6 8 6 10 4 12 C7 11 9 12 10 14 C11 12 13 11 16 12 C14 10 14 8 16 6 C14 6 14 5 12 2Z" fill="#FFB7C5" />
      <Circle cx={12} cy={8} r={2} fill="#FFE4EC" />
    </Svg>
  );
}

function CloverIcon({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={5} fill="#8BC34A" opacity={0.8} />
      <Circle cx={16} cy={12} r={5} fill="#8BC34A" opacity={0.8} />
      <Circle cx={8} cy={12} r={5} fill="#8BC34A" opacity={0.8} />
      <Circle cx={12} cy={16} r={5} fill="#8BC34A" opacity={0.8} />
    </Svg>
  );
}

export default function SpringCalendar() {
  const insets = useSafeAreaInsets();
  const { pages, notebooks } = useAppStore();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Map 'YYYY-MM-DD' -> page entries
  const datePageMap = useMemo(() => {
    const map: Record<string, typeof pages> = {};
    pages.forEach((p) => {
      if (p.linkedDate) {
        if (!map[p.linkedDate]) map[p.linkedDate] = [];
        map[p.linkedDate].push(p);
      }
    });
    return map;
  }, [pages]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun

  const calendarCells: (number | null)[] = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [daysInMonth, firstDayOfMonth]);

  const navigateMonth = useCallback((dir: 1 | -1) => {
    const newDate = new Date(year, month + dir, 1);
    setYear(newDate.getFullYear());
    setMonth(newDate.getMonth());
    setSelectedDate(null);
  }, [year, month]);

  const dateKey = useCallback(
    (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    [year, month]
  );

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const isSpringMonth = month >= 2 && month <= 4; // March-May
  const decorType = isSpringMonth ? 'sakura' : (month >= 5 && month <= 7) ? 'clover' : 'sakura';

  const selectedPages = selectedDate ? (datePageMap[selectedDate] ?? []) : [];

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Spring Calendar</Text>
            <Text style={styles.titleJa}>はるのカレンダー</Text>
          </View>
          {decorType === 'sakura' ? <SakuraIcon size={28} /> : <CloverIcon size={28} />}
        </View>

        {/* Calendar card */}
        <View style={[styles.calCard, Shadow.medium]}>
          {/* Month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={22} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.monthCenter}>
              <Text style={styles.monthText}>{MONTHS[month]}</Text>
              <Text style={styles.monthJa}>{MONTHS_JA[month]} {year}</Text>
            </View>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map((d, i) => (
              <View key={i} style={styles.dayHeaderCell}>
                <Text style={[styles.dayHeaderText, (i === 0 || i === 6) && styles.dayHeaderWeekend]}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {calendarCells.map((day, i) => {
              if (day === null) {
                return <View key={`null-${i}`} style={styles.dayCell} />;
              }
              const key = dateKey(day);
              const hasEntries = datePageMap[key]?.length > 0;
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              // Spring special days: 1st, 5th, 10th, 15th, 20th of spring months
              const isSpecial = isSpringMonth && [1, 5, 10, 15, 20, 25].includes(day);

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.dayCell,
                    isToday && styles.dayCellToday,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => setSelectedDate(isSelected ? null : key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isToday && styles.dayNumberToday,
                      isSelected && styles.dayNumberSelected,
                    ]}
                  >
                    {day}
                  </Text>
                  {isSpecial && !hasEntries && (
                    <View style={styles.dayDecor}>
                      {decorType === 'sakura' ? <SakuraIcon size={10} /> : <CloverIcon size={10} />}
                    </View>
                  )}
                  {hasEntries && (
                    <View style={styles.entryDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected date panel */}
        {selectedDate && (
          <View style={[styles.selectedPanel, Shadow.small]}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedDate}>{selectedDate}</Text>
              {decorType === 'sakura' ? <SakuraIcon size={20} /> : <CloverIcon size={20} />}
            </View>

            {selectedPages.length === 0 ? (
              <View style={styles.noEntries}>
                <Text style={styles.noEntriesText}>No diary entries for this date</Text>
                <Text style={styles.noEntriesHint}>Link a page to this date from within a notebook</Text>
              </View>
            ) : (
              selectedPages.map((p) => {
                const nb = notebooks.find((n) => n.id === p.notebookId);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.entryCard}
                    onPress={() => router.push(`/notebook/${p.notebookId}`)}
                  >
                    <View style={styles.entryCardContent}>
                      <Text style={styles.entryTitle} numberOfLines={1}>
                        {p.title || 'Untitled page'}
                      </Text>
                      <Text style={styles.entryPreview} numberOfLines={2}>
                        {p.content || 'No content'}
                      </Text>
                    </View>
                    <View style={styles.entryMeta}>
                      <Text style={styles.entryNotebook} numberOfLines={1}>{nb?.title}</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.textLight} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
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
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: 8,
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
  calCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  navBtn: { padding: 6 },
  monthCenter: { alignItems: 'center' },
  monthText: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 22,
    color: Colors.text,
  },
  monthJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 13,
    color: Colors.primary,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.textLight,
  },
  dayHeaderWeekend: {
    color: Colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: BorderRadius.sm,
  },
  dayCellToday: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayNumber: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.text,
  },
  dayNumberToday: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },
  dayNumberSelected: {
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  dayDecor: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  entryDot: {
    position: 'absolute',
    bottom: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  selectedPanel: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderColor: Colors.border,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  selectedDate: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 20,
    color: Colors.text,
    flex: 1,
  },
  noEntries: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: 4,
  },
  noEntriesText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textLight,
  },
  noEntriesHint: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 8,
  },
  entryCardContent: { flex: 1, gap: 2 },
  entryTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.text,
  },
  entryPreview: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textLight,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  entryNotebook: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textLight,
    maxWidth: 80,
  },
});
