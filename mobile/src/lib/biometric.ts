import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { storage } from './storage';

// Recordar credenciales + entrar con huella / Face ID.
// La contraseña solo vive en SecureStore (cifrada con el Keystore del teléfono)
// y solo se usa tras una verificación biométrica exitosa.

const EMAIL_KEY = 'myfinces_last_email';
const CREDS_KEY = 'myfinces_creds';
const BIO_KEY = 'myfinces_bio';
const ASKED_KEY = 'myfinces_bio_asked';

export type BioKind = 'face' | 'fingerprint' | 'iris' | null;

/** Qué biometría hay disponible y configurada en el teléfono (null = ninguna). */
export async function bioAvailable(): Promise<BioKind> {
  if (Platform.OS === 'web') return null;
  try {
    if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) return null;
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
    return 'fingerprint';
  } catch {
    return null;
  }
}

export const bioLabel = (k: BioKind) => (k === 'face' ? (Platform.OS === 'ios' ? 'Face ID' : 'rostro') : k === 'iris' ? 'iris' : 'huella');

export async function verify(prompt = 'Confirma que eres tú') {
  const r = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel: 'Usar contraseña',
    disableDeviceFallback: false,
  });
  return r.success;
}

export const getLastEmail = () => storage.get(EMAIL_KEY);

export async function getCreds(): Promise<{ email: string; password: string } | null> {
  try {
    const raw = await storage.get(CREDS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Tras un login con contraseña: recuerda el correo y guarda las credenciales cifradas. */
export async function rememberLogin(email: string, password: string) {
  await storage.set(EMAIL_KEY, email);
  if (Platform.OS === 'web') return; // localStorage no es seguro para contraseñas
  await storage.set(CREDS_KEY, JSON.stringify({ email, password }));
}

export const isBioEnabled = async () => (await storage.get(BIO_KEY)) === '1';
export const setBioEnabled = (on: boolean) => (on ? storage.set(BIO_KEY, '1') : storage.del(BIO_KEY));

/** ¿Ya le ofrecimos activar la biometría? (para preguntar solo una vez). */
export const wasAsked = async () => (await storage.get(ASKED_KEY)) === '1';
export const markAsked = () => storage.set(ASKED_KEY, '1');

/** Al cerrar sesión: si no usa biometría, no dejamos la contraseña guardada. */
export async function forgetIfNoBio() {
  if (!(await isBioEnabled())) await storage.del(CREDS_KEY);
}


// Si el usuario eligió "Entrar con contraseña" en el bloqueo, el login no
// vuelve a lanzar la huella automáticamente.
let skipAuto = false;
export const skipNextAutoPrompt = () => {
  skipAuto = true;
};
export const consumeSkipAutoPrompt = () => {
  const v = skipAuto;
  skipAuto = false;
  return v;
};
