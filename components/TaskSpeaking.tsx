import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

const BotSpeaking = () => {
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.stagger(150, [
      createAnimation(waveAnim1),
      createAnimation(waveAnim2),
      createAnimation(waveAnim3),
    ]).start();
  }, [waveAnim1, waveAnim2, waveAnim3]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/bot3.png')} style={styles.image} />
      <View style={styles.waveContainer}>
        <Animated.View style={[styles.wave, { transform: [{ scaleY: waveAnim1 }] }]} />
        <Animated.View style={[styles.wave, { transform: [{ scaleY: waveAnim2 }] }]} />
        <Animated.View style={[styles.wave, { transform: [{ scaleY: waveAnim3 }] }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  waveContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 20,
    marginTop: 5,
  },
  wave: {
    width: 3,
    height: 20,
    backgroundColor: '#4A90E2',
    marginHorizontal: 2,
  },
});

export default BotSpeaking;

