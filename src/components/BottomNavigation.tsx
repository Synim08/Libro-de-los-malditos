import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, serifFont } from '../theme';
import { TabKey } from '../types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type TabDefinition = {
  key: TabKey;
  label: string;
  icon: IconName;
};

const tabs: TabDefinition[] = [
  { key: 'oaths', label: 'Juramentos', icon: 'eye-outline' },
  { key: 'curses', label: 'Maldiciones', icon: 'sword-cross' },
  { key: 'codex', label: 'Códice', icon: 'book-open-page-variant-outline' },
  { key: 'more', label: 'Más', icon: 'menu' },
];

type BottomNavigationProps = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

export function BottomNavigation({
  activeTab,
  onChange,
}: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;

        return (
          <Pressable
            accessibilityLabel={`Abrir ${tab.label}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              active && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
          >
            <MaterialCommunityIcons
              color={active ? colors.crimson : colors.muted}
              name={tab.icon}
              size={24}
            />
            <Text
              numberOfLines={1}
              style={[styles.label, active && styles.labelActive]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 5,
    paddingRight: 5,
    paddingBottom: Platform.OS === 'ios' ? 18 : 7,
    paddingLeft: 5,
    backgroundColor: 'rgba(13, 9, 7, 0.97)',
  },
  tab: {
    flex: 1,
    minHeight: 57,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    paddingHorizontal: 2,
    borderRadius: 7,
  },
  tabActive: {
    backgroundColor: colors.parchment,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.42,
    shadowRadius: 4,
  },
  tabPressed: {
    opacity: 0.68,
  },
  label: {
    color: colors.muted,
    fontFamily: serifFont,
    fontSize: 10,
    marginTop: 3,
  },
  labelActive: {
    color: '#2B1D15',
    fontWeight: '700',
  },
});
