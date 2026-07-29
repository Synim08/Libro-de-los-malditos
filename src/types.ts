export type TabKey = 'oaths' | 'curses' | 'codex' | 'more';

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  cursed: boolean;
  createdAt: number;
  completedAt?: number;
};
