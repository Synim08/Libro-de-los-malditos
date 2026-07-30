import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
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
  formatTaskDate,
  formatTimeOnly,
  nextOccurrenceForSchedule,
  recurrenceLabel,
  reminderLeadLabel,
  weekdayNames,
} from '../taskUtils';

const recurrenceOptions: Recurrence[] = ['none', 'daily', 'weekly', 'monthly'];
const weekdayOptions = [1, 2, 3, 4, 5, 6, 0];
const monthDayOptions = Array.from({ length: 31 }, (_, index) => index + 1);
const reminderLeadOptions = [0, 5, 10, 15, 30, 60, 120, 360, 720, 1_440, 4_320, 10_080];

const defaultEventTime = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date.getTime();
};

const maximumLeadFor = (recurrence: Recurrence) => {
  if (recurrence === 'daily') {
    return 720;
  }
  if (recurrence === 'weekly') {
    return 4_320;
  }
  return 10_080;
};

const validLeadFor = (recurrence: Recurrence, current: number) =>
  current <= maximumLeadFor(recurrence) ? current : 15;

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
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(15);
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [recurrenceWeekday, setRecurrenceWeekday] = useState(1);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const allowedLeadOptions = useMemo(
    () => reminderLeadOptions.filter((minutes) => minutes <= maximumLeadFor(recurrence)),
    [recurrence],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    const baseAt = task?.dueAt ?? defaultEventTime();
    const baseDate = new Date(baseAt);
    setTitle(task?.title ?? initialTitle);
    setNotes(task?.notes ?? '');
    setCursed(task?.cursed ?? defaultCursed);
    setDueAt(task?.dueAt);
    setReminderEnabled(task?.reminderEnabled ?? false);
    setReminderLeadMinutes(task?.reminderLeadMinutes ?? 15);
    setRecurrence(task?.recurrence ?? 'none');
    setRecurrenceWeekday(task?.recurrenceWeekday ?? baseDate.getDay());
    setRecurrenceDayOfMonth(task?.recurrenceDayOfMonth ?? baseDate.getDate());
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, [defaultCursed, initialTitle, task, visible]);

  const recurringDueAt = (
    nextRecurrence: Recurrence,
    timeAt: number,
    weekday = recurrenceWeekday,
    dayOfMonth = recurrenceDayOfMonth,
    leadMinutes = reminderLeadMinutes,
    withReminder = reminderEnabled,
  ) =>
    nextOccurrenceForSchedule(
      nextRecurrence,
      timeAt,
      weekday,
      dayOfMonth,
      Date.now() + (withReminder ? leadMinutes * 60_000 : 0),
    );

  const updateDatePart = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed' || !selected) {
      return;
    }

    const next = new Date(dueAt ?? defaultEventTime());
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

    const next = new Date(dueAt ?? defaultEventTime());
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setDueAt(
      recurrence === 'none'
        ? next.getTime()
        : recurringDueAt(recurrence, next.getTime()),
    );
  };

  const clearDueDate = () => {
    setDueAt(undefined);
    setReminderEnabled(false);
  };

  const addDueDate = () => {
    setDueAt(defaultEventTime());
    setReminderEnabled(true);
  };

  const selectRecurrence = (value: Recurrence) => {
    const nextLead = validLeadFor(value, reminderLeadMinutes);
    const timeAt = dueAt ?? defaultEventTime();
    setReminderLeadMinutes(nextLead);
    setRecurrence(value);

    if (value !== 'none') {
      setReminderEnabled(true);
      setDueAt(
        recurringDueAt(
          value,
          timeAt,
          recurrenceWeekday,
          recurrenceDayOfMonth,
          nextLead,
          true,
        ),
      );
    }
  };

  const selectWeekday = (weekday: number) => {
    setRecurrenceWeekday(weekday);
    setDueAt(
      recurringDueAt(
        'weekly',
        dueAt ?? defaultEventTime(),
        weekday,
      ),
    );
  };

  const selectDayOfMonth = (dayOfMonth: number) => {
    setRecurrenceDayOfMonth(dayOfMonth);
    setDueAt(
      recurringDueAt(
        'monthly',
        dueAt ?? defaultEventTime(),
        recurrenceWeekday,
        dayOfMonth,
      ),
    );
  };

  const toggleReminder = (enabled: boolean) => {
    const timeAt = dueAt ?? defaultEventTime();
    setReminderEnabled(enabled);

    if (recurrence === 'none') {
      if (enabled && !dueAt) {
        setDueAt(timeAt);
      }
      return;
    }

    setDueAt(
      recurringDueAt(
        recurrence,
        timeAt,
        recurrenceWeekday,
        recurrenceDayOfMonth,
        reminderLeadMinutes,
        enabled,
      ),
    );
  };

  const selectReminderLead = (minutes: number) => {
    setReminderLeadMinutes(minutes);
    if (recurrence !== 'none') {
      setDueAt(
        recurringDueAt(
          recurrence,
          dueAt ?? defaultEventTime(),
          recurrenceWeekday,
          recurrenceDayOfMonth,
          minutes,
          true,
        ),
      );
    }
  };

  const submit = async () => {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      Alert.alert('Falta el título', 'Escribe un título antes de guardar.');
      return;
    }

    const resolvedDueAt =
      recurrence === 'none'
        ? dueAt
        : recurringDueAt(recurrence, dueAt ?? defaultEventTime());
    const notificationAt =
      (resolvedDueAt ?? 0) - reminderLeadMinutes * 60_000;

    if (reminderEnabled && !resolvedDueAt) {
      Alert.alert('Falta el momento', 'Selecciona cuándo ocurrirá el evento.');
      return;
    }

    if (reminderEnabled && notificationAt <= Date.now()) {
      Alert.alert(
        'Anticipación no disponible',
        'El aviso quedaría en el pasado. Elige una fecha posterior o menos anticipación.',
      );
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: cleanTitle,
        notes: notes.trim(),
        cursed,
        dueAt: resolvedDueAt,
        reminderEnabled,
        reminderLeadMinutes,
        recurrence,
        recurrenceWeekday:
          recurrence === 'weekly' ? recurrenceWeekday : undefined,
        recurrenceDayOfMonth:
          recurrence === 'monthly' ? recurrenceDayOfMonth : undefined,
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

  const timeValue = new Date(dueAt ?? defaultEventTime());

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
              <Text style={styles.heading}>{task ? 'Editar registro' : 'Consignar registro'}</Text>
            </View>
            <Pressable
              accessibilityLabel="Guardar registro"
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
            <Text style={styles.fieldLabel}>TÍTULO</Text>
            <TextInput
              accessibilityLabel="Título del registro"
              maxLength={90}
              onChangeText={setTitle}
              placeholder="Escribe el juramento o maldición"
              placeholderTextColor="#6F5C48"
              selectionColor={colors.crimsonLight}
              style={styles.titleInput}
              value={title}
            />

            <Text style={styles.fieldLabel}>CRÓNICA O NOTAS</Text>
            <TextInput
              accessibilityLabel="Notas del registro"
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
                    style={[styles.recurrenceButton, selected && styles.optionSelected]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {recurrenceLabel(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {recurrence === 'none' && (
              <>
                <Text style={styles.fieldLabel}>FECHA Y HORA</Text>
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
                  <Pressable onPress={addDueDate} style={styles.addDateButton}>
                    <MaterialCommunityIcons color={colors.bronzeLight} name="calendar-plus" size={22} />
                    <Text style={styles.addDateText}>AÑADIR FECHA Y HORA</Text>
                  </Pressable>
                )}
              </>
            )}

            {recurrence === 'weekly' && (
              <>
                <Text style={styles.fieldLabel}>DÍA DE LA SEMANA</Text>
                <View style={styles.weekdayGrid}>
                  {weekdayOptions.map((weekday) => {
                    const selected = recurrenceWeekday === weekday;
                    return (
                      <Pressable
                        accessibilityLabel={weekdayNames[weekday]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        key={weekday}
                        onPress={() => selectWeekday(weekday)}
                        style={[styles.weekdayButton, selected && styles.optionSelected]}
                      >
                        <Text style={[styles.weekdayText, selected && styles.optionTextSelected]}>
                          {weekdayNames[weekday].slice(0, 3).toLocaleUpperCase('es')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {recurrence === 'monthly' && (
              <>
                <Text style={styles.fieldLabel}>DÍA DEL MES</Text>
                <ScrollView
                  contentContainerStyle={styles.monthDays}
                  contentOffset={{
                    x: Math.max(0, (recurrenceDayOfMonth - 1) * 49 - 96),
                    y: 0,
                  }}
                  horizontal
                  key={`month-days-${recurrenceDayOfMonth}`}
                  showsHorizontalScrollIndicator={false}
                >
                  {monthDayOptions.map((day) => {
                    const selected = recurrenceDayOfMonth === day;
                    return (
                      <Pressable
                        accessibilityLabel={`Día ${day} de cada mes`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        key={day}
                        onPress={() => selectDayOfMonth(day)}
                        style={[styles.monthDayButton, selected && styles.optionSelected]}
                      >
                        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {recurrenceDayOfMonth > 28 && (
                  <Text style={styles.helperText}>
                    Si el mes no tiene día {recurrenceDayOfMonth}, se usará su último día válido.
                  </Text>
                )}
              </>
            )}

            {recurrence !== 'none' && (
              <>
                <Text style={styles.fieldLabel}>HORA DEL EVENTO</Text>
                <Pressable onPress={() => setShowTimePicker(true)} style={styles.timeOnlyButton}>
                  <MaterialCommunityIcons color={colors.bronzeLight} name="clock-outline" size={23} />
                  <View style={styles.dateCopy}>
                    <Text style={styles.dateCaption}>HORA</Text>
                    <Text style={styles.dateValue}>{formatTimeOnly(timeValue.getTime())}</Text>
                  </View>
                </Pressable>
                {dueAt && (
                  <Text style={styles.nextOccurrence}>
                    Próxima ocurrencia calculada: {formatTaskDate(dueAt)}
                  </Text>
                )}
              </>
            )}

            {showDatePicker && recurrence === 'none' && (
              <DateTimePicker
                mode="date"
                onChange={updateDatePart}
                value={timeValue}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                is24Hour={false}
                mode="time"
                onChange={updateTimePart}
                value={timeValue}
              />
            )}

            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchTitle}>Campana del registro</Text>
                <Text style={styles.switchSubtitle}>Avisar antes del momento del evento</Text>
              </View>
              <Switch
                onValueChange={toggleReminder}
                thumbColor={reminderEnabled ? colors.ivory : '#71614F'}
                trackColor={{ false: '#2E241E', true: colors.crimson }}
                value={reminderEnabled}
              />
            </View>

            {reminderEnabled && (
              <>
                <Text style={styles.fieldLabel}>ANTICIPACIÓN DEL AVISO</Text>
                <View style={styles.leadGrid}>
                  {allowedLeadOptions.map((minutes) => {
                    const selected = reminderLeadMinutes === minutes;
                    return (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        key={minutes}
                        onPress={() => selectReminderLead(minutes)}
                        style={[styles.leadButton, selected && styles.optionSelected]}
                      >
                        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                          {reminderLeadLabel(minutes)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

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
              style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
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
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.bronzeDark, paddingHorizontal: 12, backgroundColor: colors.soot },
  headerButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' },
  kicker: { color: colors.crimsonLight, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  heading: { color: colors.ivory, fontFamily: titleFont, fontSize: 18, marginTop: 3 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingBottom: 48 },
  fieldLabel: { color: colors.bronzeLight, fontSize: 10, fontWeight: '800', letterSpacing: 1.45, marginTop: 18, marginBottom: 7 },
  titleInput: { minHeight: 58, borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 9, paddingHorizontal: 14, color: colors.ivory, backgroundColor: colors.leather, fontFamily: serifFont, fontSize: 16 },
  notesInput: { minHeight: 112, borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 9, padding: 14, color: colors.ivory, backgroundColor: colors.leather, fontFamily: serifFont, fontSize: 14, lineHeight: 21 },
  recurrenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recurrenceButton: { width: '48.5%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 8, backgroundColor: colors.leather },
  optionSelected: { borderColor: colors.bronzeLight, backgroundColor: colors.parchment },
  optionText: { color: colors.muted, fontFamily: serifFont, fontSize: 12 },
  optionTextSelected: { color: '#2B1D15', fontWeight: '700' },
  datePanel: { borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.leather },
  dateAction: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.bronzeDark },
  dateCopy: { flex: 1 },
  dateCaption: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  dateValue: { color: colors.ivory, fontFamily: serifFont, fontSize: 14, marginTop: 2, textTransform: 'capitalize' },
  removeDate: { position: 'absolute', right: 10, top: 43, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addDateButton: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 9, backgroundColor: colors.leather },
  addDateText: { color: colors.bronzeLight, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  weekdayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  weekdayButton: { width: '22.8%', minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 8, backgroundColor: colors.leather },
  weekdayText: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  monthDays: { gap: 7, paddingRight: 6 },
  monthDayButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 21, backgroundColor: colors.leather },
  helperText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 8 },
  timeOnlyButton: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 9, backgroundColor: colors.leather },
  nextOccurrence: { color: colors.muted, fontFamily: serifFont, fontSize: 10, marginTop: 7, textAlign: 'center' },
  switchRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.leather },
  switchCopy: { flex: 1, paddingRight: 10 },
  switchTitle: { color: colors.ivory, fontFamily: serifFont, fontSize: 14 },
  switchSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  leadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  leadButton: { width: '48.5%', minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderWidth: 1, borderColor: colors.bronzeDark, borderRadius: 8, backgroundColor: colors.leather },
  saveButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 26, borderRadius: 9, backgroundColor: colors.crimson },
  saveButtonPressed: { opacity: 0.7 },
  saveText: { color: colors.ivory, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
});
