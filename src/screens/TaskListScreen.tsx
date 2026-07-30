import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TaskComposer } from '../components/TaskComposer';
import { TaskCard } from '../components/TaskCard';
import { TaskEditorModal } from '../components/TaskEditorModal';
import {
  isOverdue,
  isToday,
  normalizeSearchText,
} from '../taskUtils';
import { colors, serifFont, titleFont } from '../theme';
import { Task, TaskDraft, TaskFilter, TaskSort } from '../types';

const filters: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'today', label: 'Hoy' },
  { key: 'overdue', label: 'Vencidos' },
  { key: 'completed', label: 'Cumplidos' },
];

const sortLabels: Record<TaskSort, string> = {
  recent: 'Recientes',
  oldest: 'Antiguos',
  due: 'Por fecha',
};

const nextSort: Record<TaskSort, TaskSort> = {
  recent: 'due',
  due: 'oldest',
  oldest: 'recent',
};

type EditorState = {
  task?: Task;
  initialTitle: string;
  defaultCursed: boolean;
};

type TaskListScreenProps = {
  cursedMode?: boolean;
  onAdd: (title: string, cursed: boolean) => void;
  onAddDetailed: (draft: TaskDraft) => Promise<void>;
  onDelete: (id: string) => void;
  onEdit: (id: string, draft: TaskDraft) => Promise<void>;
  onToggle: (id: string) => void;
  onToggleCursed: (id: string) => void;
  tasks: Task[];
};

export function TaskListScreen({
  cursedMode = false,
  onAdd,
  onAddDetailed,
  onDelete,
  onEdit,
  onToggle,
  onToggleCursed,
  tasks,
}: TaskListScreenProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sort, setSort] = useState<TaskSort>('recent');
  const [editor, setEditor] = useState<EditorState | null>(null);

  const visibleTasks = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());
    const filtered = tasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        normalizeSearchText(`${task.title} ${task.notes}`).includes(normalizedQuery);

      if (!matchesQuery) {
        return false;
      }

      switch (filter) {
        case 'pending':
          return !task.completed;
        case 'today':
          return !task.completed && isToday(task.dueAt);
        case 'overdue':
          return isOverdue(task);
        case 'completed':
          return task.completed;
        default:
          return true;
      }
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'oldest') {
        return a.createdAt - b.createdAt;
      }
      if (sort === 'due') {
        return (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER);
      }
      return b.createdAt - a.createdAt;
    });
  }, [filter, query, sort, tasks]);

  const openDetailedAdd = (initialTitle: string, defaultCursed: boolean) => {
    setEditor({ initialTitle, defaultCursed });
  };

  const openEdit = (task: Task) => {
    setEditor({ task, initialTitle: task.title, defaultCursed: task.cursed });
  };

  const saveEditor = async (draft: TaskDraft) => {
    if (editor?.task) {
      await onEdit(editor.task.id, draft);
    } else {
      await onAddDetailed(draft);
    }
  };

  const hasActiveSearch = Boolean(query.trim()) || filter !== 'all';

  return (
    <View style={styles.container}>
      <TaskComposer
        defaultCursed={cursedMode}
        onAdd={onAdd}
        onOpenDetails={openDetailedAdd}
      />

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons color={colors.muted} name="magnify" size={20} />
          <TextInput
            accessibilityLabel="Buscar juramentos"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Buscar en el grimorio…"
            placeholderTextColor="#75634F"
            returnKeyType="search"
            selectionColor={colors.crimsonLight}
            style={styles.searchInput}
            value={query}
          />
          {query.length > 0 && (
            <Pressable accessibilityLabel="Limpiar búsqueda" hitSlop={8} onPress={() => setQuery('')}>
              <MaterialCommunityIcons color={colors.muted} name="close-circle" size={19} />
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityLabel={`Orden actual: ${sortLabels[sort]}`}
          onPress={() => setSort(nextSort[sort])}
          style={styles.sortButton}
        >
          <MaterialCommunityIcons color={colors.bronzeLight} name="sort" size={21} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.filters}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((item) => {
          const selected = item.key === filter;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={item.key}
              onPress={() => setFilter(item.key)}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionLabel}>
          {cursedMode ? 'MALDICIONES MARCADAS' : 'PÁGINAS DEL JURAMENTO'}
        </Text>
        <Text style={styles.sectionCount}>
          {visibleTasks.length}{visibleTasks.length !== tasks.length ? ` / ${tasks.length}` : ''}
        </Text>
      </View>

      <FlatList
        contentContainerStyle={[
          styles.listContent,
          visibleTasks.length === 0 && styles.listContentEmpty,
        ]}
        data={visibleTasks}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptySeal}>
              <MaterialCommunityIcons
                color={colors.crimsonLight}
                name={hasActiveSearch ? 'text-search' : cursedMode ? 'sword-cross' : 'book-open-blank-variant'}
                size={37}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {hasActiveSearch
                ? 'Ninguna página coincide'
                : cursedMode
                  ? 'No hay maldiciones'
                  : 'Aún no hay tareas'}
            </Text>
            <Text style={styles.emptyCopy}>
              {hasActiveSearch
                ? 'Prueba otra búsqueda o retira los filtros activos.'
                : cursedMode
                  ? 'Marca la llama de un juramento o consigna aquí una misión de alta prioridad.'
                  : 'Ningún juramento ha sido registrado. Escribe el primero para comenzar tu travesía.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          visibleTasks.length > 0 ? (
            <Text style={styles.footerHint}>
              Toca el sello para cumplir. El lápiz reescribe la página.
            </Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <TaskCard
            index={index}
            onDelete={onDelete}
            onEdit={openEdit}
            onToggle={onToggle}
            onToggleCursed={onToggleCursed}
            task={item}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      <TaskEditorModal
        defaultCursed={editor?.defaultCursed}
        initialTitle={editor?.initialTitle}
        onClose={() => setEditor(null)}
        onSave={saveEditor}
        task={editor?.task}
        visible={editor !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { flexDirection: 'row', gap: 7, marginTop: 2 },
  searchBox: { minHeight: 43, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 8, backgroundColor: 'rgba(15,10,8,0.9)' },
  searchInput: { flex: 1, minHeight: 42, color: colors.ivory, fontSize: 12 },
  sortButton: { width: 45, height: 43, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 8, backgroundColor: 'rgba(15,10,8,0.9)' },
  filters: { gap: 6, paddingVertical: 8, paddingRight: 4 },
  filterChip: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 16, backgroundColor: 'rgba(15,10,8,0.86)' },
  filterChipSelected: { borderColor: colors.parchmentDark, backgroundColor: colors.parchment },
  filterText: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  filterTextSelected: { color: '#2B1D15' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 2, paddingBottom: 8 },
  sectionLabel: { color: colors.bronzeLight, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  sectionCount: { minWidth: 24, color: colors.muted, fontFamily: serifFont, fontSize: 13, textAlign: 'right' },
  listContent: { paddingBottom: 18 },
  listContentEmpty: { flexGrow: 1 },
  separator: { height: 10 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 24 },
  emptySeal: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderRadius: 38, backgroundColor: 'rgba(13, 9, 7, 0.88)', elevation: 4, shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6 },
  emptyTitle: { color: colors.ivory, fontFamily: titleFont, fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptyCopy: { maxWidth: 310, color: colors.muted, fontFamily: serifFont, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  footerHint: { color: '#796650', fontSize: 11, letterSpacing: 0.25, paddingTop: 16, paddingHorizontal: 12, textAlign: 'center' },
});
