import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, GlobalStyles } from '../constants/Colors';

interface TabBarButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export const TabBarButton: React.FC<TabBarButtonProps> = ({ icon, label, isActive, onPress }) => (
  <TouchableOpacity style={[styles.tabButton, isActive && styles.activeTabButton]} onPress={onPress}>
    <Ionicons name={icon} size={24} color={isActive ? COLORS.primary : COLORS.textTertiary} />
    <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  tabButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
  },
  tabLabel: {
    ...GlobalStyles.text,
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  activeTabLabel: {
    ...GlobalStyles.boldText,
    color: COLORS.primary,
  },
});

