import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { OrnatePanel } from '../components/OrnatePanel';
import { isOverdue, startOfDay } from '../taskUtils';
import { colors, serifFont, titleFont } from '../theme';
import { CompletionRecord, Task } from '../types';

type CodexScreenProps = {
  completionHistory: CompletionRecord[];
  tasks: Task[];
};

const dayLabel = (timestamp: number) =>
  new Intl.DateTimeFormat('es', { weekday: 'narrow' })
    .format(new Date(timestamp))
    .toLocaleUpperCase('es');

const shiftDay = (timestamp: number, amount: number) => {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + amount);
  return startOfDay(date.getTime());
};

export function CodexScreen({ completionHistory, tasks }: CodexScreenProps) {
  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - completed;
  const overdue = tasks.filter(isOverdue).length;
  const cursedCompleted = completionHistory.filter((record) => record.cursed).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const today = startOfDay(Date.now());
  const activity = Array.from({ length: 7 }, (_, index) => {
    const day = shiftDay(today, index - 6);
    return {
      day,
      count: completionHistory.filter(
        (record) => startOfDay(record.completedAt) === day,
      ).length,
    };
  });
  const weeklyTotal = activity.reduce((sum, item) => sum + item.count, 0);
  const maxActivity = Math.max(1, ...activity.map((item) => item.count));
  const activeDays = new Set(
    completionHistory.map((record) => startOfDay(record.completedAt)),
  );
  let streakCursor = activeDays.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (activeDays.has(streakCursor)) {
    streak += 1;
    streakCursor = shiftDay(streakCursor, -1);
  }
  const recentCompleted = [...completionHistory]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 5);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.kicker}>REGISTRO DE LA TRAVESÍA</Text>

      <OrnatePanel style={styles.progressPanel}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.panelLabel}>DESTINO ACTUAL</Text>
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
            : `${completed} de ${tasks.length} páginas activas han sido selladas.`}
        </Text>
      </OrnatePanel>

      <View style={styles.statsGrid}>
        <StatCard icon="check-decagram-outline" label="SELLOS TOTALES" value={completionHistory.length} />
        <StatCard icon="calendar-week" label="ESTA SEMANA" value={weeklyTotal} />
        <StatCard icon="fire-circle" label="RACHA" suffix="d" value={streak} />
        <StatCard icon="clock-alert-outline" label="VENCIDOS" value={overdue} />
        <StatCard icon="timer-sand" label="PENDIENTES" value={pending} />
        <StatCard icon="sword-cross" label="MALDICIONES" value={cursedCompleted} />
      </View>

      <Text style={styles.sectionTitle}>Actividad de siete días</Text>
      <OrnatePanel style={styles.activityPanel}>
        <View style={styles.activityChart}>
          {activity.map((item) => (
            <View key={item.day} style={styles.activityColumn}>
              <Text style={styles.activityCount}>{item.count}</Text>
              <View style={styles.activityTrack}>
                <View
                  style={[
                    styles.activityFill,
                    {
                      height: `${
                        item.count === 0
                          ? 0
                          : Math.max(8, (item.count / maxActivity) * 100)
                      }%` as `${number}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.activityDay}>{dayLabel(item.day)}</Text>
            </View>
          ))}
        </View>
      </OrnatePanel>

      <Text style={styles.sectionTitle}>Últimos sellos</Text>
      <OrnatePanel style={styles.historyPanel}>
        {recentCompleted.length === 0 ? (
          <View style={styles.historyEmpty}>
            <MaterialCommunityIcons color={colors.bronzeDark} name="seal-variant" size={31} />
            <Text style={styles.historyEmptyText}>
              Los juramentos cumplidos aparecerán aquí.
            </Text>
          </View>
        ) : (
          recentCompleted.map((record, index) => (
            <View
              key={record.id}
              style={[styles.historyRow, index > 0 && styles.historyRowBorder]}
            >
              <MaterialCommunityIcons
                color={record.cursed ? colors.crimsonLight : colors.success}
                name={record.cursed ? 'fire-circle' : 'check-circle-outline'}
                size={20}
              />
              <View style={styles.historyCopy}>
                <Text numberOfLines={1} style={styles.historyTitle}>
                  {record.taskTitle}
                </Text>
                <Text style={styles.historyDate}>
                  {new Intl.DateTimeFormat('es', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(record.completedAt))}
                </Text>
              </View>
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
  suffix?: string;
  value: number;
};

function StatCard({ icon, label, suffix = '', value }: StatCardProps) {
  return (
    <OrnatePanel style={styles.statCard}>
      <MaterialCommunityIcons color={colors.bronze} name={icon} size={21} />
      <Text style={styles.statValue}>{value}{suffix}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </OrnatePanel>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 22 },
  kicker: { color: colors.bronzeLight, fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 9, textAlign: 'center' },
  progressPanel: { padding: 18 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.25 },
  progressValue: { color: colors.ivory, fontFamily: titleFont, fontSize: 35, fontWeight: '700', marginTop: 2 },
  progressSeal: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: '#100B09', elevation: 3 },
  progressTrack: { height: 8, overflow: 'hidden', marginTop: 15, borderRadius: 4, backgroundColor: '#070504' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.crimsonLight },
  progressCaption: { color: colors.muted, fontFamily: serifFont, fontSize: 13, lineHeight: 19, marginTop: 11 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  statCard: { width: '31.7%', minHeight: 96, alignItems: 'center', justifyContent: 'center', padding: 7 },
  statValue: { color: colors.ivory, fontFamily: titleFont, fontSize: 22, fontWeight: '700', marginVertical: 2 },
  statLabel: { color: colors.muted, fontSize: 7, fontWeight: '700', letterSpacing: 0.7, textAlign: 'center' },
  sectionTitle: { color: colors.ivory, fontFamily: titleFont, fontSize: 18, fontWeight: '600', marginTop: 17, marginBottom: 8 },
  activityPanel: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 10 },
  activityChart: { height: 132, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  activityColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  activityCount: { color: colors.muted, fontSize: 8, marginBottom: 3 },
  activityTrack: { width: 18, height: 88, overflow: 'hidden', justifyContent: 'flex-end', borderRadius: 4, backgroundColor: '#090605' },
  activityFill: { width: '100%', borderRadius: 4, backgroundColor: colors.crimsonLight },
  activityDay: { color: colors.bronzeLight, fontSize: 9, fontWeight: '800', marginTop: 5 },
  historyPanel: { minHeight: 104, paddingHorizontal: 14, paddingVertical: 8 },
  historyEmpty: { minHeight: 86, alignItems: 'center', justifyContent: 'center' },
  historyEmptyText: { color: colors.muted, fontFamily: serifFont, fontSize: 13, marginTop: 7, textAlign: 'center' },
  historyRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.bronzeDark },
  historyCopy: { flex: 1 },
  historyTitle: { color: colors.ivory, fontFamily: serifFont, fontSize: 13 },
  historyDate: { color: colors.muted, fontSize: 9, marginTop: 3, textTransform: 'capitalize' },
});
