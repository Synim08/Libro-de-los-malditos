import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '../theme';

type OrnatePanelProps = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function OrnatePanel({ children, style }: OrnatePanelProps) {
  return <View style={[styles.outer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
    borderRadius: 12,
    backgroundColor: 'rgba(20, 14, 11, 0.92)',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.42,
    shadowRadius: 7,
  },
});
