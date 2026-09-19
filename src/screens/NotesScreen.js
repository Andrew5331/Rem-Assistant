import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import NoteItem from '../components/NoteItem';
import SectionHeader from '../components/SectionHeader';
import { colors, typography } from '../theme';
import { Storage } from '../storage';

export default function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => setNotes(await Storage.getNotes()))();
    }, [])
  );

  const addNote = async () => {
    if (!text.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      content: text.trim(),
      tag: 'Nota',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    await Storage.setNotes(updated);
    setText('');
  };

  const deleteNote = async (id) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    await Storage.setNotes(updated);
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={typography.title}>Bloc de Notas</Text>
        <SectionHeader index="04" title="NOTAS RÁPIDAS" right="History" />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Escribe o dicta un pensamiento..."
            placeholderTextColor={colors.textSecondary}
            value={text}
            onChangeText={setText}
            onSubmitEditing={addNote}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={addNote}>
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={notes}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => <NoteItem note={item} onDelete={deleteNote} />}
        ListEmptyComponent={<Text style={styles.empty}>Aún no tienes notas.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 30 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginTop: 12, paddingLeft: 12 },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: 12 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accentCyan, alignItems: 'center', justifyContent: 'center', margin: 6 },
});
