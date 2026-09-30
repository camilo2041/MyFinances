import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, R } from '@/lib/theme';

import { Icon } from './Icon';
import { Press, T, warn } from './ui';

const EXAMPLES = ['"Compré unas papas por 3.500"', '"Ayer gasté 20 mil en taxi"', '"Me pagaron el salario, 2 millones"', '"Pan 4 mil y una gaseosa 3.500"'];

/** Panel de escucha: micrófono pulsante + transcripción en vivo. */
export function VoiceListener({ onResult, onClose }: { onResult: (text: string) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [status, setStatusState] = useState<'starting' | 'listening' | 'error'>('starting');
  const statusRef = useRef(status);
  const setStatus = (s: typeof status) => {
    statusRef.current = s;
    setStatusState(s);
  };
  const [error, setError] = useState('');
  const finalText = useRef('');
  const done = useRef(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.25, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
    (async () => {
      try {
        const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!perm.granted) return fail('Necesito permiso del micrófono para escucharte.');
        if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) return fail('Tu teléfono no tiene reconocimiento de voz disponible.');
        ExpoSpeechRecognitionModule.start({ lang: 'es-CO', interimResults: true, continuous: false, addsPunctuation: false });
      } catch {
        fail('No pude iniciar el micrófono.');
      }
    })();
    return () => {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fail = (msg: string) => {
    warn();
    setError(msg);
    setStatus('error');
  };

  const finish = () => {
    if (done.current) return;
    done.current = true;
    const t = (finalText.current || text).trim();
    if (t) onResult(t);
    else onClose();
  };

  useSpeechRecognitionEvent('start', () => setStatus('listening'));
  useSpeechRecognitionEvent('result', (e) => {
    const t = e.results[0]?.transcript ?? '';
    setText(t);
    if (e.isFinal) finalText.current = t;
  });
  useSpeechRecognitionEvent('end', () => {
    if (statusRef.current !== 'error') finish();
  });
  useSpeechRecognitionEvent('error', (e) => {
    if (e.error === 'aborted') return;
    if (e.error === 'no-speech' || e.error === 'speech-timeout') return fail('No te escuché. Toca el micrófono e inténtalo de nuevo.');
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') return fail('Necesito permiso del micrófono. Actívalo en los ajustes del teléfono.');
    if (e.error === 'language-not-supported') return fail('Tu teléfono no reconoce español. Instala el paquete de voz en español de Google.');
    fail(e.error === 'network' ? 'Sin conexión para reconocer la voz.' : 'No pude entenderte. Intenta de nuevo.');
  });

  const ring = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 1.6 - pulse.value }));

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={[StyleSheet.absoluteFill, styles.root]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <Press onPress={onClose} style={styles.close}>
          <Icon name="close" size={18} color={C.textDim} />
        </Press>

        <T size={13} weight="semi" color={status === 'error' ? C.expense : C.glow} style={{ letterSpacing: 1.4, textTransform: 'uppercase' }}>
          {status === 'error' ? 'Algo salió mal' : status === 'listening' ? 'Te escucho…' : 'Preparando micrófono…'}
        </T>

        <T size={22} weight="bold" style={styles.transcript} numberOfLines={4}>
          {status === 'error' ? error : text || 'Dime qué compraste o recibiste'}
        </T>

        <Press
          onPress={() => {
            if (status === 'error') {
              done.current = false;
              finalText.current = '';
              setText('');
              setStatus('starting');
              ExpoSpeechRecognitionModule.start({ lang: 'es-CO', interimResults: true, continuous: false, addsPunctuation: false });
            } else {
              ExpoSpeechRecognitionModule.stop();
            }
          }}
          style={styles.micWrap}
          scaleTo={0.9}>
          {status === 'listening' && <Animated.View style={[styles.ring, ring]} />}
          <View style={[styles.mic, status === 'error' && { backgroundColor: C.raised }]}>
            <Icon name={status === 'error' ? 'mic' : 'stop'} size={30} color={status === 'error' ? C.text : '#fff'} strokeWidth={2} />
          </View>
        </Press>
        <T size={12.5} color={C.textMute}>
          {status === 'error' ? 'Toca para intentar de nuevo' : 'Toca para terminar'}
        </T>

        {!text && status !== 'error' && (
          <View style={styles.examples}>
            {EXAMPLES.map((e) => (
              <T key={e} size={12.5} color={C.textDim} style={{ textAlign: 'center' }}>
                {e}
              </T>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: 'rgba(5,4,15,0.8)', justifyContent: 'flex-end', zIndex: 40 },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, borderWidth: 1, borderColor: C.line, paddingHorizontal: 24, paddingTop: 28, alignItems: 'center', gap: 14 },
  close: { position: 'absolute', right: 16, top: 16, width: 36, height: 36, borderRadius: 12, backgroundColor: C.raised, alignItems: 'center', justifyContent: 'center' },
  transcript: { textAlign: 'center', minHeight: 60, lineHeight: 30, letterSpacing: -0.4 },
  micWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  ring: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: C.brand },
  mic: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  examples: { gap: 4, marginTop: 6, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.lineSoft, alignSelf: 'stretch' },
});
