import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { api, clearCache, loadToken, setToken, setUnauthorizedHandler, type User } from './api';
import { forgetIfNoBio, getCreds, isBioEnabled, rememberLogin, verify } from './biometric';
import { clearReminders } from './notify';

// Si la app pasa más de este tiempo en segundo plano, se vuelve a bloquear.
const RELOCK_MS = 2 * 60 * 1000;

type Ctx = {
  user: User | null;
  ready: boolean;
  /** Sesión abierta pero bloqueada hasta verificar huella / rostro. */
  locked: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithBio: () => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<void>;
  unlock: () => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>(null as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const bgSince = useRef<number | null>(null);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    (async () => {
      try {
        if (await loadToken()) {
          if (await isBioEnabled()) setLocked(true);
          setUser(await api<User>('/auth/me'));
        }
      } catch {
        // Sin red: si hay token lo dejamos; la próxima petición decidirá.
      } finally {
        setReady(true);
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, []);

  // Rebloqueo al volver de segundo plano.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (s) => {
      if (s === 'background') bgSince.current = Date.now();
      if (s === 'active' && bgSince.current) {
        const away = Date.now() - bgSince.current;
        bgSince.current = null;
        if (away > RELOCK_MS && user && (await isBioEnabled())) setLocked(true);
      }
    });
    return () => sub.remove();
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await setToken(r.access_token);
    await rememberLogin(email, password);
    setLocked(false);
    setUser(r.user);
  }, []);

  const loginWithBio = useCallback(async () => {
    const creds = await getCreds();
    if (!creds || !(await verify('Entra a MyFinces'))) return false;
    await login(creds.email, creds.password);
    return true;
  }, [login]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const r = await api<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    await setToken(r.access_token);
    await rememberLogin(email, password);
    setUser(r.user);
  }, []);

  const unlock = useCallback(async () => {
    const ok = await verify('Desbloquea MyFinces');
    if (ok) setLocked(false);
    return ok;
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    await clearReminders();
    await forgetIfNoBio();
    clearCache();
    setLocked(false);
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, ready, locked, login, loginWithBio, register, unlock, logout }}>{children}</AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
