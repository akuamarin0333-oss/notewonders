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

// ─── Global JS error handler (unhandled JS exceptions) ──────────────────────
if (Platform.OS !== 'web') {
  // ErrorUtils is available on React Native (JSC / Hermes)
  const globalHandler = (error: Error, isFatal: boolean) => {
    const title = isFatal ? '致命的なエラーが発生しました' : 'エラーが発生しました';
    const message =
      `${error?.message ?? String(error)}\n\n` +
      (error?.stack ? `スタック:\n${error.stack.slice(0, 600)}` : '');
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  // @ts-ignore – ErrorUtils is a React Native internal global
  if (typeof ErrorUtils !== 'undefined') {
    // @ts-ignore
    const previousHandler = ErrorUtils.getGlobalHandler();
    // @ts-ignore
    ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
      globalHandler(error, isFatal);
      // Chain to the original handler so Hermes / Metro still get it
      if (previousHandler) previousHandler(error, isFatal);
    });
  }

  // Unhandled Promise rejections
  const originalPromiseRejectionHandler =
    // @ts-ignore
    global.HermesInternal?.hasPromise?.()
      ? undefined
      : undefined;

  const prevHandler = (global as any).onunhandledrejection;
  (global as any).onunhandledrejection = (event: PromiseRejectionEvent) => {
    const reason = event?.reason;
    const message =
      reason instanceof Error
        ? `${reason.message}\n\n${reason.stack?.slice(0, 400) ?? ''}`
        : String(reason);
    Alert.alert('未処理のPromise Rejection', message, [{ text: 'OK' }]);
    if (prevHandler) prevHandler(event);
  };
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
