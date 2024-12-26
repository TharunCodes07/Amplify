import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

const Bot = () => {
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
      <Image source={require('../assets/images/bot3.png')} style={styles.image} resizeMethod="auto" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 3,
    left: -40,
  },
  image: {
    width: 200,
    height: 200,
  },
});

export default Bot; 