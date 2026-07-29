import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { OrnatePanel } from '../components/OrnatePanel';
import { colors, serifFont, titleFont } from '../theme';
import { Task } from '../types';

type CodexScreenProps = {
  tasks: Task[];
};

export function CodexScreen({ tasks }: CodexScreenProps) {
  const completed = tasks.filter((task) => task.completed);
  const pending = tasks.length - completed.length;
  const cursed = tasks.filter((task) => task.cursed).length;
  const progress = tasks.length
    ? Math.round((completed.length / tasks.length) * 100)
    : 0;
  const recentCompleted = [...completed]
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, 3);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.kicker}>REGISTRO DE LA TRAVESÍA</Text>

      <OrnatePanel style={styles.progressPanel}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.panelLabel}>DESTINO CUMPLIDO</Text>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>
          <View style={styles.progressSeal}>
            <MaterialCommunityIcons
              color={colors.bronzeLight}
              name="shield-sword-outline"
              size={34}
            />
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` as `${number}%` },
            ]}
          />
        </View>
        <Text style={styles.progressCaption}>
          {tasks.length === 0
            ? 'El códice espera tu primer juramento.'
            : `${completed.length} de ${tasks.length} juramentos han sido sellados.`}
        </Text>
      </OrnatePanel>

      <View style={styles.statsGrid}>
        <StatCard icon="book-outline" label="TOTAL" value={tasks.length} />
        <StatCard icon="check-decagram-outline" label="CUMPLIDOS" value={completed.length} />
        <StatCard icon="timer-sand" label="PENDIENTES" value={pending} />
        <StatCard icon="fire" label="MALDITOS" value={cursed} />
      </View>

      <Text style={styles.sectionTitle}>Últimos sellos</Text>
      <OrnatePanel style={styles.historyPanel}>
        {recentCompleted.length === 0 ? (
          <View style={styles.historyEmpty}>
            <MaterialCommunityIcons
              color={colors.bronzeDark}
              name="seal-variant"
              size={31}
            />
            <Text style={styles.historyEmptyText}>
              Los juramentos cumplidos aparecerán aquí.
            </Text>
          </View>
        ) : (
          recentCompleted.map((task, index) => (
            <View
              key={task.id}
              style={[
                styles.historyRow,
                index > 0 && styles.historyRowBorder,
              ]}
            >
              <MaterialCommunityIcons
                color={colors.success}
                name="check-circle-outline"
                size={20}
              />
              <Text numberOfLines={1} style={styles.historyTitle}>
                {task.title}
              </Text>
            </View>
          ))
        )}
      </OrnatePanel>
    </ScrollView>
  );
}

type StatCardProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: number;
};

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <OrnatePanel style={styles.statCard}>
      <MaterialCommunityIcons color={colors.bronze} name={icon} size={22} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </OrnatePanel>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 22,
  },
  kicker: {
    color: colors.bronzeLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 9,
    textAlign: 'center',
  },
  progressPanel: {
    padding: 18,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.25,
  },
  progressValue: {
    color: colors.ivory,
    fontFamily: titleFont,
    fontSize: 35,
    fontWeight: '700',
    marginTop: 2,
  },
  progressSeal: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: '#100B09',
    elevation: 3,
  },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    marginTop: 15,
    borderRadius: 4,
    backgroundColor: '#070504',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.crimsonLight,
  },
  progressCaption: {
    color: colors.muted,
    fontFamily: serifFont,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  statCard: {
    width: '48.5%',
    minHeight: 101,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  statValue: {
    color: colors.ivory,
    fontFamily: titleFont,
    fontSize: 25,
    fontWeight: '700',
    marginVertical: 2,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  sectionTitle: {
    color: colors.ivory,
    fontFamily: titleFont,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 17,
    marginBottom: 8,
  },
  historyPanel: {
    minHeight: 104,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  historyEmpty: {
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmptyText: {
    color: colors.muted,
    fontFamily: serifFont,
    fontSize: 13,
    marginTop: 7,
    textAlign: 'center',
  },
  historyRow: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyRowBorder: {
    marginTop: 2,
  },
  historyTitle: {
    flex: 1,
    color: colors.ivory,
    fontFamily: serifFont,
    fontSize: 14,
  },
});
