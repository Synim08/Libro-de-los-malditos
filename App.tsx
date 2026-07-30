import { Cinzel_400Regular } from '@expo-google-fonts/cinzel/400Regular';
import { Cinzel_500Medium } from '@expo-google-fonts/cinzel/500Medium';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel/700Bold';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { exportBackup, pickBackup } from './src/backup';
import { AppHeader } from './src/components/AppHeader';
import { BottomNavigation } from './src/components/BottomNavigation';
import {
  cancelAllTaskNotifications,
  cancelTaskNotification,
  prepareNotifications,
  replaceTaskNotification,
  scheduleTaskNotification,
} from './src/notifications';
import { CodexScreen } from './src/screens/CodexScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { TaskListScreen } from './src/screens/TaskListScreen';
import { loadAppData, saveAppData } from './src/storage';
import { advanceRecurringDate } from './src/taskUtils';
import { colors, serifFont } from './src/theme';
import {
  AppData,
  CompletionRecord,
  TabKey,
  Task,
  TaskDraft,
} from './src/types';

const grimoireBackground = require('./assets/grimorio-background.png');

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

type PendingDeletion = {
  task: Task;
  index: number;
};

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('oaths');
  const [hydrated, setHydrated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completionHistory, setCompletionHistory] = useState<CompletionRecord[]>([]);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const deletionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    Cinzel_400Regular,
    Cinzel_500Medium,
    Cinzel_700Bold,
  });
  const { top } = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const compact = height < 730 || width < 370;

  useEffect(() => {
    let mounted = true;

    loadAppData().then((storedData) => {
      if (mounted) {
        setTasks(storedData.tasks);
        setCompletionHistory(storedData.completionHistory);
        setHydrated(true);
      }
    });
    prepareNotifications().catch(() => undefined);

    return () => {
      mounted = false;
      if (deletionTimer.current) {
        clearTimeout(deletionTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveAppData({ version: 2, tasks, completionHistory }).catch(() => {
      // La aplicación continúa funcionando aunque el dispositivo rechace
      // temporalmente una escritura local.
    });
  }, [completionHistory, hydrated, tasks]);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );
  const cursedTasks = useMemo(
    () => tasks.filter((task) => task.cursed),
    [tasks],
  );

  const createBaseTask = (draft: TaskDraft): Task => ({
    id: makeId(),
    title: draft.title,
    notes: draft.notes,
    completed: false,
    cursed: draft.cursed,
    createdAt: Date.now(),
    dueAt: draft.dueAt,
    reminderEnabled: draft.reminderEnabled,
    recurrence: draft.recurrence,
  });

  const addTask = (title: string, cursed: boolean) => {
    const task = createBaseTask({
      title,
      notes: '',
      cursed,
      reminderEnabled: false,
      recurrence: 'none',
    });
    setTasks((currentTasks) => [task, ...currentTasks]);
  };

  const addDetailedTask = async (draft: TaskDraft) => {
    const task = createBaseTask(draft);
    const notificationId = await scheduleTaskNotification(task);
    setTasks((currentTasks) => [{ ...task, notificationId }, ...currentTasks]);
  };

  const editTask = async (id: string, draft: TaskDraft) => {
    const previous = tasks.find((task) => task.id === id);

    if (!previous) {
      throw new Error('El juramento ya no existe.');
    }

    const next: Task = {
      ...previous,
      ...draft,
      notificationId: undefined,
    };
    const notificationId = await replaceTaskNotification(previous, next);

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...next, notificationId } : task,
      ),
    );
  };

  const addCompletion = (task: Task, completedAt: number) => {
    const record: CompletionRecord = {
      id: makeId(),
      taskId: task.id,
      taskTitle: task.title,
      cursed: task.cursed,
      completedAt,
    };
    setCompletionHistory((history) => [record, ...history]);
  };

  const removeLatestCompletion = (taskId: string) => {
    setCompletionHistory((history) => {
      let latestIndex = -1;
      let latestTime = -1;

      history.forEach((record, index) => {
        if (record.taskId === taskId && record.completedAt > latestTime) {
          latestIndex = index;
          latestTime = record.completedAt;
        }
      });

      return latestIndex < 0
        ? history
        : history.filter((_, index) => index !== latestIndex);
    });
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((candidate) => candidate.id === id);

    if (!task) {
      return;
    }

    if (!task.completed) {
      const completedAt = Date.now();
      addCompletion(task, completedAt);
      await cancelTaskNotification(task);

      if (task.recurrence !== 'none') {
        const nextTask: Task = {
          ...task,
          completed: false,
          completedAt: undefined,
          dueAt: advanceRecurringDate(task.dueAt, task.recurrence),
          notificationId: undefined,
        };

        try {
          nextTask.notificationId = await scheduleTaskNotification(nextTask);
        } catch {
          nextTask.reminderEnabled = false;
          Alert.alert(
            'Ritual renovado',
            'Se creó la siguiente fecha, pero Android no permitió programar el aviso.',
          );
        }

        setTasks((currentTasks) =>
          currentTasks.map((candidate) =>
            candidate.id === id ? nextTask : candidate,
          ),
        );
        return;
      }

      setTasks((currentTasks) =>
        currentTasks.map((candidate) =>
          candidate.id === id
            ? {
                ...candidate,
                completed: true,
                completedAt,
                notificationId: undefined,
              }
            : candidate,
        ),
      );
      return;
    }

    const reopened: Task = {
      ...task,
      completed: false,
      completedAt: undefined,
      notificationId: undefined,
    };
    removeLatestCompletion(id);

    try {
      reopened.notificationId = await scheduleTaskNotification(reopened);
    } catch {
      reopened.reminderEnabled = false;
    }

    setTasks((currentTasks) =>
      currentTasks.map((candidate) => (candidate.id === id ? reopened : candidate)),
    );
  };

  const toggleCursed = (id: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, cursed: !task.cursed } : task,
      ),
    );
  };

  const deleteTask = (id: string) => {
    const index = tasks.findIndex((task) => task.id === id);

    if (index < 0) {
      return;
    }

    if (deletionTimer.current) {
      clearTimeout(deletionTimer.current);
    }

    const task = tasks[index];
    cancelTaskNotification(task).catch(() => undefined);
    setTasks((currentTasks) => currentTasks.filter((candidate) => candidate.id !== id));
    setPendingDeletion({ task, index });
    deletionTimer.current = setTimeout(() => {
      setPendingDeletion(null);
      deletionTimer.current = null;
    }, 6000);
  };

  const undoDelete = async () => {
    if (!pendingDeletion) {
      return;
    }

    if (deletionTimer.current) {
      clearTimeout(deletionTimer.current);
      deletionTimer.current = null;
    }

    const restored: Task = { ...pendingDeletion.task, notificationId: undefined };
    try {
      restored.notificationId = await scheduleTaskNotification(restored);
    } catch {
      restored.reminderEnabled = false;
    }

    setTasks((currentTasks) => {
      const next = [...currentTasks];
      next.splice(Math.min(pendingDeletion.index, next.length), 0, restored);
      return next;
    });
    setPendingDeletion(null);
  };

  const clearCompleted = () => {
    setTasks((currentTasks) => currentTasks.filter((task) => !task.completed));
  };

  const clearAll = async () => {
    await cancelAllTaskNotifications();
    setTasks([]);
    setCompletionHistory([]);
    setPendingDeletion(null);
  };

  const handleExport = () =>
    exportBackup({ version: 2, tasks, completionHistory });

  const handleImport = async () => {
    const imported = await pickBackup();

    if (!imported) {
      return null;
    }

    await cancelAllTaskNotifications();
    const restoredTasks: Task[] = [];

    for (const task of imported.tasks) {
      const restored: Task = { ...task, notificationId: undefined };
      try {
        restored.notificationId = await scheduleTaskNotification(restored);
      } catch {
        restored.reminderEnabled = false;
      }
      restoredTasks.push(restored);
    }

    setTasks(restoredTasks);
    setCompletionHistory(imported.completionHistory);
    return restoredTasks.length;
  };

  const renderTaskList = (list: Task[], cursedMode = false) => (
    <TaskListScreen
      cursedMode={cursedMode}
      onAdd={addTask}
      onAddDetailed={addDetailedTask}
      onDelete={deleteTask}
      onEdit={editTask}
      onToggle={toggleTask}
      onToggleCursed={toggleCursed}
      tasks={list}
    />
  );

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'curses':
        return renderTaskList(cursedTasks, true);
      case 'codex':
        return <CodexScreen completionHistory={completionHistory} tasks={tasks} />;
      case 'more':
        return (
          <MoreScreen
            completedCount={completedCount}
            historyCount={completionHistory.length}
            onClearAll={clearAll}
            onClearCompleted={clearCompleted}
            onExport={handleExport}
            onImport={handleImport}
            totalCount={tasks.length}
          />
        );
      case 'oaths':
      default:
        return renderTaskList(tasks);
    }
  };

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.fontLoadingState}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.bronzeLight} size="large" />
      </View>
    );
  }

  return (
    <ImageBackground
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
      source={grimoireBackground}
      style={styles.background}
    >
      <LinearGradient
        colors={['rgba(5,3,2,0.08)', 'rgba(5,3,2,0.34)', 'rgba(5,3,2,0.76)']}
        locations={[0, 0.55, 1]}
        style={styles.backgroundShade}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <StatusBar style="light" />

          <View
            style={[
              styles.appShell,
              { paddingTop: top + (compact ? 8 : 12) },
            ]}
          >
            <View style={styles.contentColumn}>
              <AppHeader
                compact={compact}
                completedCount={completedCount}
                totalCount={tasks.length}
              />

              <View style={styles.screenContent}>
                {hydrated ? (
                  renderActiveScreen()
                ) : (
                  <View style={styles.loadingState}>
                    <ActivityIndicator color={colors.bronzeLight} size="large" />
                    <Text style={styles.loadingText}>Abriendo el códice…</Text>
                  </View>
                )}
              </View>
            </View>

            {pendingDeletion && (
              <View style={styles.undoBanner}>
                <Text numberOfLines={1} style={styles.undoText}>
                  Página enviada a las cenizas
                </Text>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={undoDelete}>
                  <Text style={styles.undoAction}>DESHACER</Text>
                </Pressable>
              </View>
            )}

            <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.ink },
  backgroundImage: { width: '100%', height: '100%', opacity: 0.98 },
  backgroundShade: { flex: 1 },
  keyboardView: { flex: 1 },
  appShell: { flex: 1 },
  contentColumn: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 19 },
  screenContent: { flex: 1 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  loadingText: { color: colors.muted, fontFamily: serifFont, fontSize: 15, marginTop: 14 },
  fontLoadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  undoBanner: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: colors.bronzeDark, backgroundColor: '#21140F' },
  undoText: { flex: 1, color: colors.ivory, fontFamily: serifFont, fontSize: 12 },
  undoAction: { color: colors.bronzeLight, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
});
