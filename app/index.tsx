import { View, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

export default function CoverScreen() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={{ flex: 1, backgroundColor: '#F5EFE6' }}>
      {/* Full-screen cover image */}
      <Image
        source={require('../assets/bg_cover_top.png')}
        style={{ width, height }}
        contentFit="cover"
        priority="high"
      />

      {/* Transparent tap area over "Open Notebook" text at ~75-80% down */}
      <Pressable
        onPress={() => router.push('/(tabs)')}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: height * 0.73,
          height: height * 0.12,
        }}
      />
    </View>
  );
}
