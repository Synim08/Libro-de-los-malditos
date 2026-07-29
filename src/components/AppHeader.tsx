import { StyleSheet, Text, View } from 'react-native';

import { colors, serifFont, titleFont } from '../theme';

type AppHeaderProps = {
  compact: boolean;
  completedCount: number;
  totalCount: number;
};

export function AppHeader({
  compact,
  completedCount,
  totalCount,
}: AppHeaderProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Text style={[styles.rune, compact && styles.runeCompact]}>⌘</Text>
      <Text style={[styles.title, compact && styles.titleCompact]}>
        Libro de los Malditos
      </Text>

      <View style={[styles.rule, compact && styles.ruleCompact]}>
        <View style={styles.ruleLine} />
        <Text style={styles.ruleGlyph}>◆</Text>
        <View style={styles.ruleLine} />
      </View>

      <Text style={styles.counter}>
        Juramentos{' '}
        <Text style={styles.counterAccent}>{completedCount}</Text>
        {' / '}
        {totalCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  containerCompact: {
    paddingBottom: 9,
  },
  rune: {
    color: colors.crimsonLight,
    fontSize: 20,
    marginBottom: 2,
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  runeCompact: {
    fontSize: 16,
    marginBottom: 0,
  },
  title: {
    color: colors.ivory,
    fontFamily: titleFont,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleCompact: {
    fontSize: 24,
  },
  rule: {
    width: '75%',
    maxWidth: 290,
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 8,
  },
  ruleCompact: {
    marginTop: 5,
    marginBottom: 4,
  },
  ruleLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.bronzeDark,
  },
  ruleGlyph: {
    color: colors.bronze,
    fontSize: 8,
    marginHorizontal: 8,
  },
  counter: {
    color: colors.muted,
    fontFamily: serifFont,
    fontSize: 15,
    letterSpacing: 1.1,
  },
  counterAccent: {
    color: colors.crimsonLight,
    fontSize: 18,
    fontWeight: '700',
  },
});
