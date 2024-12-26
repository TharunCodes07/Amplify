import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

const BotRecording = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: floatAnim }] }]}>
      <Image source={require('../assets/images/bot3.png')} style={styles.image} />
      <View style={styles.soundWaveContainer}>
        <View style={styles.wave} />
        <View style={styles.wave} />
        <View style={styles.wave} />
      </View>
    </Animated.View>
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
  soundWaveContainer: {
    flexDirection: 'row',
    marginTop: -20,
  },
  wave: {
    width: 10,
    height: 10,
    backgroundColor: '#000',
    borderRadius: 5,
    marginHorizontal: 5,
    opacity: 0.3,
    animation: 'speak 1s infinite',
  },
});

export default BotRecording; 