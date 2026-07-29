import { Cinzel_400Regular } from '@expo-google-fonts/cinzel/400Regular';
import { Cinzel_500Medium } from '@expo-google-fonts/cinzel/500Medium';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel/700Bold';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { AppHeader } from './src/components/AppHeader';
import { BottomNavigation } from './src/components/BottomNavigation';
import { CodexScreen } from './src/screens/CodexScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { TaskListScreen } from './src/screens/TaskListScreen';
import { loadTasks, saveTasks } from './src/storage';
import { colors, serifFont } from './src/theme';
import { TabKey, Task } from './src/types';

const grimoireBackground = require('./assets/grimorio-background.png');

const makeTaskId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

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
  const [fontsLoaded, fontError] = useFonts({
    Cinzel_400Regular,
    Cinzel_500Medium,
    Cinzel_700Bold,
  });
  const { height, width } = useWindowDimensions();
  const compact = height < 730 || width < 370;

  useEffect(() => {
    let mounted = true;

    loadTasks().then((storedTasks) => {
      if (mounted) {
        setTasks(storedTasks);
        setHydrated(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveTasks(tasks).catch(() => {
      // La aplicación continúa funcionando aunque el dispositivo rechace
      // temporalmente una escritura local.
    });
  }, [hydrated, tasks]);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );
  const cursedTasks = useMemo(
    () => tasks.filter((task) => task.cursed),
    [tasks],
  );

  const addTask = (title: string, cursed: boolean) => {
    setTasks((currentTasks) => [
      {
        id: makeTaskId(),
        title,
        completed: false,
        cursed,
        createdAt: Date.now(),
      },
      ...currentTasks,
    ]);
  };

  const toggleTask = (id: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== id) {
          return task;
        }

        const completed = !task.completed;

        return {
          ...task,
          completed,
          completedAt: completed ? Date.now() : undefined,
        };
      }),
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
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id),
    );
  };

  const clearCompleted = () => {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => !task.completed),
    );
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'curses':
        return (
          <TaskListScreen
            cursedMode
            onAdd={addTask}
            onDelete={deleteTask}
            onToggle={toggleTask}
            onToggleCursed={toggleCursed}
            tasks={cursedTasks}
          />
        );
      case 'codex':
        return <CodexScreen tasks={tasks} />;
      case 'more':
        return (
          <MoreScreen
            completedCount={completedCount}
            onClearAll={() => setTasks([])}
            onClearCompleted={clearCompleted}
            totalCount={tasks.length}
          />
        );
      case 'oaths':
      default:
        return (
          <TaskListScreen
            onAdd={addTask}
            onDelete={deleteTask}
            onToggle={toggleTask}
            onToggleCursed={toggleCursed}
            tasks={tasks}
          />
        );
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
              { paddingTop: Platform.OS === 'android' ? 43 : 56 },
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

            <BottomNavigation
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.98,
  },
  backgroundShade: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  appShell: {
    flex: 1,
  },
  contentColumn: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 19,
  },
  screenContent: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    color: colors.muted,
    fontFamily: serifFont,
    fontSize: 15,
    marginTop: 14,
  },
  fontLoadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
});
