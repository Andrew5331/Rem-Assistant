import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function NoteItem({ note, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          {!!note.tag && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{note.tag}</Text>
            </View>
          )}
          <Text style={styles.time}>{note.time}</Text>
        </View>
        <Text style={styles.content}>{note.content}</Text>
      </View>
      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(note.id)}>
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.cardLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' },
  tag: { backgroundColor: colors.accent + '33', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { color: colors.accent, fontSize: 10, fontWeight: '700' },
  time: { color: colors.textSecondary, fontSize: 11 },
  content: { color: colors.textPrimary, fontSize: 13 },
});
