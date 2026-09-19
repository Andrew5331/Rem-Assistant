import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SectionHeader from '../components/SectionHeader';
import { colors, typography } from '../theme';
import {
  getCashFlow, getTransactions, createTransaction, getSavingsGoals, getCreditCards,
} from '../services/backendService';

const DEFAULT_SIM_CASHFLOW = {
  total_income: 5200000,
  total_expense: 1700000,
  available_balance: 3500000,
};

const DEFAULT_SIM_CARDS = [
  { id: 'c1', name: 'Visa Signature', credit_limit: 6000000, available_credit: 4200000, cut_off_day: 15, payment_due_day: 5 },
  { id: 'c2', name: 'Mastercard Black', credit_limit: 10000000, available_credit: 8500000, cut_off_day: 28, payment_due_day: 18 },
];

const DEFAULT_SIM_GOALS = [
  { id: 'g1', name: 'Fondo de Emergencia', target_amount: 5000000, current_amount: 4250000, progress_pct: 85 },
  { id: 'g2', name: 'Nuevo Equipo Laptop', target_amount: 3000000, current_amount: 1800000, progress_pct: 60 },
];

const DEFAULT_SIM_TXS = [
  { id: 't1', merchant: 'Supermercado Éxito', category: 'Alimentación', amount: 150000, transaction_type: 'expense', source: 'Simulación' },
  { id: 't2', merchant: 'Depósito Nómina / Trabajo', category: 'Ingreso', amount: 2500000, transaction_type: 'income', source: 'Simulación' },
  { id: 't3', merchant: 'Restaurante Crepes & Waffles', category: 'Entretenimiento', amount: 85000, transaction_type: 'expense', source: 'Simulación' },
];

export default function FinanceScreen() {
  const [cashFlow, setCashFlow] = useState(DEFAULT_SIM_CASHFLOW);
  const [transactions, setTransactions] = useState(DEFAULT_SIM_TXS);
  const [goals, setGoals] = useState(DEFAULT_SIM_GOALS);
  const [cards, setCards] = useState(DEFAULT_SIM_CARDS);
  const [loading, setLoading] = useState(false);
  const [simNote, setSimNote] = useState('Modo Simulación Financiera Activo (Sin dinero real)');

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Alimentación');
  const [merchant, setMerchant] = useState('');
  const [type, setType] = useState('expense');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cf, tx, sg, cc] = await Promise.all([
        getCashFlow(), getTransactions(), getSavingsGoals(), getCreditCards(),
      ]);
      if (cf && cf.available_balance !== undefined) setCashFlow(cf);
      if (tx && tx.length > 0) setTransactions(tx);
      if (sg && sg.length > 0) setGoals(sg);
      if (cc && cc.length > 0) setCards(cc);
      setSimNote('Conectado al Agente Financiero');
    } catch (e) {
      setSimNote('Modo Simulación Financiera Activo (Demostración local)');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const addSimulatedTransaction = async () => {
    const val = parseFloat(amount);
    if (!val || !merchant.trim()) return;

    const newTx = {
      id: Date.now().toString(),
      merchant: merchant.trim(),
      category: category.trim() || 'General',
      amount: val,
      transaction_type: type,
      source: 'Simulación',
    };

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);

    // Actualizar balance simulado
    setCashFlow((prev) => {
      const newIncome = type === 'income' ? prev.total_income + val : prev.total_income;
      const newExpense = type === 'expense' ? prev.total_expense + val : prev.total_expense;
      return {
        total_income: newIncome,
        total_expense: newExpense,
        available_balance: newIncome - newExpense,
      };
    });

    setAmount('');
    setMerchant('');
    setModalVisible(false);

    try {
      await createTransaction({ amount: val, category, merchant, transaction_type: type, payment_method: '' });
    } catch (e) {
      // guardado en la simulación local
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAll} tintColor={colors.accentCyan} />}
      >
        <View style={styles.headerRow}>
          <Text style={typography.title}>Simulación Financiera</Text>
          <View style={styles.sandboxBadge}>
            <Text style={styles.sandboxBadgeText}>DEMO SANDBOX</Text>
          </View>
        </View>
        <Text style={styles.simSubtitle}>{simNote}</Text>

        <SectionHeader index="05" title="FLUJO DE CAJA SIMULADO" />
        <View style={styles.cashFlowRow}>
          <View style={[styles.cashCard, { borderColor: colors.success }]}>
            <Text style={styles.cashLabel}>Ingresos</Text>
            <Text style={[styles.cashValue, { color: colors.success }]}>
              ${cashFlow.total_income.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.cashCard, { borderColor: colors.danger }]}>
            <Text style={styles.cashLabel}>Gastos</Text>
            <Text style={[styles.cashValue, { color: colors.danger }]}>
              ${cashFlow.total_expense.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.cashCard, { borderColor: colors.accentCyan }]}>
            <Text style={styles.cashLabel}>Disponible</Text>
            <Text style={[styles.cashValue, { color: colors.accentCyan }]}>
              ${cashFlow.available_balance.toLocaleString()}
            </Text>
          </View>
        </View>

        <SectionHeader index="06" title="TARJETAS SIMULADAS" />
        {cards.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{c.name}</Text>
              <Ionicons name="card" size={20} color={colors.accentCyan} />
            </View>
            <Text style={styles.cardMeta}>
              Disponible: ${c.available_credit?.toLocaleString()} de ${c.credit_limit?.toLocaleString()}
            </Text>
            <Text style={styles.cardSubMeta}>Corte: día {c.cut_off_day} · Pago límite: día {c.payment_due_day}</Text>
          </View>
        ))}

        <SectionHeader index="07" title="METAS DE AHORRO SIMULADAS" />
        {goals.map((g) => (
          <View key={g.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{g.name}</Text>
              <Text style={styles.goalPct}>{g.progress_pct}%</Text>
            </View>
            <Text style={styles.cardMeta}>
              ${g.current_amount?.toLocaleString()} de ${g.target_amount?.toLocaleString()}
            </Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${g.progress_pct}%` }]} />
            </View>
          </View>
        ))}

        <SectionHeader index="08" title="TRANSACCIONES SIMULADAS" />
        {transactions.map((t) => (
          <View key={t.id} style={styles.txRow}>
            <View>
              <Text style={styles.cardTitle}>{t.merchant || t.category}</Text>
              <Text style={styles.cardSubMeta}>{t.category} · {t.source}</Text>
            </View>
            <Text style={[styles.txAmount, { color: t.transaction_type === 'income' ? colors.success : colors.danger }]}>
              {t.transaction_type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Simular nueva transacción</Text>
            <TextInput
              placeholder="Monto (ej. 50000)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              placeholder="Comercio / Origen (ej. Librería, Cine...)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={merchant}
              onChangeText={setMerchant}
            />
            <TextInput
              placeholder="Categoría (ej. Entretenimiento, Educación)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={category}
              onChangeText={setCategory}
            />
            <View style={styles.priorityRow}>
              {['expense', 'income'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.priorityChip, type === t && styles.priorityChipActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.priorityText, type === t && styles.priorityTextActive]}>
                    {t === 'expense' ? 'Gasto (-)' : 'Ingreso (+)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addSimulatedTransaction}>
                <Text style={styles.saveText}>Agregar a la Simulación</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sandboxBadge: { backgroundColor: colors.accentAmber + '25', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.accentAmber },
  sandboxBadgeText: { color: colors.accentAmber, fontSize: 10, fontWeight: '800' },
  simSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 12 },
  cashFlowRow: { flexDirection: 'row', gap: 8 },
  cashCard: { flex: 1, backgroundColor: colors.cardLight, borderRadius: 14, padding: 12, borderWidth: 1 },
  cashLabel: { color: colors.textSecondary, fontSize: 11, marginBottom: 4 },
  cashValue: { fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: colors.cardLight, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  cardMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  cardSubMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  goalPct: { color: colors.accentCyan, fontWeight: '800', fontSize: 13 },
  progressBg: { height: 6, backgroundColor: colors.cardDark, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accentCyan, borderRadius: 3 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.cardLight, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  txAmount: { fontSize: 14, fontWeight: '700' },
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

