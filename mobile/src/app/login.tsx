import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, Kicker, Press, T, warn } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { isStrongPassword, PASSWORD_RULES } from '@/lib/password';
import { bioAvailable, bioLabel, consumeSkipAutoPrompt, getCreds, getLastEmail, isBioEnabled, type BioKind } from '@/lib/biometric';
import { C, F, R } from '@/lib/theme';

type Mode = 'login' | 'register';

export default function Login() {
  const { login, loginWithBio, register } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bio, setBio] = useState<BioKind>(null);

  // Correo recordado + ¿puede entrar con huella / rostro?
  useEffect(() => {
    (async () => {
      const last = await getLastEmail();
      if (last) setEmail(last);
      const [kind, on, creds] = await Promise.all([bioAvailable(), isBioEnabled(), getCreds()]);
      if (kind && on && creds) {
        setBio(kind);
        if (!consumeSkipAutoPrompt()) setTimeout(() => loginWithBio().catch(() => {}), 400);
      }
    })();
  }, [loginWithBio]);

  const bioLogin = async () => {
    setError(null);
    try {
      await loginWithBio();
    } catch (e: any) {
      warn();
      setError(e.message === 'Error 401' ? 'Tu contraseña cambió: entra con la nueva' : e.message);
    }
  };

  const isRegister = mode === 'register';
  const ready = isRegister ? name.trim().length >= 2 && !!email && isStrongPassword(password) : !!email && !!password;

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError(null);
  };

  const submit = async () => {
    if (!ready) return;
    if (isRegister && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      warn();
      return setError('Escribe un correo válido');
    }
    setBusy(true);
    setError(null);
    try {
      if (isRegister) await register(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
    } catch (e: any) {
      warn();
      setError(e.message === 'Error 401' ? 'Correo o contraseña incorrectos' : e.message === 'Error 422' ? 'Revisa tu nombre y tu correo' : e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Resplandor índigo de fondo */}
      <LinearGradient colors={[C.loginGlow, C.bg]} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.6, y: 0.65 }} />
      <View style={[styles.orb, { top: insets.top + 40 }]} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingTop: insets.top + (isRegister ? 36 : 60), paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={styles.logo}>
            <T size={22} weight="bold">
              m<T size={22} weight="bold" color={C.glow}>+</T>
            </T>
          </View>
          <Kicker color={C.glow}>MyFinces</Kicker>
          {isRegister ? (
            <T size={40} weight="bold" style={styles.hero}>
              Empieza{'\n'}
              <T size={40} weight="bold" color={C.income}>
                en limpio.
              </T>
            </T>
          ) : (
            <T size={44} weight="bold" style={styles.hero}>
              Tu plata,{'\n'}
              <T size={44} weight="bold" color={C.income}>
                en claro.
              </T>
            </T>
          )}
          <T color={C.textDim} style={{ marginTop: 12, lineHeight: 22 }}>
            {isRegister
              ? 'Crea tu cuenta gratis. Arrancas con tus categorías listas y recordatorios antes de cada pago.'
              : 'Lo que entra, lo que sale y lo que viene. Con recordatorios antes de cada pago.'}
          </T>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ gap: 12, marginTop: 32 }}>
          {isRegister && (
            <Animated.View entering={FadeIn.duration(250)}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor={C.textMute}
                autoCapitalize="words"
                autoComplete="name"
                style={styles.input}
              />
            </Animated.View>
          )}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Correo"
            placeholderTextColor={C.textMute}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={isRegister ? 'Crea una contraseña segura' : 'Contraseña'}
            placeholderTextColor={C.textMute}
            secureTextEntry
            autoComplete={isRegister ? 'new-password' : 'password'}
            onSubmitEditing={submit}
            style={styles.input}
          />
          {isRegister && password.length > 0 && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.rules}>
              {PASSWORD_RULES.map((r) => {
                const ok = r.test(password);
                return (
                  <View key={r.label} style={styles.rule}>
                    <View style={[styles.ruleDot, ok && { backgroundColor: C.income, borderColor: C.income }]}>
                      {ok && <Icon name="check" size={10} color={C.bg} strokeWidth={3.2} />}
                    </View>
                    <T size={12.5} color={ok ? C.text : C.textMute}>
                      {r.label}
                    </T>
                  </View>
                );
              })}
            </Animated.View>
          )}
          {error && (
            <T size={13} color={C.expense}>
              {error}
            </T>
          )}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <Button title={isRegister ? 'Crear cuenta' : 'Entrar'} onPress={submit} loading={busy} disabled={!ready} style={{ flex: 1 }} />
            {!isRegister && bio && (
              <Press onPress={bioLogin} style={styles.bioBtn} scaleTo={0.9} accessibilityLabel={`Entrar con ${bioLabel(bio)}`}>
                <Icon name={bio === 'face' ? 'face' : 'fingerprint'} size={26} color={C.text} strokeWidth={1.7} />
              </Press>
            )}
          </View>

          <Press onPress={switchMode} style={styles.switch} scaleTo={0.97}>
            <T size={14} color={C.textDim}>
              {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
              <T size={14} weight="semi" color={C.glow}>
                {isRegister ? 'Entrar' : 'Crear cuenta'}
              </T>
            </T>
          </Press>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  orb: { position: 'absolute', right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: C.brand, opacity: 0.18 },
  logo: { width: 52, height: 52, borderRadius: 18, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  hero: { letterSpacing: -2, lineHeight: 46, marginTop: 6 },
  input: { height: 56, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, paddingHorizontal: 18, color: C.text, fontFamily: F.medium, fontSize: 16 },
  switch: { alignItems: 'center', paddingVertical: 12 },
  rules: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 14, paddingHorizontal: 4 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  bioBtn: { width: 54, height: 54, borderRadius: R.lg, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
});
