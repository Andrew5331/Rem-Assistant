import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function ChatBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.remBubble]}>
      <Text style={styles.label}>{isUser ? 'Tú' : 'Rem'}</Text>
      <Text style={styles.text}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: colors.accent + '35',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent + '55',
  },
  remBubble: {
    backgroundColor: colors.cardLight,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 10, color: colors.accentCyan, marginBottom: 4, fontWeight: '700', letterSpacing: 0.5 },
  text: { color: colors.textPrimary, fontSize: 14, lineHeight: 21 },
});

