# MyFinces — app Android

App nativa (Expo SDK 57 + Expo Router) que consume la misma API que la web
(`https://myfinances.barcam.site/api`). No es un wrapper del sitio: tiene diseño
propio para el móvil.

- **Inicio**: "te queda este mes", anillo de % gastado, lo que viene (fijos y cuotas,
  vencidos en rojo), tendencia de 6 meses, en qué se va la plata, recientes.
- **Libro**: movimientos por día, filtro gasto/ingreso, cambiar de mes. Tocar = editar,
  mantener = eliminar.
- **+** (botón central): registro rápido con teclado numérico propio, categorías y fecha.
- **Pagos**: pagar fijos, pagar cuota o "mes libre" de deudas.
- **Metas**: abonar a metas de ahorro, presupuestos del mes.
- **Ajustes**: notificaciones, cerrar sesión.

## Notificaciones (locales, sin servidor push)

Se reprograman cada vez que la app trae datos, así reflejan lo ya pagado:

| Aviso | Cuándo |
|---|---|
| Faltan N días… (cuotas y fijos) | 7, 5 y/o 3 días antes, 9 a. m. (configurable en Ajustes) |
| Mañana vence… | víspera 7 p. m. (agrupa si vencen varios el mismo día) |
| Hoy vence… (botón "Ver y pagar") | mismo día 8 a. m. |
| Esta semana pagas… | lunes 7:30 a. m., lista de lo que vence en la semana |
| Pagos atrasados | día siguiente 10 a. m. |
| ¿Cómo fue el día? (botón "Anotar gasto") | diario, hora configurable |
| Tu semana en números | domingo 7 p. m. |
| Presupuesto al 80 % / te pasaste | al guardar un gasto que cruza el umbral |
| Arranca un mes nuevo | día 1, 9 a. m. |

Las cuotas de deuda dicen qué número de cuota vence ("Cuota 9 de 24"). Deudas y
gastos fijos se activan por separado.

## Desarrollo

```bash
npm install
npx expo start --web     # vista previa rápida (usa EXPO_PUBLIC_API_URL de .env.local)
npx tsc --noEmit
```

Para apuntar a la API local crea `.env.local` con `EXPO_PUBLIC_API_URL=http://localhost:8010`.
En el teléfono, las notificaciones y SecureStore requieren el APK (no Expo Go web).

## Generar el APK

```bash
eas build -p android --profile preview
```

El perfil `preview` produce un `.apk` instalable directamente; `production` produce un
`.aab` para Google Play. La URL de la API se fija en `eas.json`.
