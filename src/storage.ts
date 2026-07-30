import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppData, CompletionRecord, Recurrence, Task } from './types';

const APP_STORAGE_KEY = '@libro_de_los_malditos/state/v2';
const LEGACY_TASKS_STORAGE_KEY = '@libro_de_los_malditos/tasks/v1';

export const emptyAppData = (): AppData => ({
  version: 2,
  tasks: [],
  completionHistory: [],
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const isRecurrence = (value: unknown): value is Recurrence =>
  value === 'none' || value === 'daily' || value === 'weekly' || value === 'monthly';

const normalizeTask = (value: unknown): Task | null => {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.completed !== 'boolean' ||
    typeof value.cursed !== 'boolean' ||
    typeof value.createdAt !== 'number'
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title.trim().slice(0, 90),
    notes: typeof value.notes === 'string' ? value.notes.slice(0, 500) : '',
    completed: value.completed,
    cursed: value.cursed,
    createdAt: value.createdAt,
    completedAt: typeof value.completedAt === 'number' ? value.completedAt : undefined,
    dueAt: typeof value.dueAt === 'number' ? value.dueAt : undefined,
    reminderEnabled: value.reminderEnabled === true,
    notificationId:
      typeof value.notificationId === 'string' ? value.notificationId : undefined,
    recurrence: isRecurrence(value.recurrence) ? value.recurrence : 'none',
  };
};

const normalizeCompletion = (value: unknown): CompletionRecord | null => {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.taskId !== 'string' ||
    typeof value.taskTitle !== 'string' ||
    typeof value.cursed !== 'boolean' ||
    typeof value.completedAt !== 'number'
  ) {
    return null;
  }

  return {
    id: value.id,
    taskId: value.taskId,
    taskTitle: value.taskTitle.slice(0, 90),
    cursed: value.cursed,
    completedAt: value.completedAt,
  };
};

const migratedHistory = (tasks: Task[]): CompletionRecord[] =>
  tasks.flatMap((task) =>
    task.completed && task.completedAt
      ? [
          {
            id: `migrated-${task.id}-${task.completedAt}`,
            taskId: task.id,
            taskTitle: task.title,
            cursed: task.cursed,
            completedAt: task.completedAt,
          },
        ]
      : [],
  );

export function normalizeAppData(value: unknown): AppData | null {
  if (!isObject(value) || !Array.isArray(value.tasks)) {
    return null;
  }

  const tasks = value.tasks
    .map(normalizeTask)
    .filter((task): task is Task => task !== null && Boolean(task.title));
  const completionHistory = Array.isArray(value.completionHistory)
    ? value.completionHistory
        .map(normalizeCompletion)
        .filter((record): record is CompletionRecord => record !== null)
    : migratedHistory(tasks);

  return { version: 2, tasks, completionHistory };
}

export async function loadAppData(): Promise<AppData> {
  try {
    const storedValue = await AsyncStorage.getItem(APP_STORAGE_KEY);

    if (storedValue) {
      return normalizeAppData(JSON.parse(storedValue)) ?? emptyAppData();
    }

    const legacyValue = await AsyncStorage.getItem(LEGACY_TASKS_STORAGE_KEY);

    if (!legacyValue) {
      return emptyAppData();
    }

    const parsedLegacy: unknown = JSON.parse(legacyValue);
    const tasks = Array.isArray(parsedLegacy)
      ? parsedLegacy
          .map(normalizeTask)
          .filter((task): task is Task => task !== null && Boolean(task.title))
      : [];

    return {
      version: 2,
      tasks,
      completionHistory: migratedHistory(tasks),
    };
  } catch {
    return emptyAppData();
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
}
