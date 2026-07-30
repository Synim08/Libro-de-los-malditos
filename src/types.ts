export type TabKey = 'oaths' | 'curses' | 'codex' | 'more';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export type Task = {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  cursed: boolean;
  createdAt: number;
  completedAt?: number;
  dueAt?: number;
  reminderEnabled: boolean;
  notificationId?: string;
  recurrence: Recurrence;
};

export type TaskDraft = {
  title: string;
  notes: string;
  cursed: boolean;
  dueAt?: number;
  reminderEnabled: boolean;
  recurrence: Recurrence;
};

export type CompletionRecord = {
  id: string;
  taskId: string;
  taskTitle: string;
  cursed: boolean;
  completedAt: number;
};

export type AppData = {
  version: 2;
  tasks: Task[];
  completionHistory: CompletionRecord[];
};

export type TaskFilter = 'all' | 'pending' | 'today' | 'overdue' | 'completed';
export type TaskSort = 'recent' | 'oldest' | 'due';
