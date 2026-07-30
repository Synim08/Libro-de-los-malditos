import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { normalizeAppData } from './storage';
import { AppData } from './types';

type BackupEnvelope = {
  app: 'Libro de los Malditos';
  exportedAt: number;
  data: AppData;
};

export async function exportBackup(data: AppData) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Este dispositivo no permite compartir archivos.');
  }

  const date = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `libro-de-los-malditos-${date}.json`);
  file.create({ overwrite: true });
  const envelope: BackupEnvelope = {
    app: 'Libro de los Malditos',
    exportedAt: Date.now(),
    data,
  };
  file.write(JSON.stringify(envelope, null, 2));

  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Guardar copia del grimorio',
    mimeType: 'application/json',
  });
}

export async function pickBackup(): Promise<AppData | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) {
    return null;
  }

  const file = new File(result.assets[0].uri);
  const parsed: unknown = JSON.parse(await file.text());
  const candidate =
    parsed && typeof parsed === 'object' && 'data' in parsed
      ? (parsed as { data: unknown }).data
      : parsed;
  const normalized = normalizeAppData(candidate);

  if (!normalized) {
    throw new Error('El archivo no contiene una copia válida del grimorio.');
  }

  return {
    ...normalized,
    tasks: normalized.tasks.map((task) => ({
      ...task,
      notificationId: undefined,
    })),
  };
}
