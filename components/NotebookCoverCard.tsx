import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';
import type { Notebook } from '@/store/types';

interface NotebookCoverCardProps {
  notebook: Notebook;
  pageCount: number;
  onPress: () => void;
  onLongPress?: () => void;
}

const COVER_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  fluffy: { bg: '#F5F0EB', accent: '#F9A8C9', text: '#5C4A4A' },
  leather: { bg: '#8B6340', accent: '#C4956A', text: '#FFF5EB' },
  spring: { bg: '#FADADD', accent: '#A8D8EA', text: '#5C4A4A' },
};

function PawDecoration({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28">
      <Ellipse cx={14} cy={18} rx={6} ry={5} fill={color} opacity={0.4} />
      <Circle cx={8} cy={11} r={3} fill={color} opacity={0.4} />
      <Circle cx={14} cy={9} r={3} fill={color} opacity={0.4} />
      <Circle cx={20} cy={11} r={3} fill={color} opacity={0.4} />
    </Svg>
  );
}

function SakuraDecoration({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M12 2 C10 5 8 6 6 6 C8 8 8 10 6 12 C9 11 11 12 12 14 C13 12 15 11 18 12 C16 10 16 8 18 6 C16 6 14 5 12 2Z" fill={color} opacity={0.5} />
      <Circle cx={12} cy={10} r={2} fill="#FFFFFF" opacity={0.6} />
    </Svg>
  );
}

export default function NotebookCoverCard({ notebook, pageCount, onPress, onLongPress }: NotebookCoverCardProps) {
  const theme = COVER_COLORS[notebook.coverTheme] ?? COVER_COLORS.fluffy;
  const lastEdited = new Date(notebook.lastEdited);
  const dateStr = lastEdited.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      style={[styles.card, Shadow.medium]}
    >
      <View style={[styles.cover, { backgroundColor: theme.bg }]}>
        {/* Texture lines for fluffy/leather */}
        {notebook.coverTheme === 'leather' && (
          <View style={styles.leatherTexture}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.leatherLine, { opacity: 0.15, top: 20 + i * 18 }]} />
            ))}
          </View>
        )}

        {/* Decorations */}
        <View style={styles.topDecor}>
          <SakuraDecoration color={theme.accent} />
        </View>
        <View style={styles.bottomDecor}>
          <PawDecoration color={theme.accent} />
        </View>

        {/* Spine */}
        <View style={[styles.spine, { backgroundColor: theme.accent }]} />

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text, fontFamily: Fonts.handwrittenBold }]} numberOfLines={2}>
            {notebook.title || 'My Notebook'}
          </Text>
          <View style={styles.meta}>
            <Ionicons name="document-text-outline" size={12} color={theme.text} style={{ opacity: 0.6 }} />
            <Text style={[styles.metaText, { color: theme.text, fontFamily: Fonts.regular }]}>
              {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </Text>
          </View>
          <Text style={[styles.date, { color: theme.text, fontFamily: Fonts.regular }]}>
            {dateStr}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    flex: 1,
    margin: Spacing.xs,
    minHeight: 160,
    maxWidth: '48%',
  },
  cover: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: Spacing.md + 8,
    position: 'relative',
  },
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
    opacity: 0.7,
  },
  leatherTexture: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  leatherLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#FFF5EB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.7,
  },
  date: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 2,
  },
  topDecor: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomDecor: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
});
