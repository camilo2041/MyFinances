import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut, FadeOutUp, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Press, T, warn } from '@/components/ui';

import { C, R } from './theme';

// Reemplazo de Alert.alert: hoja inferior con el estilo de la app.
// `onConfirm` corre con la hoja abierta (spinner en el botón); si falla, el
// error se muestra dentro de la hoja en vez de abrir otro popup.

export type AskOptions = {
  title: string;
  message?: string;
  icon?: IconName;
  tone?: 'primary' | 'danger';
  confirmText: string;
  cancelText?: string;
  /** Filas "etiqueta · valor" para resumir lo que se va a hacer. */
  rows?: { label: string; value: string }[];
  onConfirm: () => Promise<unknown> | void;
};

type ToastKind = 'error' | 'ok' | 'info';

let showAsk: ((o: AskOptions) => void) | null = null;
let showToast: ((text: string, kind: ToastKind) => void) | null = null;

export const ask = (o: AskOptions) => showAsk?.(o);
export const toast = (text: string, kind: ToastKind = 'info') => showToast?.(text, kind);

function Sheet({ opts, onClose }: { opts: AskOptions; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const danger = opts.tone === 'danger';
  const tint = danger ? C.expense : C.glow;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!busy) onClose();
      return true;
    });
    return () => sub.remove();
  }, [busy, onClose]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await opts.onConfirm();
      onClose();
    } catch (e: any) {
      warn();
      setError(e?.message ?? 'Algo salió mal');
      setBusy(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={busy ? undefined : onClose} />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.springify().damping(20).stiffness(220)}
        exiting={SlideOutDown.duration(180)}
        style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grip} />
        <View style={styles.head}>
          <View style={[styles.badge, { backgroundColor: tint + '22', borderColor: tint + '66' }]}>
            <Icon name={opts.icon ?? (danger ? 'alert' : 'check')} size={20} color={tint} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <T size={19} weight="bold" style={{ letterSpacing: -0.4 }}>
              {opts.title}
            </T>
            {opts.message && (
              <T size={14} color={C.textDim} style={{ lineHeight: 20 }}>
                {opts.message}
              </T>
            )}
          </View>
        </View>

        {opts.rows && opts.rows.length > 0 && (
          <View style={styles.rows}>
            {opts.rows.map((r, i) => (
              <View key={r.label} style={[styles.row, i > 0 && styles.rowDivider]}>
                <T size={13} color={C.textMute}>
                  {r.label}
                </T>
                <T mono weight="semi" size={14}>
                  {r.value}
                </T>
              </View>
            ))}
          </View>
        )}

        {error && (
          <Animated.View entering={FadeIn} style={styles.error}>
            <Icon name="alert" size={16} color={C.expense} />
            <T size={13} color={C.expense} style={{ flex: 1 }}>
              {error}
            </T>
          </Animated.View>
        )}

        <View style={styles.actions}>
          <Press onPress={busy ? undefined : onClose} style={[styles.btn, styles.btnGhost]}>
            <T weight="semi" color={C.textDim}>
              {opts.cancelText ?? 'Cancelar'}
            </T>
          </Press>
          <Press onPress={busy ? undefined : confirm} style={[styles.btn, { flex: 1.4, backgroundColor: danger ? C.expense : C.accent }]}>
            {busy ? (
              <ActivityIndicator color={danger ? '#fff' : C.onAccent} />
            ) : (
              <T weight="semi" color={danger ? '#fff' : C.onAccent}>
                {opts.confirmText}
              </T>
            )}
          </Press>
        </View>
      </Animated.View>
    </View>
  );
}

const TOAST_ICON: Record<ToastKind, IconName> = { error: 'alert', ok: 'check', info: 'bell' };

export function DialogLayer() {
  const insets = useSafeAreaInsets();
  const [opts, setOpts] = useState<(AskOptions & { id: number }) | null>(null);
  const [t, setT] = useState<{ text: string; kind: ToastKind; id: number } | null>(null);

  useEffect(() => {
    showAsk = (o) => setOpts({ ...o, id: Date.now() });
    showToast = (text, kind) => setT({ text, kind, id: Date.now() });
    return () => {
      showAsk = null;
      showToast = null;
    };
  }, []);

  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT(null), t.kind === 'error' ? 3800 : 2400);
    return () => clearTimeout(h);
  }, [t]);

  const col = t?.kind === 'error' ? C.expense : t?.kind === 'ok' ? C.income : C.glow;

  return (
    <>
      {opts && <Sheet key={opts.id} opts={opts} onClose={() => setOpts(null)} />}
      {t && (
        <Animated.View
          key={t.id}
          pointerEvents="box-none"
          entering={FadeInUp.springify().damping(18)}
          exiting={FadeOutUp.duration(180)}
          style={[styles.toastWrap, { top: insets.top + 8 }]}>
          <Pressable onPress={() => setT(null)} style={[styles.toast, { borderColor: col + '66' }]}>
            <View style={[styles.toastDot, { backgroundColor: col + '22' }]}>
              <Icon name={TOAST_ICON[t.kind]} size={15} color={col} strokeWidth={2.2} />
            </View>
            <T size={14} weight="medium" style={{ flexShrink: 1 }}>
              {t.text}
            </T>
          </Pressable>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: C.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.surface,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, marginBottom: 18 },
  head: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  badge: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rows: { marginTop: 18, backgroundColor: C.bg, borderRadius: R.md, paddingHorizontal: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, backgroundColor: C.expenseSoft, borderRadius: R.sm, padding: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  btn: { flex: 1, height: 52, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: C.raised },
  toastWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.raised,
    borderWidth: 1,
    borderRadius: R.full,
    paddingLeft: 8,
    paddingRight: 18,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  toastDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
