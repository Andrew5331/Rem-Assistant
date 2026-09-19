import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, TouchableWithoutFeedback, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme';

// Esfera central de Rem: pulsa suavemente en reposo y acelera/brilla
// mientras "escucha" (isListening = true).
export default function OrbCore({ isListening, onPress, size = 220 }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: isListening ? 650 : 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: isListening ? 650 : 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isListening]);

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();
    return () => rotateLoop.stop();
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, isListening ? 1.12 : 1.05] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  const spin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={[styles.wrapper, { width: size * 1.5, height: size * 1.5 }]}>
        <Animated.View
          style={[
            styles.ring,
            {
              width: size * 1.35,
              height: size * 1.35,
              borderRadius: (size * 1.35) / 2,
              transform: [{ rotate: spin }],
              borderColor: isListening ? colors.accentCyan : colors.accent,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.glow,
            {
              width: size * 1.15,
              height: size * 1.15,
              borderRadius: (size * 1.15) / 2,
              opacity: glowOpacity,
              backgroundColor: isListening ? colors.accentCyan : colors.accent,
            },
          ]}
        />
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient
            colors={gradients.orb}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.core, { width: size, height: size, borderRadius: size / 2 }]}
          >
            <Text style={styles.icon}>{isListening ? '🎙️' : '◈'}</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  glow: {
    position: 'absolute',
    shadowColor: '#7B5CFF',
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: { fontSize: 40 },
});
