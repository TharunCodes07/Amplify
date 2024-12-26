import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

const BotSpeaking = () => {
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [waveAnim]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/bot.png')} style={styles.image} />
      <View style={styles.speechBubble}>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.speechTail} />
      </View>
      <Animated.View style={[styles.soundWave, { opacity: waveAnim }]}>
        <View style={styles.wave} />
        <View style={styles.wave} />
        <View style={styles.wave} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 3,
    left: -40,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
  speechBubble: {
    position: 'absolute',
    top: -40,
    left: 50,
    width: 120,
    height: 60,
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.2)',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    backgroundColor: '#000',
    borderRadius: 5,
    opacity: 0.3,
    animation: 'speak 1s infinite',
  },
  speechTail: {
    position: 'absolute',
    bottom: -10,
    left: 20,
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    transform: [{ rotate: '45deg' }],
  },
  soundWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    width: 10,
    height: 10,
    backgroundColor: '#000',
    borderRadius: 5,
    marginHorizontal: 5,
    opacity: 0.3,
  },
});

export default BotSpeaking; 