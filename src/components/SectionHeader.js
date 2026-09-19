import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

export default function SectionHeader({ index, title, right }) {
  return (
    <View style={styles.row}>
      <Text style={typography.label}>{index ? `${index} // ${title}` : title}</Text>
      {right ? <Text style={styles.right}>{right}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 20 },
  right: { color: colors.textSecondary, fontSize: 12 },
});
