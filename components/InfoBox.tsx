import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, GlobalStyles } from '../constants/Colors';

interface InfoBoxProps {
  icon: string;
  value: number | string;
  label: string;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ icon, value, label }) => (
  <View style={styles.infoBox}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={styles.infoValue}>{value}</Text>
    <Text style={styles.infoLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  infoBox: {
    alignItems: 'center',
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 8,
    padding: 12,
    width: '30%',
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  infoValue: {
    ...GlobalStyles.boldText,
    fontSize: 18,
    marginBottom: 2,
  },
  infoLabel: {
    ...GlobalStyles.text,
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});

