import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { FontMap } from '@/constants/Typography';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, Component, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert, Platform, ScrollView, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Remove browser focus outline on web ────────────────────────────────────
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent =
    'textarea:focus, input:focus { outline: none !important; box-shadow: none !important; }';
  document.head.appendChild(style);
}

// ─── Global JS error handler (React Native only — ErrorUtils is Hermes/JSC internal) ──
if (Platform.OS !== 'web') {
  try {
    // @ts-ignore – ErrorUtils is a React Native runtime global, not in TS defs
    const EU = global.ErrorUtils as {
      getGlobalHandler: () => ((error: Error, isFatal: boolean) => void) | null;
      setGlobalHandler: (handler: (error: Error, isFatal: boolean) => void) => void;
    } | undefined;

    if (EU) {
      const previousHandler = EU.getGlobalHandler();
      EU.setGlobalHandler((error: Error, isFatal: boolean) => {
        const title = isFatal ? '致命的なエラーが発生しました' : 'エラーが発生しました';
        const message =
          `${error?.message ?? String(error)}\n\n` +
          (error?.stack ? `スタック:\n${error.stack.slice(0, 600)}` : '');
        Alert.alert(title, message, [{ text: 'OK' }]);
        if (previousHandler) previousHandler(error, isFatal);
      });
    }
  } catch (_) {
    // Silently ignore if ErrorUtils is not available
  }
}

SplashScreen.preventAutoHideAsync();

// ─── Error Boundary ──────────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Show Alert as soon as the boundary catches an error
    const message =
      `${error?.message ?? String(error)}\n\n` +
      `コンポーネントスタック:\n${info.componentStack?.slice(0, 400) ?? ''}`;
    Alert.alert('レンダリングエラー', message, [
      {
        text: 'リトライ',
        onPress: () => this.setState({ hasError: false, error: null }),
      },
      { text: 'OK', style: 'cancel' },
    ]);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI – also displayed in case Alert is dismissed
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#fff8f8',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Ionicons name="warning" size={48} color="#c0392b" style={{ marginBottom: 16 }} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#c0392b',
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            アプリの起動に失敗しました
          </Text>
          <ScrollView
            style={{ maxHeight: 300, width: '100%' }}
            contentContainerStyle={{
              backgroundColor: '#1e1e1e',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              selectable
              style={{ color: '#f8f8f2', fontSize: 12, fontFamily: 'monospace' }}
            >
              {this.state.error?.message ?? 'Unknown error'}
              {'\n\n'}
              {this.state.error?.stack ?? ''}
            </Text>
          </ScrollView>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 20,
              backgroundColor: '#c0392b',
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 100,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              リトライ
            </Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [loaded, error] = useFonts(FontMap);

  useEffect(() => {
    if (loaded) {
      console.log('[App] ✅ アプリが正常に起動しました');
      SplashScreen.hideAsync();
    }
    if (error) {
      console.error('[App] ❌ フォント読み込みエラー:', error);
      Alert.alert(
        'フォント読み込みエラー',
        `フォントの読み込みに失敗しました。\n\n${error?.message ?? String(error)}`,
        [{ text: 'OK' }],
      );
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="notebook" />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
