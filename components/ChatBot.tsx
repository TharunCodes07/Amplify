import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';

interface ChatBotProps {
  isRecording: boolean;
  isSpeaking: boolean;
}

export const ChatBot: React.FC<ChatBotProps> = ({ isRecording, isSpeaking }) => (
  <View style={styles.botContainer}>
    <Ionicons
      name={isRecording ? 'mic' : isSpeaking ? 'volume-high' : 'chatbubble-ellipses'}
      size={24}
      color={COLORS.text}
    />
  </View>
);

const styles = StyleSheet.create({
  botContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

