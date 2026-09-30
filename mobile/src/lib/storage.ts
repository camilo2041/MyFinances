import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore en el teléfono; localStorage solo para la vista previa web.
const web = Platform.OS === 'web';

export const storage = {
  get: (k: string) => (web ? Promise.resolve(localStorage.getItem(k)) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (web ? Promise.resolve(localStorage.setItem(k, v)) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (web ? Promise.resolve(localStorage.removeItem(k)) : SecureStore.deleteItemAsync(k)),
};
