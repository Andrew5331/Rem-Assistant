import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import OrbCore from '../components/OrbCore';
import MoodSelector from '../components/MoodSelector';
import SectionHeader from '../components/SectionHeader';
import { colors, typography } from '../theme';
import { Storage } from '../storage';
import { speak } from '../services/speechService';
import { useVoiceCapture } from '../hooks/useVoiceCapture';
import { getCashFlow, getTodos } from '../services/backendService';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function CoreScreen({ navigation }) {
  const [mood, setMood] = useState('Focused');
  const [goal, setGoal] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Listo · Toca el núcleo o usa el micro para hablar con Rem');
  const [neuralLoad, setNeuralLoad] = useState(12);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [availableCash, setAvailableCash] = useState(null);
  
  // Módulos visibles (personalización del usuario)
  const [visibleModules, setVisibleModules] = useState({
    voiceOrb: true,
    quickActions: true,
    dailyStatus: true,
    financialWidget: true,
  });

  const { startRecording, stopRecordingAndAsk } = useVoiceCapture();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setMood(await Storage.getMood());
        setGoal(await Storage.getGoal());
        try {
          const todos = await getTodos();
          setPendingTasksCount(todos.filter((t) => t.status !== 'done').length);
        } catch (e) {
          // ignore offline
        }
        try {
          const cf = await getCashFlow();
          if (cf && cf.available_balance !== undefined) {
            setAvailableCash(cf.available_balance);
          }
        } catch (e) {
          // ignore offline
        }
      })();
    }, [])
  );

  useEffect(() => {
    setNeuralLoad(Math.floor(Math.random() * 20) + 5);
  }, []);

  const onMoodChange = async (m) => {
    setMood(m);
    await Storage.setMood(m);
  };

  const onGoalSubmit = async () => {
    setEditingGoal(false);
    await Storage.setGoal(goal);
  };

  const toggleModule = (moduleKey) => {
    setVisibleModules((prev) => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
  };

  const onOrbPress = async () => {
    if (!isListening) {
      try {
        setIsListening(true);
        setStatus('Escuchando... toca de nuevo para enviar');
        await startRecording();
      } catch (e) {
        setIsListening(false);
        setStatus(`Error de micrófono: ${e.message}`);
      }
    } else {
      try {
        setStatus('Transcribiendo y consultando a Rem...');
        const { transcript, reply } = await stopRecordingAndAsk();
        setIsListening(false);
        if (!transcript) {
          setStatus('No se entendió el audio. Intenta de nuevo.');
          return;
        }
        setStatus(`Tú: "${transcript}"`);
        speak(reply);
        navigation.navigate('Drawer', { incomingVoiceQuery: transcript, incomingVoiceReply: reply });
      } catch (e) {
        setIsListening(false);
        setStatus(`Error: ${e.message}`);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>REM // OS</Text>
          <Text style={typography.title}>Tablero Principal</Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color={colors.textPrimary} />
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.dot} />
        <Text style={styles.statusText}>CORE DE REM EN LÍNEA</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.greetRow}>
        <Text style={styles.greetText}>{getGreeting()}</Text>
        <View style={styles.focusPill}>
          <Text style={styles.focusPillText}>⚡ {mood}</Text>
        </View>
      </View>
      <Text style={styles.subText}>Carga del sistema: {neuralLoad}% · Agentes activos</Text>

      {/* Matriz de Acciones Rápidas (Quick Actions Module) */}
      {visibleModules.quickActions && (
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.actionChip} onPress={() => navigation.navigate('Drawer')}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.accentCyan} />
            <Text style={styles.actionChipText}>Chat con Rem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => navigation.navigate('Tasks')}>
            <Ionicons name="add-circle" size={18} color={colors.accentEmerald} />
            <Text style={styles.actionChipText}>Nueva Tarea</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => navigation.navigate('Finance')}>
            <Ionicons name="cash" size={18} color={colors.accentAmber} />
            <Text style={styles.actionChipText}>Gasto/Ingreso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => navigation.navigate('Notes')}>
            <Ionicons name="document-text" size={18} color={colors.accentIndigo} />
            <Text style={styles.actionChipText}>Nota Rápida</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Núcleo por Voz de Rem */}
      {visibleModules.voiceOrb && (
        <View style={styles.orbModuleCard}>
          <OrbCore isListening={isListening} onPress={onOrbPress} />
          <View style={styles.statusCard}>
            <Text style={styles.statusCardText}>{status}</Text>
          </View>
        </View>
      )}

      {/* Módulo de Resumen de Métricas */}
      {visibleModules.financialWidget && (
        <View style={styles.widgetsGrid}>
          <TouchableOpacity style={styles.widgetCard} onPress={() => navigation.navigate('Tasks')}>
            <View style={styles.widgetIconRow}>
              <Ionicons name="checkbox-outline" size={20} color={colors.accentCyan} />
              <Text style={styles.widgetBadge}>{pendingTasksCount}</Text>
            </View>
            <Text style={styles.widgetTitle}>Tareas Pendientes</Text>
            <Text style={styles.widgetSub}>Agente Secretaría</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.widgetCard} onPress={() => navigation.navigate('Finance')}>
            <View style={styles.widgetIconRow}>
              <Ionicons name="wallet-outline" size={20} color={colors.accentEmerald} />
            </View>
            <Text style={styles.widgetTitle}>
              {availableCash !== null ? `$${availableCash.toLocaleString()}` : 'Ver Saldo'}
            </Text>
            <Text style={styles.widgetSub}>Disponible Financiero</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Módulo de Estado Diario */}
      {visibleModules.dailyStatus && (
        <View style={styles.moduleCard}>
          <SectionHeader index="01" title="ESTADO & OBJETIVO DIARIO" right="Sync: local" />
          <MoodSelector value={mood} onChange={onMoodChange} />

          <View style={styles.goalRow}>
            <Ionicons name="flag" size={18} color={colors.accentCyan} />
            {editingGoal ? (
              <TextInput
                style={styles.goalInput}
                value={goal}
                onChangeText={setGoal}
                onSubmitEditing={onGoalSubmit}
                onBlur={onGoalSubmit}
                autoFocus
              />
            ) : (
              <Text style={styles.goalText} numberOfLines={1}>Meta: {goal}</Text>
            )}
            <TouchableOpacity onPress={() => setEditingGoal(true)}>
              <Ionicons name="pencil" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Control de Módulos (Personalización del Usuario) */}
      <View style={styles.customizeBar}>
        <Text style={styles.customizeTitle}>MODULAR DASHBOARD</Text>
        <View style={styles.customizeChips}>
          <TouchableOpacity
            style={[styles.toggleChip, visibleModules.voiceOrb && styles.toggleChipActive]}
            onPress={() => toggleModule('voiceOrb')}
          >
            <Text style={styles.toggleChipText}>🎙️ Núcleo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleChip, visibleModules.quickActions && styles.toggleChipActive]}
            onPress={() => toggleModule('quickActions')}
          >
            <Text style={styles.toggleChipText}>⚡ Atajos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleChip, visibleModules.financialWidget && styles.toggleChipActive]}
            onPress={() => toggleModule('financialWidget')}
          >
            <Text style={styles.toggleChipText}>📊 Métrica</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { color: colors.accentCyan, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 6 },
  statusText: { color: colors.success, fontSize: 11, fontWeight: '700', letterSpacing: 1, flex: 1 },
  dateText: { color: colors.textSecondary, fontSize: 11 },
  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  greetText: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  focusPill: { backgroundColor: colors.accent + '25', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: colors.accent + '55' },
  focusPillText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  subText: { color: colors.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 14 },
  
  quickActionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  actionChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 6, borderWidth: 1, borderColor: colors.border },
  actionChipText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },

  orbModuleCard: { backgroundColor: colors.cardDark, borderRadius: 20, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statusCard: { backgroundColor: colors.cardLight, borderRadius: 14, padding: 12, marginTop: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statusCardText: { color: colors.textSecondary, fontSize: 12, textAlign: 'center' },

  widgetsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  widgetCard: { flex: 1, backgroundColor: colors.cardLight, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  widgetIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  widgetBadge: { backgroundColor: colors.accentCyan + '25', color: colors.accentCyan, fontSize: 12, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  widgetTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  widgetSub: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },

  moduleCard: { backgroundColor: colors.cardDark, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  goalRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 14, padding: 12, marginTop: 12, borderWidth: 1, borderColor: colors.border },
  goalText: { color: colors.textPrimary, fontSize: 13, marginLeft: 8, flex: 1, fontWeight: '500' },
  goalInput: { color: colors.textPrimary, fontSize: 13, marginLeft: 8, flex: 1, paddingVertical: 0 },

  customizeBar: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  customizeTitle: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  customizeChips: { flexDirection: 'row', gap: 8 },
  toggleChip: { backgroundColor: colors.cardDark, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  toggleChipActive: { backgroundColor: colors.accent + '30', borderColor: colors.accent },
  toggleChipText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
});

