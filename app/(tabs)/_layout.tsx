import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  size: number;
  label: string;
  labelJa: string;
};

function TabIcon({ name, focused, color, size, label, labelJa }: TabIconProps) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Ionicons name={name} size={size} color={focused ? Colors.primary : Colors.textLight} />
      <Text style={[tabStyles.label, { color: focused ? Colors.primary : Colors.textLight }]}>
        {label}
      </Text>
      {focused && <Text style={tabStyles.labelJa}>{labelJa}</Text>}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  iconWrapActive: {
    backgroundColor: '#FFF0F5',
  },
  label: {
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
  labelJa: {
    fontSize: 8,
    color: Colors.primary,
    fontFamily: Fonts.regular,
  },
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1.5,
          paddingBottom: insets.bottom,
          height: 64 + insets.bottom,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="book-outline" focused={focused} color={color} size={size} label="Notes" labelJa="ノート" />
          ),
        }}
      />
      <Tabs.Screen
        name="pet"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="heart-outline" focused={focused} color={color} size={size} label="Pet" labelJa="なでなで" />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="calendar-outline" focused={focused} color={color} size={size} label="Calendar" labelJa="カレンダー" />
          ),
        }}
      />
      <Tabs.Screen
        name="audio"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="mic-outline" focused={focused} color={color} size={size} label="Audio" labelJa="おと" />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="bookmark-outline" focused={focused} color={color} size={size} label="Saved" labelJa="お気に入り" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="settings-outline" focused={focused} color={color} size={size} label="Settings" labelJa="せってい" />
          ),
        }}
      />
    </Tabs>
  );
}
