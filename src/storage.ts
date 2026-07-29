import AsyncStorage from '@react-native-async-storage/async-storage';

import { Task } from './types';

const TASKS_STORAGE_KEY = '@libro_de_los_malditos/tasks/v1';

const isStoredTask = (value: unknown): value is Task => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Task>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.completed === 'boolean' &&
    typeof candidate.cursed === 'boolean' &&
    typeof candidate.createdAt === 'number'
  );
};

export async function loadTasks(): Promise<Task[]> {
  try {
    const storedValue = await AsyncStorage.getItem(TASKS_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? parsedValue.filter(isStoredTask) : [];
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}
