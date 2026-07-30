import * as IntentLauncher from 'expo-intent-launcher';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { nextOccurrenceForSchedule } from './taskUtils';
import { Task } from './types';

const CHANNEL_ID = 'juramentos-v2';
const ANDROID_PACKAGE = 'com.synim08.librodelosmalditos';
const TECNO_APP_SAVING_ACTION = 'com.transsion.batterylab.app_saving';
const MINUTE_MS = 60_000;
const MONTHLY_SCHEDULE_HORIZON = 24;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationPermissionError extends Error {}

export type NotificationDiagnostics = {
  channelEnabled: boolean;
  permissionGranted: boolean;
  scheduledCount: number;
};

export async function prepareNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios del grimorio',
      description: 'Avisos de juramentos y maldiciones',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 220, 120, 220],
      lightColor: '#B14D3C',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

const ensureNotificationPermission = async () => {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return;
  }

  const requested = await Notifications.requestPermissionsAsync();

  if (!requested.granted) {
    throw new NotificationPermissionError(
      'Android bloqueó las notificaciones. Abre Más > Ajustes de notificaciones y permite los avisos.',
    );
  }
};

const notificationIdentifiers = (task?: Task) => {
  if (!task) {
    return [];
  }

  return [
    ...(task.notificationIds ?? []),
    ...(task.notificationId ? [task.notificationId] : []),
  ];
};

export async function cancelTaskNotification(task?: Task) {
  await Promise.all(
    notificationIdentifiers(task).map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
    ),
  );
}

const notificationContent = (task: Task, dueAt: number) => ({
  title: task.cursed
    ? 'Una maldición reclama tu atención'
    : 'Un juramento te espera',
  body: task.title,
  data: { taskId: task.id, dueAt },
  sound: 'default' as const,
  color: '#B14D3C',
  priority: Notifications.AndroidNotificationPriority.MAX,
});

const scheduleAt = (
  task: Task,
  dueAt: number,
  trigger: Notifications.SchedulableNotificationTriggerInput,
) =>
  Notifications.scheduleNotificationAsync({
    content: notificationContent(task, dueAt),
    trigger,
  });

const nextRecurringEvent = (task: Task, after: number) =>
  nextOccurrenceForSchedule(
    task.recurrence,
    task.dueAt,
    task.recurrenceWeekday,
    task.recurrenceDayOfMonth,
    after,
  );

export async function scheduleTaskNotification(task: Task): Promise<string[]> {
  if (!task.reminderEnabled || task.completed || !task.dueAt) {
    return [];
  }

  const leadMs = task.reminderLeadMinutes * MINUTE_MS;
  const now = Date.now();

  if (task.recurrence === 'none' && task.dueAt - leadMs <= now) {
    return [];
  }

  await prepareNotifications();
  await ensureNotificationPermission();

  const identifiers: string[] = [];

  if (task.recurrence === 'none') {
    identifiers.push(
      await scheduleAt(task, task.dueAt, {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(task.dueAt - leadMs),
        channelId: CHANNEL_ID,
      }),
    );
  } else {
    const firstEventAt = nextRecurringEvent(task, now + leadMs);

    if (!firstEventAt) {
      return [];
    }

    if (task.recurrence === 'daily') {
      const reminderAt = new Date(firstEventAt - leadMs);
      identifiers.push(
        await scheduleAt(task, firstEventAt, {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: reminderAt.getHours(),
          minute: reminderAt.getMinutes(),
          channelId: CHANNEL_ID,
        }),
      );
    } else if (task.recurrence === 'weekly') {
      const reminderAt = new Date(firstEventAt - leadMs);
      identifiers.push(
        await scheduleAt(task, firstEventAt, {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: reminderAt.getDay() + 1,
          hour: reminderAt.getHours(),
          minute: reminderAt.getMinutes(),
          channelId: CHANNEL_ID,
        }),
      );
    } else {
      let eventAt = firstEventAt;

      for (let index = 0; index < MONTHLY_SCHEDULE_HORIZON; index += 1) {
        identifiers.push(
          await scheduleAt(task, eventAt, {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(eventAt - leadMs),
            channelId: CHANNEL_ID,
          }),
        );

        const followingEvent = nextRecurringEvent(task, eventAt);
        if (!followingEvent) {
          break;
        }
        eventAt = followingEvent;
      }
    }
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledIds = new Set(scheduled.map(({ identifier }) => identifier));

  if (identifiers.some((identifier) => !scheduledIds.has(identifier))) {
    throw new Error('Android no confirmó la programación del recordatorio.');
  }

  return identifiers;
}

export async function replaceTaskNotification(previous: Task | undefined, next: Task) {
  const notificationIds = await scheduleTaskNotification(next);
  await cancelTaskNotification(previous);
  return notificationIds;
}

export async function synchronizeTaskNotifications(tasks: Task[]) {
  const hasActiveReminders = tasks.some(
    (task) => task.reminderEnabled && !task.completed && task.dueAt,
  );

  await prepareNotifications();
  if (hasActiveReminders) {
    await ensureNotificationPermission();
  }
  await Notifications.cancelAllScheduledNotificationsAsync();

  const synchronized: Task[] = [];
  for (const task of tasks) {
    const notificationIds = await scheduleTaskNotification(task);
    synchronized.push({
      ...task,
      notificationId: undefined,
      notificationIds,
    });
  }

  return synchronized;
}

export async function scheduleTestNotification() {
  await prepareNotifications();
  await ensureNotificationPermission();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'La campana responde',
      body: 'Las notificaciones del Libro de los Malditos funcionan correctamente.',
      sound: 'default',
      color: '#B14D3C',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      channelId: CHANNEL_ID,
    },
  });
}

export async function getNotificationDiagnostics(): Promise<NotificationDiagnostics> {
  await prepareNotifications();
  const [permission, scheduled, channel] = await Promise.all([
    Notifications.getPermissionsAsync(),
    Notifications.getAllScheduledNotificationsAsync(),
    Platform.OS === 'android'
      ? Notifications.getNotificationChannelAsync(CHANNEL_ID)
      : Promise.resolve(null),
  ]);

  return {
    permissionGranted: permission.granted,
    scheduledCount: scheduled.length,
    channelEnabled:
      channel === null ||
      channel === undefined ||
      channel.importance !== Notifications.AndroidImportance.NONE,
  };
}

export async function openNotificationSettings() {
  if (Platform.OS !== 'android') {
    return;
  }

  await IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS,
    {
      extra: { 'android.provider.extra.APP_PACKAGE': ANDROID_PACKAGE },
    },
  );
}

export async function openBatteryOptimizationSettings() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    // HiOS applies an additional per-app background policy on top of Android's
    // standard battery-optimization exemption.
    await IntentLauncher.startActivityAsync(TECNO_APP_SAVING_ACTION);
  } catch {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS,
      );
    } catch {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: `package:${ANDROID_PACKAGE}` },
      );
    }
  }
}

export async function cancelAllTaskNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
}
