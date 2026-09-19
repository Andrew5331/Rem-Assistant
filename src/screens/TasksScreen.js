import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TaskItem from '../components/TaskItem';
import ProgressBar from '../components/ProgressBar';
import SectionHeader from '../components/SectionHeader';
import { colors, typography } from '../theme';
import { Storage } from '../storage';
import { getTodos, createTodo, completeTodo } from '../services/backendService';

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState('Medium');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTodos();
      if (data && Array.isArray(data) && data.length > 0) {
        const formatted = data.map((t) => ({
          id: String(t.id),
          title: t.title,
          due: t.due_date || 'Sin fecha',
          priority: t.status === 'done' ? 'Done' : t.priority || 'Medium',
          done: t.status === 'done',
        }));
        setTasks(formatted);
        await Storage.setTasks(formatted);
        return;
      }
    } catch (e) {
      setError('Backend en modo local. Las tareas se guardan en el dispositivo.');
    }
    
    // Fallback a almacenamiento local
    const local = await Storage.getTasks();
    setTasks(local);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return (tasks.filter((t) => t.done).length / tasks.length) * 100;
  }, [tasks]);

  const toggleTask = async (id) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done, priority: !t.done ? 'Done' : 'Medium' } : t));
    setTasks(updated);
    await Storage.setTasks(updated);
    try {
      await completeTodo(id);
    } catch (e) {
      // guardado localmente
    }
  };

  const addTask = async () => {
    if (!title.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      due: due.trim() || 'Hoy',
      priority: priority,
      done: false,
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    await Storage.setTasks(updated);
    setTitle('');
    setDue('');
    setPriority('Medium');
    setModalVisible(false);

    try {
      await createTodo(newTask.title, newTask.due, newTask.priority);
    } catch (e) {
      // guardado localmente en la app
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={typography.title}>Tareas & Entregas</Text>
        <SectionHeader index="03" title="AGENTE DE SECRETARÍA & TAREAS" right={`${Math.round(progress)}% Completado`} />
        <ProgressBar progress={progress} />
        {!!error && <Text style={styles.infoNote}>{error}</Text>}
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTasks} tintColor={colors.accentCyan} />}
        renderItem={({ item }) => <TaskItem task={item} onToggle={toggleTask} />}
        ListEmptyComponent={
          !loading && <Text style={styles.empty}>No tienes tareas registradas. Toca + para agregar una.</Text>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva tarea</Text>
            <TextInput
              placeholder="Título de la tarea"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              placeholder="Fecha límite (ej. Hoy 18:00 o YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={due}
              onChangeText={setDue}
            />
            <View style={styles.priorityRow}>
              {['High', 'Medium', 'Low'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityChip, priority === p && styles.priorityChipActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addTask}>
                <Text style={styles.saveText}>Guardar Tarea</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 30 },
  infoNote: { color: colors.accentCyan, fontSize: 11, marginTop: 8, fontWeight: '500' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 54, height: 54, borderRadius: 27, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  modalBg: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.cardDark, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: colors.cardLight, borderRadius: 10, padding: 12, color: colors.textPrimary, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  priorityChip: { flex: 1, backgroundColor: colors.cardLight, borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  priorityChipActive: { backgroundColor: colors.accent + '33', borderColor: colors.accent },
  priorityText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  priorityTextActive: { color: colors.accent },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: colors.textSecondary },
  saveBtn: { backgroundColor: colors.accent, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  saveText: { color: '#fff', fontWeight: '700' },
});

