import { useState, useCallback, useEffect } from 'react';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { askBackendVoice } from '../services/backendService';

// Hook que encapsula grabación de voz (expo-audio) + envío al backend,
// que transcribe (Whisper) Y enruta la petición al agente correcto en un
// solo paso. Úsalo dentro de un componente de React.
export function useVoiceCapture() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (status.granted) {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      }
    })();
  }, []);

  const startRecording = useCallback(async () => {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      throw new Error('Permiso de micrófono denegado.');
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
  }, [recorder]);

  // Devuelve { transcript, reply, routed_agent, action, agent_result }
  const stopRecordingAndAsk = useCallback(async () => {
    await recorder.stop();
    setIsRecording(false);

    const uri = recorder.uri;
    if (!uri) return { transcript: '', reply: '' };

    return askBackendVoice(uri);
  }, [recorder]);

  return { isRecording, startRecording, stopRecordingAndAsk };
}
