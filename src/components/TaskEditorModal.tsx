import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, serifFont, titleFont } from '../theme';
import { Recurrence, Task, TaskDraft } from '../types';
import {
  formatDateOnly,
  formatTimeOnly,
  recurrenceLabel,
} from '../taskUtils';

const recurrenceOptions: Recurrence[] = ['none', 'daily', 'weekly', 'monthly'];

const defaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date.getTime();
};

type TaskEditorModalProps = {
  defaultCursed?: boolean;
  initialTitle?: string;
  onClose: () => void;
  onSave: (draft: TaskDraft) => Promise<void>;
  task?: Task;
  visible: boolean;
};

export function TaskEditorModal({
  defaultCursed = false,
  initialTitle = '',
  onClose,
  onSave,
  task,
  visible,
}: TaskEditorModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [cursed, setCursed] = useState(false);
  const [dueAt, setDueAt] = useState<number | undefined>();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle(task?.title ?? initialTitle);
    setNotes(task?.notes ?? '');
    setCursed(task?.cursed ?? defaultCursed);
    setDueAt(task?.dueAt);
    setReminderEnabled(task?.reminderEnabled ?? false);
    setRecurrence(task?.recurrence ?? 'none');
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, [defaultCursed, initialTitle, task, visible]);

  const updateDatePart = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed' || !selected) {
      return;
    }

    const next = new Date(dueAt ?? defaultDueDate());
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setDueAt(next.getTime());
  };

  const updateTimePart = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'dismissed' || !selected) {
      return;
    }

    const next = new Date(dueAt ?? defaultDueDate());
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setDueAt(next.getTime());
  };

  const clearDueDate = () => {
    setDueAt(undefined);
    setReminderEnabled(false);
    setRecurrence('none');
  };

  const toggleReminder = (enabled: boolean) => {
    if (enabled && !dueAt) {
      setDueAt(defaultDueDate());
    }
    setReminderEnabled(enabled);
  };

  const selectRecurrence = (value: Recurrence) => {
    if (value !== 'none' && !dueAt) {
      setDueAt(defaultDueDate());
    }
    setRecurrence(value);
  };

  const submit = async () => {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      Alert.alert('Falta el juramento', 'Escribe un título antes de guardar.');
      return;
    }

    if (reminderEnabled && dueAt && dueAt <= Date.now()) {
      Alert.alert(
        'Fecha pasada',
        'El recordatorio debe programarse para una fecha futura.',
      );
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: cleanTitle,
        notes: notes.trim(),
        cursed,
        dueAt,
        reminderEnabled,
        recurrence,
      });
      onClose();
    } catch (error) {
      Alert.alert(
        'No se pudo guardar',
        error instanceof Error ? error.message : 'Inténtalo nuevamente.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      visible={visible}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Cerrar editor"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons color={colors.muted} name="close" size={25} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>{task ? 'REESCRIBIR PÁGINA' : 'NUEVA PÁGINA'}</Text>
              <Text style={styles.heading}>{task ? 'Editar juramento' : 'Consignar juramento'}</Text>
            </View>
            <Pressable
              accessibilityLabel="Guardar juramento"
              accessibilityRole="button"
              disabled={saving}
              hitSlop={8}
              onPress={submit}
              style={styles.headerButton}
            >
              {saving ? (
                <ActivityIndicator color={colors.bronzeLight} size="small" />
              ) : (
                <MaterialCommunityIcons color={colors.bronzeLight} name="content-save" size={24} />
              )}
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>JURAMENTO</Text>
            <TextInput
              accessibilityLabel="Título del juramento"
              maxLength={90}
              onChangeText={setTitle}
              placeholder="Escribe el juramento"
              placeholderTextColor="#6F5C48"
              selectionColor={colors.crimsonLight}
              style={styles.titleInput}
              value={title}
            />

            <Text style={styles.fieldLabel}>CRÓNICA O NOTAS</Text>
            <TextInput
              accessibilityLabel="Notas del juramento"
              maxLength={500}
              multiline
              onChangeText={setNotes}
              placeholder="Detalles, pasos o contexto…"
              placeholderTextColor="#6F5C48"
              selectionColor={colors.crimsonLight}
              style={styles.notesInput}
              textAlignVertical="top"
              value={notes}
            />

            <Text style={styles.fieldLabel}>SELLO TEMPORAL</Text>
            {dueAt ? (
              <View style={styles.datePanel}>
                <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateAction}>
                  <MaterialCommunityIcons color={colors.bronzeLight} name="calendar" size={22} />
                  <View style={styles.dateCopy}>
                    <Text style={styles.dateCaption}>FECHA</Text>
                    <Text style={styles.dateValue}>{formatDateOnly(dueAt)}</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => setShowTimePicker(true)} style={styles.dateAction}>
                  <MaterialCommunityIcons color={colors.bronzeLight} name="clock-outline" size={22} />
                  <View style={styles.dateCopy}>
                    <Text style={styles.dateCaption}>HORA</Text>
                    <Text style={styles.dateValue}>{formatTimeOnly(dueAt)}</Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityLabel="Quitar fecha"
                  hitSlop={8}
                  onPress={clearDueDate}
                  style={styles.removeDate}
                >
                  <MaterialCommunityIcons color={colors.crimsonLight} name="calendar-remove" size={22} />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setDueAt(defaultDueDate())} style={styles.addDateButton}>
                <MaterialCommunityIcons color={colors.bronzeLight} name="calendar-plus" size={22} />
                <Text style={styles.addDateText}>AÑADIR FECHA Y HORA</Text>
              </Pressable>
            )}

            {showDatePicker && (
              <DateTimePicker
                mode="date"
                onChange={updateDatePart}
                value={new Date(dueAt ?? defaultDueDate())}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                is24Hour={false}
                mode="time"
                onChange={updateTimePart}
                value={new Date(dueAt ?? defaultDueDate())}
              />
            )}

            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchTitle}>Campana del juramento</Text>
                <Text style={styles.switchSubtitle}>Avisar al llegar la fecha límite</Text>
              </View>
              <Switch
                onValueChange={toggleReminder}
                thumbColor={reminderEnabled ? colors.ivory : '#71614F'}
                trackColor={{ false: '#2E241E', true: colors.crimson }}
                value={reminderEnabled}
              />
            </View>

            <Text style={styles.fieldLabel}>RITUAL REPETITIVO</Text>
            <View style={styles.recurrenceGrid}>
              {recurrenceOptions.map((option) => {
                const selected = recurrence === option;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    key={option}
                    onPress={() => selectRecurrence(option)}
                    style={[styles.recurrenceButton, selected && styles.recurrenceButtonSelected]}
                  >
                    <Text style={[styles.recurrenceText, selected && styles.recurrenceTextSelected]}>
                      {recurrenceLabel(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchTitle}>Marcar como maldición</Text>
                <Text style={styles.switchSubtitle}>Destacar como alta prioridad</Text>
              </View>
              <Switch
                onValueChange={setCursed}
                thumbColor={cursed ? '#FFD0B8' : '#71614F'}
                trackColor={{ false: '#2E241E', true: colors.crimson }}
                value={cursed}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={submit}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
              ]}
            >
              {saving ? (
                <ActivityIndicator color={colors.ivory} />
              ) : (
                <>
                  <MaterialCommunityIcons color={colors.ivory} name="book-check-outline" size={22} />
                  <Text style={styles.saveText}>SELLAR CAMBIOS</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ink },
  keyboardView: { flex: 1 },
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.bronzeDark,
    paddingHorizontal: 12,
    backgroundColor: colors.soot,
  },
  headerButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' },
  kicker: { color: colors.crimsonLight, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  heading: { color: colors.ivory, fontFamily: titleFont, fontSize: 18, marginTop: 3 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingBottom: 48 },
  fieldLabel: { color: colors.bronzeLight, fontSize: 10, fontWeight: '800', letterSpacing: 1.45, marginTop: 18, marginBottom: 7 },
  titleInput: { minHeight: 58, borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 9, paddingHorizontal: 14, color: colors.ivory, backgroundColor: colors.leather, fontFamily: serifFont, fontSize: 16 },
  notesInput: { minHeight: 112, borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 9, padding: 14, color: colors.ivory, backgroundColor: colors.leather, fontFamily: serifFont, fontSize: 14, lineHeight: 21 },
  datePanel: { borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.leather },
  dateAction: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.bronzeDark },
  dateCopy: { flex: 1 },
  dateCaption: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  dateValue: { color: colors.ivory, fontFamily: serifFont, fontSize: 14, marginTop: 2, textTransform: 'capitalize' },
  removeDate: { position: 'absolute', right: 10, top: 43, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addDateButton: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 9, backgroundColor: colors.leather },
  addDateText: { color: colors.bronzeLight, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  switchRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.leather },
  switchCopy: { flex: 1, paddingRight: 10 },
  switchTitle: { color: colors.ivory, fontFamily: serifFont, fontSize: 14 },
  switchSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  recurrenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recurrenceButton: { width: '48.5%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 8, backgroundColor: colors.leather },
  recurrenceButtonSelected: { borderColor: colors.bronzeLight, backgroundColor: colors.parchment },
  recurrenceText: { color: colors.muted, fontFamily: serifFont, fontSize: 12 },
  recurrenceTextSelected: { color: '#2B1D15', fontWeight: '700' },
  saveButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 26, borderRadius: 9, backgroundColor: colors.crimson },
  saveButtonPressed: { opacity: 0.7 },
  saveText: { color: colors.ivory, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
});
