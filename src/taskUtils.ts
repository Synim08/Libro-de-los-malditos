import { Recurrence, Task } from './types';

export const startOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const isToday = (timestamp?: number) =>
  typeof timestamp === 'number' && startOfDay(timestamp) === startOfDay(Date.now());

export const isOverdue = (task: Task) =>
  !task.completed && typeof task.dueAt === 'number' && task.dueAt < Date.now();

export const formatTaskDate = (timestamp: number) =>
  new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));

export const formatDateOnly = (timestamp: number) =>
  new Intl.DateTimeFormat('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));

export const formatTimeOnly = (timestamp: number) =>
  new Intl.DateTimeFormat('es', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));

export const recurrenceLabel = (recurrence: Recurrence) => {
  switch (recurrence) {
    case 'daily':
      return 'Diario';
    case 'weekly':
      return 'Semanal';
    case 'monthly':
      return 'Mensual';
    default:
      return 'No repetir';
  }
};

export const advanceRecurringDate = (
  dueAt: number | undefined,
  recurrence: Recurrence,
) => {
  if (recurrence === 'none') {
    return dueAt;
  }

  const next = new Date(dueAt ?? Date.now());
  const preferredDay = next.getDate();

  do {
    if (recurrence === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (recurrence === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      const lastDayOfMonth = new Date(
        next.getFullYear(),
        next.getMonth() + 1,
        0,
      ).getDate();
      next.setDate(Math.min(preferredDay, lastDayOfMonth));
    }
  } while (next.getTime() <= Date.now());

  return next.getTime();
};

export const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
