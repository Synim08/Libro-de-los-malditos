import { Recurrence, Task } from './types';

const MINUTE_MS = 60_000;

export const weekdayNames = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

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

const validWeekday = (value: number | undefined, fallback: number) =>
  Number.isInteger(value) && value !== undefined && value >= 0 && value <= 6
    ? value
    : fallback;

const validDayOfMonth = (value: number | undefined, fallback: number) =>
  Number.isInteger(value) && value !== undefined && value >= 1 && value <= 31
    ? value
    : fallback;

const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

export const nextOccurrenceForSchedule = (
  recurrence: Recurrence,
  timeAt: number | undefined,
  recurrenceWeekday?: number,
  recurrenceDayOfMonth?: number,
  after = Date.now(),
) => {
  if (recurrence === 'none') {
    return timeAt;
  }

  const time = new Date(timeAt ?? after);
  const hour = time.getHours();
  const minute = time.getMinutes();
  const next = new Date(after);
  next.setSeconds(0, 0);

  if (recurrence === 'daily') {
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= after) {
      next.setDate(next.getDate() + 1);
    }
    return next.getTime();
  }

  if (recurrence === 'weekly') {
    const weekday = validWeekday(recurrenceWeekday, time.getDay());
    next.setHours(hour, minute, 0, 0);
    next.setDate(next.getDate() + ((weekday - next.getDay() + 7) % 7));
    if (next.getTime() <= after) {
      next.setDate(next.getDate() + 7);
    }
    return next.getTime();
  }

  const dayOfMonth = validDayOfMonth(
    recurrenceDayOfMonth,
    time.getDate(),
  );
  next.setDate(1);
  next.setHours(hour, minute, 0, 0);
  next.setDate(
    Math.min(dayOfMonth, daysInMonth(next.getFullYear(), next.getMonth())),
  );

  if (next.getTime() <= after) {
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    next.setDate(
      Math.min(dayOfMonth, daysInMonth(next.getFullYear(), next.getMonth())),
    );
  }

  return next.getTime();
};

export const advanceRecurringDate = (task: Task) => {
  const cutoff = Math.max(
    task.dueAt ?? 0,
    Date.now() + task.reminderLeadMinutes * MINUTE_MS,
  );

  return nextOccurrenceForSchedule(
    task.recurrence,
    task.dueAt,
    task.recurrenceWeekday,
    task.recurrenceDayOfMonth,
    cutoff,
  );
};

export const reminderLeadLabel = (minutes: number) => {
  if (minutes <= 0) {
    return 'A la hora';
  }
  if (minutes < 60) {
    return `${minutes} min antes`;
  }
  if (minutes < 1_440) {
    const hours = minutes / 60;
    return `${hours} h antes`;
  }
  const days = minutes / 1_440;
  return `${days} ${days === 1 ? 'día' : 'días'} antes`;
};

export const recurrenceScheduleLabel = (task: Task) => {
  if (task.recurrence === 'weekly') {
    const weekday = validWeekday(
      task.recurrenceWeekday,
      new Date(task.dueAt ?? Date.now()).getDay(),
    );
    return `Cada ${weekdayNames[weekday].toLocaleLowerCase('es')}`;
  }
  if (task.recurrence === 'monthly') {
    const day = validDayOfMonth(
      task.recurrenceDayOfMonth,
      new Date(task.dueAt ?? Date.now()).getDate(),
    );
    return `Cada mes · día ${day}`;
  }
  return recurrenceLabel(task.recurrence);
};

export const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
