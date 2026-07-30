import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { OrnatePanel } from '../components/OrnatePanel';
import { colors, serifFont, titleFont } from '../theme';

type MoreScreenProps = {
  completedCount: number;
  historyCount: number;
  onClearAll: () => void;
  onClearCompleted: () => void;
  onExport: () => Promise<void>;
  onImport: () => Promise<number | null>;
  totalCount: number;
};

export function MoreScreen({
  completedCount,
  historyCount,
  onClearAll,
  onClearCompleted,
  onExport,
  onImport,
  totalCount,
}: MoreScreenProps) {
  const [busyAction, setBusyAction] = useState<'export' | 'import' | null>(null);

  const confirmClearCompleted = () => {
    Alert.alert('Romper los sellos', 'Se eliminarán todos los juramentos cumplidos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onClearCompleted },
    ]);
  };

  const confirmClearAll = () => {
    Alert.alert(
      'Quemar el códice',
      'Esta acción eliminará juramentos, historial y recordatorios. No puede deshacerse.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Quemar todo', style: 'destructive', onPress: onClearAll },
      ],
    );
  };

  const runExport = async () => {
    setBusyAction('export');
    try {
      await onExport();
    } catch (error) {
      Alert.alert(
        'No se pudo exportar',
        error instanceof Error ? error.message : 'Inténtalo nuevamente.',
      );
    } finally {
      setBusyAction(null);
    }
  };

  const runImport = () => {
    Alert.alert(
      'Restaurar grimorio',
      'La copia seleccionada reemplazará los juramentos actuales.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Elegir archivo',
          onPress: async () => {
            setBusyAction('import');
            try {
              const count = await onImport();
              if (count !== null) {
                Alert.alert('Grimorio restaurado', `Se recuperaron ${count} juramentos.`);
              }
            } catch (error) {
              Alert.alert(
                'Copia no válida',
                error instanceof Error ? error.message : 'No se pudo leer el archivo.',
              );
            } finally {
              setBusyAction(null);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>OPCIONES DEL GRIMORIO</Text>

      <OrnatePanel style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons color={colors.bronzeLight} name="content-save-check-outline" size={25} />
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>Memoria vinculada</Text>
            <Text style={styles.sectionDescription}>
              {totalCount} juramentos y {historyCount} sellos guardados en este dispositivo.
            </Text>
          </View>
        </View>
      </OrnatePanel>

      <Text style={styles.groupTitle}>Custodia del grimorio</Text>
      <OrnatePanel style={styles.actionsPanel}>
        <ActionRow
          icon="tray-arrow-up"
          label="Exportar copia"
          loading={busyAction === 'export'}
          onPress={runExport}
          subtitle="Comparte un archivo JSON con todos tus datos"
        />
        <ActionRow
          icon="tray-arrow-down"
          label="Restaurar copia"
          loading={busyAction === 'import'}
          onPress={runImport}
          subtitle="Importa un grimorio guardado anteriormente"
        />
      </OrnatePanel>

      <Text style={styles.groupTitle}>Administrar el códice</Text>
      <OrnatePanel style={styles.actionsPanel}>
        <ActionRow
          disabled={completedCount === 0}
          icon="broom"
          label="Retirar los cumplidos"
          onPress={confirmClearCompleted}
          subtitle={`${completedCount} juramento${completedCount === 1 ? '' : 's'} sellado${completedCount === 1 ? '' : 's'}`}
        />
        <ActionRow
          danger
          disabled={totalCount === 0 && historyCount === 0}
          icon="fire"
          label="Quemar todo el códice"
          onPress={confirmClearAll}
          subtitle="Elimina páginas, historial y avisos"
        />
      </OrnatePanel>

      <Text style={styles.groupTitle}>Acerca de esta obra</Text>
      <OrnatePanel style={styles.aboutPanel}>
        <MaterialCommunityIcons color={colors.bronze} name="book-open-page-variant-outline" size={30} />
        <Text style={styles.aboutTitle}>Libro de los Malditos</Text>
        <Text style={styles.aboutCopy}>
          Una lista de tareas de fantasía oscura creada con React Native y Expo.
        </Text>
        <Text style={styles.version}>VERSIÓN 1.1.0 · EXPO SDK 54</Text>
      </OrnatePanel>
    </ScrollView>
  );
}

type ActionRowProps = {
  danger?: boolean;
  disabled?: boolean;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  loading?: boolean;
  onPress: () => void;
  subtitle: string;
};

function ActionRow({
  danger = false,
  disabled = false,
  icon,
  label,
  loading = false,
  onPress,
  subtitle,
}: ActionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        disabled && styles.actionDisabled,
        pressed && styles.actionPressed,
      ]}
    >
      <View style={[styles.actionIcon, danger && styles.actionIconDanger]}>
        {loading ? (
          <ActivityIndicator color={colors.bronzeLight} size="small" />
        ) : (
          <MaterialCommunityIcons
            color={danger ? colors.crimsonLight : colors.bronzeLight}
            name={icon}
            size={23}
          />
        )}
      </View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionLabel, danger && styles.actionLabelDanger]}>{label}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons color={colors.bronzeDark} name="chevron-right" size={23} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 22 },
  kicker: { color: colors.bronzeLight, fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 9, textAlign: 'center' },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  sectionHeaderCopy: { flex: 1 },
  sectionTitle: { color: colors.ivory, fontFamily: titleFont, fontSize: 17, fontWeight: '700', marginBottom: 3 },
  sectionDescription: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  groupTitle: { color: colors.ivory, fontFamily: titleFont, fontSize: 17, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  actionsPanel: { overflow: 'hidden', paddingHorizontal: 10 },
  actionRow: { minHeight: 69, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginVertical: 2 },
  actionDisabled: { opacity: 0.43 },
  actionPressed: { opacity: 0.62 },
  actionIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#100B09', elevation: 2 },
  actionIconDanger: { backgroundColor: 'rgba(78, 27, 22, 0.74)' },
  actionCopy: { flex: 1, paddingHorizontal: 12 },
  actionLabel: { color: colors.ivory, fontFamily: serifFont, fontSize: 15, fontWeight: '600' },
  actionLabelDanger: { color: '#D08A76' },
  actionSubtitle: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  aboutPanel: { alignItems: 'center', padding: 20 },
  aboutTitle: { color: colors.ivory, fontFamily: titleFont, fontSize: 20, fontWeight: '700', marginTop: 8 },
  aboutCopy: { maxWidth: 310, color: colors.muted, fontFamily: serifFont, fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  version: { color: colors.bronze, fontSize: 9, fontWeight: '700', letterSpacing: 1.3, marginTop: 14 },
});
