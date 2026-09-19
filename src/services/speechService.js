import * as Speech from 'expo-speech';

// La grabación de voz ahora vive en src/hooks/useVoiceCapture.js
// (expo-audio requiere hooks de React, a diferencia de la antigua expo-av).
// Este archivo solo maneja texto-a-voz (TTS), que no depende de hooks.

export function speak(text) {
  Speech.speak(text, { language: 'es-ES', pitch: 1.05, rate: 0.98 });
}

export function stopSpeaking() {
  Speech.stop();
}
