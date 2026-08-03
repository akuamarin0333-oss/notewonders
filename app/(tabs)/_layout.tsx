import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '@/constants/Theme';
import { Fonts } from '@/constants/Typography';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
};

function TabIcon({ name, focused, label }: TabIconProps) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? Colors.primary : Colors.textLight}
      />
      <Text
        style={[
          tabStyles.label,
          { color: focused ? Colors.primary : Colors.textLight },
          focused && tabStyles.labelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    paddingTop: 4,
    paddingHorizontal: 8,
    paddingBottom: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
    minWidth: 64,
  },
  iconWrapActive: {
    backgroundColor: '#FFF0F5',
  },
  label: {
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
  labelActive: {
    fontFamily: Fonts.semiBold,
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
          height: 60 + insets.bottom,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} label="ホーム" />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar-outline" focused={focused} label="カレンダー" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings-outline" focused={focused} label="設定" />
          ),
        }}
      />
      {/* favorites is kept as a route but hidden from tab bar */}
      <Tabs.Screen
        name="favorites"
        options={{ href: null }}
      />
    </Tabs>
  );
}
