import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Task } from './types';

const CHANNEL_ID = 'juramentos';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationPermissionError extends Error {}

export async function prepareNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios de juramentos',
      description: 'Avisos de fechas límite del Libro de los Malditos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 220, 120, 220],
      lightColor: '#B14D3C',
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
      'Android no concedió permiso para mostrar recordatorios.',
    );
  }
};

export async function cancelTaskNotification(task?: Task) {
  if (!task?.notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(task.notificationId).catch(
    () => undefined,
  );
}

export async function scheduleTaskNotification(task: Task) {
  if (
    !task.reminderEnabled ||
    task.completed ||
    !task.dueAt ||
    task.dueAt <= Date.now()
  ) {
    return undefined;
  }

  await prepareNotifications();
  await ensureNotificationPermission();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: task.cursed ? 'Una maldición reclama tu atención' : 'Un juramento te espera',
      body: task.title,
      data: { taskId: task.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(task.dueAt),
      channelId: CHANNEL_ID,
    },
  });
}

export async function replaceTaskNotification(previous: Task | undefined, next: Task) {
  const notificationId = await scheduleTaskNotification(next);
  await cancelTaskNotification(previous);
  return notificationId;
}

export async function cancelAllTaskNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
}
