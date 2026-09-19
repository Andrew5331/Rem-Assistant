import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function ClassCard({ item, onPress, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.code}>{item.code || 'CLASE'}</Text>
        <View style={styles.topRight}>
          <Text style={styles.time}>{item.start} - {item.end}</Text>
          {!!onDelete && (
            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={() => onDelete(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.subject}>{item.subject}</Text>
      <View style={styles.rowBottom}>
        {!!item.room && <Text style={styles.meta}>📍 {item.room}</Text>}
        {!!item.professor && <Text style={styles.meta}>👤 {item.professor}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardLight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: { padding: 2, marginLeft: 4 },
  code: { color: colors.accentCyan, fontSize: 11, fontWeight: '700', backgroundColor: colors.accentCyan + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  time: { color: colors.textSecondary, fontSize: 12 },
  subject: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  rowBottom: { flexDirection: 'row', gap: 12 },
  meta: { color: colors.textSecondary, fontSize: 12, marginRight: 12 },
});
