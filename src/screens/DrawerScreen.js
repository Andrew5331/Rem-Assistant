import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ChatBubble from '../components/ChatBubble';
import { colors, typography } from '../theme';
import { Storage } from '../storage';
import { askBackend } from '../services/backendService';
import { speak } from '../services/speechService';
import { useVoiceCapture } from '../hooks/useVoiceCapture';

const SUGGESTIONS = [
  '💰 ¿Cuánto dinero disponible tengo?',
  '📋 Ver mis tareas pendientes',
  '💳 Estado de tarjetas de crédito',
  '📝 Recordarme leer capítulo 4',
];

export default function DrawerScreen({ route }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { isRecording, startRecording, stopRecordingAndAsk } = useVoiceCapture();
  const listRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      (async () => setMessages(await Storage.getChat()))();
    }, [])
  );

  // Si venimos de una consulta de voz hecha desde el núcleo (CoreScreen)
  useEffect(() => {
    const q = route?.params?.incomingVoiceQuery;
    const r = route?.params?.incomingVoiceReply;
    if (q && r) {
      (async () => {
        const updated = [...messages, { role: 'user', content: q }, { role: 'assistant', content: r }];
        setMessages(updated);
        await Storage.setChat(updated);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.incomingVoiceQuery]);

  const pushMessages = async (newOnes) => {
    const updated = [...messages, ...newOnes];
    setMessages(updated);
    await Storage.setChat(updated);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async (text) => {
    const content = (text ?? input).trim();
    if (!content) return;
    await pushMessages([{ role: 'user', content }]);
    setInput('');
    setLoading(true);
    try {
      const reply = await askBackend(content);
      await pushMessages([{ role: 'assistant', content: reply }]);
      speak(reply);
    } catch (e) {
      await pushMessages([{ role: 'assistant', content: `⚠️ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onMicPress = async () => {
    if (!isRecording) {
      try {
        await startRecording();
      } catch (e) {
        await pushMessages([{ role: 'assistant', content: `⚠️ ${e.message}` }]);
      }
    } else {
      try {
        setLoading(true);
        const { transcript, reply } = await stopRecordingAndAsk();
        setLoading(false);
        if (transcript) {
          await pushMessages([
            { role: 'user', content: transcript },
            { role: 'assistant', content: reply },
          ]);
          speak(reply);
        }
      } catch (e) {
        setLoading(false);
        await pushMessages([{ role: 'assistant', content: `⚠️ ${e.message}` }]);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.remAvatar}>
              <Text style={styles.remAvatarText}>R</Text>
            </View>
            <View>
              <Text style={typography.title}>Conversar con Rem</Text>
              <Text style={styles.headerSubtitle}>Asistente Personal Orquestado</Text>
            </View>
          </View>
          <View style={styles.modelPill}>
            <View style={styles.dot} />
            <Text style={styles.modelText}>Agente Secretaría + Agente Financiero</Text>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={44} color={colors.accentCyan} />
              <Text style={styles.emptyTitle}>¡Hola! Soy Rem</Text>
              <Text style={styles.emptySub}>
                Puedo ayudarte con tus tareas, finanzas, recordatorios o cualquier consulta casual.
              </Text>
              <Text style={styles.emptyHint}>Prueba seleccionando una consulta rápida abajo:</Text>
            </View>
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accentCyan} size="small" />
            <Text style={styles.loadingText}>Rem está analizando y procesando tu petición...</Text>
          </View>
        )}

        {messages.length < 4 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
              {SUGGESTIONS.map((sugg, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(sugg.replace(/^[^\s]+\s/, ''))}
                >
                  <Text style={styles.suggestionChipText}>{sugg}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[styles.micBtn, isRecording && styles.micBtnActive]}
              onPress={onMicPress}
            >
              <Ionicons name={isRecording ? 'stop' : 'mic'} size={20} color="#fff" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Pregúntale algo a Rem..."
              placeholderTextColor={colors.textSecondary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage()}>
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  remAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  remAvatarText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  headerSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  modelPill: { flexDirection: 'row', alignItems: 'center', marginTop: 8, alignSelf: 'flex-start', backgroundColor: colors.cardLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.border },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 6 },
  modelText: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 40 },
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 12 },
  emptySub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  emptyHint: { color: colors.accentCyan, fontSize: 12, fontWeight: '600', marginTop: 16 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  loadingText: { color: colors.textSecondary, fontSize: 12 },
  suggestionsContainer: { paddingVertical: 6 },
  suggestionChip: { backgroundColor: colors.cardLight, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  suggestionChipText: { color: colors.textPrimary, fontSize: 12, fontWeight: '500' },
  inputContainer: { padding: 12, backgroundColor: colors.cardDark, borderTopWidth: 1, borderTopColor: colors.border },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  micBtnActive: { backgroundColor: colors.danger },
  input: { flex: 1, backgroundColor: colors.cardLight, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});

