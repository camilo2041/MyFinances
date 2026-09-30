// Identidad "noche índigo": fondos morados oscuros (algo suavizados para
// descansar la vista), detalles blancos (botones, pestaña activa) y el morado
// de marca en el botón +, el progreso y la tarjeta principal.
// Lavanda = entra, coral = sale.
export const C = {
  bg: '#0e0c1c',
  surface: '#17142c',
  raised: '#211d3d',
  line: '#2c2850',
  lineSoft: '#221e40',

  text: '#f1efff',
  textDim: '#a6a2c8',
  textMute: '#716c98',

  accent: '#f5f5f5', // blanco: el "toque"
  accentDeep: '#d6d6d6',
  accentSoft: '#27225a', // fondo tenue morado para insignias
  glow: '#8b7dff', // morado claro: rótulos y enlaces
  onAccent: '#0a0a0a', // texto/íconos sobre fondo blanco

  // Morado de marca
  brand: '#6d5dfc',
  brandDeep: '#4b3fd1',
  brandGlow: '#8b7dff',

  income: '#a5b4fc', // lavanda: entra
  expense: '#e07a6f', // coral apagado: sale
  expenseSoft: '#3a1a2a',
  warn: '#d9a86a',

  // Superficies especiales
  heroFrom: '#2e2775',
  heroTo: '#17142c',
  heroBorder: '#3a3285',
  tabBar: 'rgba(23,20,44,0.97)',
  scrim: 'rgba(5,4,15,0.72)',
  inset: 'rgba(12,10,29,0.45)',
  hairline: 'rgba(255,255,255,0.08)',
  loginGlow: '#2b2566',
  // Color de las notificaciones de Android.
  notify: '#6d5dfc',
} as const;

// Categorías: tonos apagados de distinto matiz, fáciles de distinguir sin cansar.
export const CAT = ['#8b7dff', '#6fa99a', '#c9a26b', '#c47f86', '#8a9bb0', '#a795bf', '#7fae7a', '#d08f6a', '#6f9fc4', '#b5b07a'];
export const catColor = (id?: number | null) => CAT[Math.abs(id ?? 0) % CAT.length];

export const F = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semi: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const R = { sm: 10, md: 16, lg: 22, xl: 28, full: 999 } as const;
