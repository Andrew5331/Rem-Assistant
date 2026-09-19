import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

const MOODS = [
  { key: 'Focused', icon: '🎯' },
  { key: 'Motivated', icon: '🚀' },
  { key: 'Tired', icon: '🌙' },
  { key: 'Stressed', icon: '😣' },
];

export default function MoodSelector({ value, onChange }) {
  return (
    <View style={styles.row}>
      {MOODS.map((m) => {
        const active = value === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            style={[styles.card, active && styles.cardActive]}
            onPress={() => onChange(m.key)}
          >
            <Text style={styles.icon}>{m.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{m.key}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  card: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: { backgroundColor: colors.accentCyan + '22', borderColor: colors.accentCyan },
  icon: { fontSize: 18, marginBottom: 4 },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  labelActive: { color: colors.accentCyan },
});
