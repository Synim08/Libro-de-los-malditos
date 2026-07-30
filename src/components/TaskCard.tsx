import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, serifFont } from '../theme';
import {
  formatTaskDate,
  isOverdue,
  recurrenceScheduleLabel,
  reminderLeadLabel,
} from '../taskUtils';
import { Task } from '../types';

const parchmentTexture = require('../../assets/parchment-card.png');

type TaskCardProps = {
  index: number;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggle: (id: string) => void;
  onToggleCursed: (id: string) => void;
  task: Task;
};

export function TaskCard({
  index,
  onDelete,
  onEdit,
  onToggle,
  onToggleCursed,
  task,
}: TaskCardProps) {
  const overdue = isOverdue(task);

  return (
    <View style={[styles.frame, task.cursed && styles.frameCursed]}>
      <ImageBackground
        imageStyle={[
          styles.parchmentImage,
          task.completed && styles.parchmentImageCompleted,
        ]}
        resizeMode="cover"
        source={parchmentTexture}
        style={styles.card}
      >
        <Pressable
          accessibilityLabel={
            task.completed
              ? `Marcar ${task.title} como pendiente`
              : `Marcar ${task.title} como cumplida`
          }
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.completed }}
          onPress={() => onToggle(task.id)}
          style={({ pressed }) => [styles.mainAction, pressed && styles.pressed]}
        >
          <View
            style={[
              styles.checkbox,
              task.completed && styles.checkboxCompleted,
            ]}
          >
            <MaterialCommunityIcons
              color={task.completed ? colors.ivory : '#3B2A1D'}
              name={task.completed ? 'check' : 'rhombus-outline'}
              size={24}
            />
          </View>

          <View style={styles.copy}>
            <Text style={styles.eyebrow}>
              {task.cursed ? 'MALDICIÓN' : `JURAMENTO ${index + 1}`}
            </Text>
            <Text
              numberOfLines={2}
              style={[
                styles.title,
                task.completed && styles.titleCompleted,
              ]}
            >
              {task.title}
            </Text>
            {(task.dueAt || task.notes || task.recurrence !== 'none' || task.reminderEnabled) && (
              <View style={styles.metadata}>
                {task.dueAt && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons
                      color={overdue ? colors.crimson : '#714A31'}
                      name={overdue ? 'clock-alert-outline' : 'clock-outline'}
                      size={13}
                    />
                    <Text style={[styles.metaText, overdue && styles.metaTextOverdue]}>
                      {overdue ? 'Venció ' : ''}{formatTaskDate(task.dueAt)}
                    </Text>
                  </View>
                )}
                {task.recurrence !== 'none' && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons color="#714A31" name="repeat" size={13} />
                    <Text style={styles.metaText}>{recurrenceScheduleLabel(task)}</Text>
                  </View>
                )}
                {task.reminderEnabled && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons color="#714A31" name="bell-outline" size={13} />
                    <Text style={styles.metaText}>
                      {reminderLeadLabel(task.reminderLeadMinutes)}
                    </Text>
                  </View>
                )}
                {!task.reminderEnabled && task.dueAt && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons color={colors.crimson} name="bell-off-outline" size={13} />
                    <Text style={[styles.metaText, styles.metaTextOverdue]}>Sin aviso</Text>
                  </View>
                )}
                {task.notes && (
                  <MaterialCommunityIcons color="#714A31" name="text-box-outline" size={13} />
                )}
              </View>
            )}
          </View>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={`Editar ${task.title}`}
            accessibilityRole="button"
            onPress={() => onEdit(task)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color="#E2C398" name="pencil-outline" size={23} />
          </Pressable>

          <Pressable
            accessibilityLabel={
              task.cursed
                ? `Retirar maldición de ${task.title}`
                : `Marcar ${task.title} como maldición`
            }
            accessibilityRole="button"
            onPress={() => onToggleCursed(task.id)}
            style={({ pressed }) => [
              styles.iconButton,
              task.cursed && styles.iconButtonCursed,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              color={task.cursed ? '#FFB08A' : '#E2C398'}
              name="fire"
              size={26}
            />
          </Pressable>

          <Pressable
            accessibilityLabel={`Eliminar ${task.title}`}
            accessibilityRole="button"
            onPress={() => onDelete(task.id)}
            style={({ pressed }) => [
              styles.iconButton,
              styles.iconButtonDelete,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              color="#F0A08B"
              name="delete-outline"
              size={26}
            />
          </Pressable>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    minHeight: 98,
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: 'transparent',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 4,
  },
  frameCursed: {
    shadowColor: colors.crimson,
    shadowOpacity: 0.62,
  },
  card: {
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  parchmentImage: {
    width: '100%',
    height: '100%',
    opacity: 0.96,
  },
  parchmentImageCompleted: {
    opacity: 0.67,
  },
  mainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingLeft: 15,
  },
  pressed: {
    opacity: 0.58,
  },
  checkbox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: 'rgba(83, 57, 36, 0.28)',
  },
  checkboxCompleted: {
    backgroundColor: '#4A3D30',
  },
  copy: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  eyebrow: {
    color: '#714A31',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  title: {
    color: '#2B2017',
    fontFamily: serifFont,
    fontSize: 18,
    lineHeight: 25,
  },
  titleCompleted: {
    color: '#41372E',
    textDecorationLine: 'line-through',
  },
  actions: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 7,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    marginTop: 5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: '#714A31',
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metaTextOverdue: {
    color: colors.crimson,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(40, 27, 19, 0.88)',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.48,
    shadowRadius: 3,
  },
  iconButtonCursed: {
    backgroundColor: 'rgba(111, 32, 24, 0.94)',
  },
  iconButtonDelete: {
    backgroundColor: 'rgba(70, 31, 25, 0.92)',
  },
});
