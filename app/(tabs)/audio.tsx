import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect } from 'react-native-svg';
import { useAppStore } from '@/store/useAppStore';
import { Colors, Shadow, BorderRadius, Spacing } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';

function WaveformBars({ levels, isRecording }: { levels: number[]; isRecording: boolean }) {
  const barCount = 32;
  const barWidth = 5;
  const gap = 2;
  const totalW = barCount * (barWidth + gap);
  const height = 60;

  return (
    <Svg width={totalW} height={height} viewBox={`0 0 ${totalW} ${height}`}>
      {Array.from({ length: barCount }).map((_, i) => {
        const level = levels[i % levels.length] ?? 0.3;
        const barH = Math.max(4, level * (height - 8));
        const x = i * (barWidth + gap);
        const y = (height - barH) / 2;
        const color = isRecording ? Colors.primary : Colors.accent;
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barH}
            rx={barWidth / 2}
            fill={color}
            opacity={isRecording ? 0.8 + 0.2 * level : 0.5}
          />
        );
      })}
    </Svg>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface RenameModalProps {
  visible: boolean;
  currentTitle: string;
  onConfirm: (title: string) => void;
  onCancel: () => void;
}

function RenameModal({ visible, currentTitle, onConfirm, onCancel }: RenameModalProps) {
  const [value, setValue] = useState(currentTitle);

  useEffect(() => {
    if (visible) setValue(currentTitle);
  }, [visible, currentTitle]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Rename Memo</Text>
          <TextInput
            style={styles.modalInput}
            value={value}
            onChangeText={setValue}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={() => {
              if (value.trim()) onConfirm(value.trim());
            }}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtn} onPress={onCancel}>
              <Text style={styles.modalBtnTextCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnPrimary]}
              onPress={() => {
                if (value.trim()) onConfirm(value.trim());
              }}
            >
              <Text style={styles.modalBtnTextConfirm}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AudioMemoScreen() {
  const insets = useSafeAreaInsets();
  const { audioMemos, addAudioMemo, deleteAudioMemo, updateAudioMemo } = useAppStore();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [waveLevels, setWaveLevels] = useState<number[]>(Array(32).fill(0.3));
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rename modal state
  const [renameModal, setRenameModal] = useState<{ id: string; title: string } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Native recorder ref — holds AudioRecorder instance from expo-audio
  const recorderRef = useRef<{ stop: () => Promise<void>; uri: string | null } | null>(null);
  const playerRef = useRef<{ stop: () => void } | null>(null);

  // Web MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveTimerRef.current) clearInterval(waveTimerRef.current);
  }, []);

  const startWaveAnimation = useCallback(() => {
    waveTimerRef.current = setInterval(() => {
      setWaveLevels(Array.from({ length: 32 }, () => 0.2 + Math.random() * 0.8));
    }, 120);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      setIsLoading(true);
      if (Platform.OS === 'web') {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          throw new Error('Audio recording not available in this browser');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        chunksRef.current = [];
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mr.start();
        mediaRecorderRef.current = mr;
      } else {
        // Use expo-audio proper API
        const expoAudio = await import('expo-audio');
        const permResult = await expoAudio.requestRecordingPermissionsAsync();
        if (permResult.status !== 'granted') {
          throw new Error('Microphone permission not granted');
        }
        await expoAudio.setAudioModeAsync({ allowsRecording: true });

        // Create recorder using the AudioModule directly (works in both managed and bare)
        const AudioModuleNative = (expoAudio as unknown as { AudioModule: { AudioRecorder: new (opts: object) => { prepareToRecordAsync: () => Promise<void>; record: () => void; stop: () => Promise<void>; uri: string | null } } }).AudioModule;
        if (!AudioModuleNative?.AudioRecorder) {
          throw new Error('Native recording not available on this device');
        }
        const rec = new AudioModuleNative.AudioRecorder(expoAudio.RecordingPresets.HIGH_QUALITY);
        await rec.prepareToRecordAsync();
        rec.record();
        recorderRef.current = rec;
      }
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
      startWaveAnimation();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not start recording';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [startWaveAnimation]);

  const stopRecording = useCallback(async () => {
    stopTimer();
    setIsLoading(true);
    const duration = recordingSeconds;
    try {
      let uri = '';
      if (Platform.OS === 'web' && mediaRecorderRef.current) {
        const mr = mediaRecorderRef.current;
        await new Promise<void>((resolve) => {
          mr.onstop = () => resolve();
          mr.stop();
          mr.stream.getTracks().forEach((t) => t.stop());
        });
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        uri = URL.createObjectURL(blob);
        mediaRecorderRef.current = null;
      } else if (recorderRef.current) {
        await recorderRef.current.stop();
        uri = recorderRef.current.uri ?? '';
        recorderRef.current = null;
      }

      if (uri) {
        addAudioMemo({
          title: `Memo ${formatDate(Date.now())}`,
          duration,
          uri,
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error stopping recording';
      setError(msg);
    } finally {
      setIsRecording(false);
      setRecordingSeconds(0);
      setWaveLevels(Array(32).fill(0.3));
      setIsLoading(false);
    }
  }, [recordingSeconds, stopTimer, addAudioMemo]);

  const handlePlayPause = useCallback(
    async (memoId: string, uri: string) => {
      if (playingId === memoId) {
        if (playerRef.current) {
          playerRef.current.stop();
          playerRef.current = null;
        }
        setPlayingId(null);
        return;
      }

      setPlayingId(memoId);
      try {
        if (Platform.OS === 'web') {
          const audio = new Audio(uri);
          audio.onended = () => setPlayingId(null);
          await audio.play();
          playerRef.current = {
            stop: () => {
              audio.pause();
              audio.currentTime = 0;
            },
          };
        } else {
          const expoAudio = await import('expo-audio');
          await expoAudio.setAudioModeAsync({ allowsRecording: false });
          const player = expoAudio.createAudioPlayer({ uri });
          player.addListener('playbackStatusUpdate', (status: { didJustFinish?: boolean }) => {
            if (status.didJustFinish) setPlayingId(null);
          });
          player.play();
          playerRef.current = {
            stop: () => {
              player.pause();
              player.remove();
            },
          };
        }
      } catch {
        setPlayingId(null);
        setError('Could not play audio');
      }
    },
    [playingId]
  );

  const handleDelete = useCallback(
    (id: string, title: string) => {
      Alert.alert('Delete Memo', `Delete "${title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAudioMemo(id) },
      ]);
    },
    [deleteAudioMemo]
  );

  const handleRename = useCallback(
    (id: string, currentTitle: string) => {
      if (Platform.OS === 'ios') {
        Alert.prompt(
          'Rename Memo',
          'Enter a new name:',
          (newTitle) => {
            if (newTitle?.trim()) {
              updateAudioMemo(id, { title: newTitle.trim() });
            }
          },
          'plain-text',
          currentTitle
        );
      } else {
        // Android & web: use custom modal dialog
        setRenameModal({ id, title: currentTitle });
      }
    },
    [updateAudioMemo]
  );

  const handleRenameConfirm = useCallback(
    (newTitle: string) => {
      if (renameModal) {
        updateAudioMemo(renameModal.id, { title: newTitle });
        setRenameModal(null);
      }
    },
    [renameModal, updateAudioMemo]
  );

  const handleRenameCancel = useCallback(() => {
    setRenameModal(null);
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Audio Memo</Text>
            <Text style={styles.titleJa}>おとメモ</Text>
          </View>
          <Ionicons name="mic" size={28} color={Colors.primary} />
        </View>

        {/* Recorder card */}
        <View style={[styles.recorderCard, Shadow.medium]}>
          {/* Cat headphone decoration */}
          <View style={styles.catDecor}>
            <View style={[styles.catEar, styles.catEarLeft]} />
            <View style={[styles.catEar, styles.catEarRight]} />
            <View style={styles.catHead}>
              <Ionicons name="headset" size={32} color={Colors.primary} />
            </View>
          </View>

          {/* Waveform */}
          <View style={styles.waveform}>
            <WaveformBars levels={waveLevels} isRecording={isRecording} />
          </View>

          {/* Timer */}
          <Text style={styles.timer}>
            {isRecording ? formatDuration(recordingSeconds) : '00:00'}
          </Text>

          {/* Record button */}
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            style={[
              styles.recordBtn,
              isRecording && styles.recordBtnActive,
              isLoading && { opacity: 0.6 },
            ]}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : isRecording ? (
              <Ionicons name="stop" size={28} color={Colors.white} />
            ) : (
              <Ionicons name="mic" size={28} color={Colors.white} />
            )}
          </TouchableOpacity>
          <Text style={styles.recordHint}>
            {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
          </Text>
          <Text style={styles.recordHintJa}>
            {isRecording ? 'タップで停止' : 'タップで録音開始'}
          </Text>

          {error !== null && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Memo list */}
        <Text style={styles.sectionTitle}>
          Recordings ({audioMemos.length}) / きろく
        </Text>

        {audioMemos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mic-off-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No recordings yet</Text>
            <Text style={styles.emptySubtext}>Start recording your voice memos above!</Text>
          </View>
        ) : (
          audioMemos
            .slice()
            .reverse()
            .map((memo) => (
              <View key={memo.id} style={[styles.memoCard, Shadow.small]}>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => handlePlayPause(memo.id, memo.uri)}
                >
                  <Ionicons
                    name={playingId === memo.id ? 'pause-circle' : 'play-circle'}
                    size={40}
                    color={playingId === memo.id ? Colors.accent : Colors.primary}
                  />
                </TouchableOpacity>
                <View style={styles.memoInfo}>
                  <TouchableOpacity onLongPress={() => handleRename(memo.id, memo.title)}>
                    <Text style={styles.memoTitle} numberOfLines={1}>{memo.title}</Text>
                  </TouchableOpacity>
                  <View style={styles.memoMeta}>
                    <Ionicons name="time-outline" size={12} color={Colors.textLight} />
                    <Text style={styles.memoMetaText}>{formatDuration(memo.duration)}</Text>
                    <Ionicons name="calendar-outline" size={12} color={Colors.textLight} />
                    <Text style={styles.memoMetaText}>{formatDate(memo.createdAt)}</Text>
                  </View>
                  {playingId === memo.id && (
                    <Text style={styles.playingLabel}>Playing...</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(memo.id, memo.title)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.textLight} />
                </TouchableOpacity>
              </View>
            ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Rename modal for Android / web */}
      <RenameModal
        visible={renameModal !== null}
        currentTitle={renameModal?.title ?? ''}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
      />
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
  recorderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    borderColor: Colors.border,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  catDecor: {
    alignItems: 'center',
    position: 'relative',
    height: 48,
    width: 60,
  },
  catEar: {
    position: 'absolute',
    width: 14,
    height: 16,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    top: 0,
  },
  catEarLeft: { left: 4 },
  catEarRight: { right: 4 },
  catHead: {
    position: 'absolute',
    bottom: 0,
  },
  waveform: {
    marginVertical: 4,
  },
  timer: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 40,
    color: Colors.text,
    letterSpacing: 2,
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.medium,
  },
  recordBtnActive: {
    backgroundColor: Colors.ladybug,
  },
  recordHint: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textLight,
  },
  recordHintJa: {
    fontFamily: Fonts.handwritten,
    fontSize: 13,
    color: Colors.textMuted,
  },
  errorText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.error,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 20,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontFamily: Fonts.handwritten,
    fontSize: 18,
    color: Colors.textLight,
  },
  emptySubtext: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  memoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  playBtn: { padding: 4 },
  memoInfo: { flex: 1, gap: 4 },
  memoTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.text,
  },
  memoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memoMetaText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textLight,
    marginRight: 4,
  },
  playingLabel: {
    fontFamily: Fonts.handwritten,
    fontSize: 13,
    color: Colors.primary,
  },
  deleteBtn: {
    padding: 8,
  },
  // Rename modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.sm,
    ...Shadow.medium,
  },
  modalTitle: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 20,
    color: Colors.text,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: 4,
  },
  modalBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  modalBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  modalBtnTextCancel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textLight,
  },
  modalBtnTextConfirm: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.white,
  },
});
