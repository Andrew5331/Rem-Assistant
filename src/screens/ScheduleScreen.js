import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ClassCard from '../components/ClassCard';
import SectionHeader from '../components/SectionHeader';
import { colors, typography } from '../theme';
import { Storage } from '../storage';

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ subject: '', code: '', room: '', professor: '', start: '', end: '' });

  useFocusEffect(
    useCallback(() => {
      (async () => setSchedule(await Storage.getSchedule()))();
    }, [])
  );

  const addClass = async () => {
    if (!form.subject.trim()) return;
    const newItem = { id: Date.now().toString(), ...form };
    const updated = [...schedule, newItem].sort((a, b) => a.start.localeCompare(b.start));
    setSchedule(updated);
    await Storage.setSchedule(updated);
    setForm({ subject: '', code: '', room: '', professor: '', start: '', end: '' });
    setModalVisible(false);
  };

  const deleteClass = (id) => {
    Alert.alert(
      'Eliminar clase',
      '¿Estás seguro de que deseas eliminar esta clase del horario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const updated = schedule.filter((item) => item.id !== id);
            setSchedule(updated);
            await Storage.setSchedule(updated);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={typography.title}>Horario & Aulas</Text>
        <SectionHeader index="02" title="CLASES DE HOY" right={`${schedule.length} clases`} />
      </View>
      <FlatList
        data={schedule}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        renderItem={({ item }) => <ClassCard item={item} onDelete={deleteClass} />}
        ListEmptyComponent={<Text style={styles.empty}>No tienes clases registradas. Toca + para agregar una.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva clase</Text>
            {['subject', 'code', 'room', 'professor', 'start', 'end'].map((field) => (
              <TextInput
                key={field}
                placeholder={placeholders[field]}
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={form[field]}
                onChangeText={(v) => setForm({ ...form, [field]: v })}
              />
            ))}
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addClass}>
                <Text style={styles.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const placeholders = {
  subject: 'Materia (ej. Advanced Algorithms)',
  code: 'Código (ej. CS-401)',
  room: 'Salón',
  professor: 'Profesor',
  start: 'Hora inicio (ej. 09:00)',
  end: 'Hora fin (ej. 10:30)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 30 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 54, height: 54, borderRadius: 27, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  modalBg: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.cardDark, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: colors.cardLight, borderRadius: 10, padding: 12, color: colors.textPrimary, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: colors.textSecondary },
  saveBtn: { backgroundColor: colors.accent, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  saveText: { color: '#fff', fontWeight: '700' },
});
