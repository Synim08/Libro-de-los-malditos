import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { TaskComposer } from '../components/TaskComposer';
import { TaskCard } from '../components/TaskCard';
import { colors, serifFont, titleFont } from '../theme';
import { Task } from '../types';

type TaskListScreenProps = {
  cursedMode?: boolean;
  onAdd: (title: string, cursed: boolean) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onToggleCursed: (id: string) => void;
  tasks: Task[];
};

export function TaskListScreen({
  cursedMode = false,
  onAdd,
  onDelete,
  onToggle,
  onToggleCursed,
  tasks,
}: TaskListScreenProps) {
  return (
    <View style={styles.container}>
      <TaskComposer defaultCursed={cursedMode} onAdd={onAdd} />

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionLabel}>
          {cursedMode ? 'MALDICIONES MARCADAS' : 'PÁGINAS DEL JURAMENTO'}
        </Text>
        <Text style={styles.sectionCount}>{tasks.length}</Text>
      </View>

      <FlatList
        contentContainerStyle={[
          styles.listContent,
          tasks.length === 0 && styles.listContentEmpty,
        ]}
        data={tasks}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptySeal}>
              <MaterialCommunityIcons
                color={colors.crimsonLight}
                name={cursedMode ? 'sword-cross' : 'book-open-blank-variant'}
                size={37}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {cursedMode ? 'No hay maldiciones' : 'Aún no hay tareas'}
            </Text>
            <Text style={styles.emptyCopy}>
              {cursedMode
                ? 'Marca la llama de un juramento o consigna aquí una misión de alta prioridad.'
                : 'Ningún juramento ha sido registrado. Escribe el primero para comenzar tu travesía.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          tasks.length > 0 ? (
            <Text style={styles.footerHint}>
              Toca el sello para cumplir. La llama marca una maldición.
            </Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <TaskCard
            index={index}
            onDelete={onDelete}
            onToggle={onToggle}
            onToggleCursed={onToggleCursed}
            task={item}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionLabel: {
    color: colors.bronzeLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sectionCount: {
    minWidth: 24,
    color: colors.muted,
    fontFamily: serifFont,
    fontSize: 13,
    textAlign: 'right',
  },
  listContent: {
    paddingBottom: 18,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  emptySeal: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderRadius: 38,
    backgroundColor: 'rgba(13, 9, 7, 0.88)',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  emptyTitle: {
    color: colors.ivory,
    fontFamily: titleFont,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCopy: {
    maxWidth: 310,
    color: colors.muted,
    fontFamily: serifFont,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  footerHint: {
    color: '#796650',
    fontSize: 11,
    letterSpacing: 0.25,
    paddingTop: 16,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
});
