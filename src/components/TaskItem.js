import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const PRIORITY_COLORS = {
  High: colors.danger,
  Medium: colors.warning,
  Low: colors.accentCyan,
  Done: colors.success,
};

export default function TaskItem({ task, onToggle, onDelete }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => onToggle(task.id)} style={styles.checkbox}>
        <Ionicons
          name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={task.done ? colors.success : colors.textSecondary}
        />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, task.done && styles.titleDone]}>{task.title}</Text>
        <Text style={styles.due}>{task.due}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: (PRIORITY_COLORS[task.priority] || colors.accent) + '33' }]}>
        <Text style={[styles.badgeText, { color: PRIORITY_COLORS[task.priority] || colors.accent }]}>
          {task.priority}
        </Text>
      </View>
      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(task.id)} style={{ marginLeft: 8 }}>
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: { marginRight: 10 },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  titleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  due: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
