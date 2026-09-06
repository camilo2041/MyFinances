# 💰 MyFinces — Control de finanzas personales

App sencilla para llevar el control de: **ingresos y egresos**, **gastos fijos recurrentes**,
**deudas y cuotas**, y **presupuesto + metas de ahorro**. Moneda: COP.

Stack: **FastAPI + PostgreSQL** (backend, en Docker) · **Next.js 14 + Tailwind** (frontend).
Uso local, un solo usuario, sin login.

---

## Requisitos

- Docker Desktop
- Node.js 18+

## Arranque

**1. Backend + base de datos** (desde la raíz del proyecto):

```bash
docker compose up -d --build
```

- API: http://localhost:8010 · Documentación interactiva: http://localhost:8010/docs
- La primera vez crea las tablas y carga datos de ejemplo (categorías, un salario,
  4 gastos fijos, 1 deuda, 1 meta de ahorro y 3 presupuestos).

**2. Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:3000

## Acceso

La app tiene login y roles. Al arrancar por primera vez se crean:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@myfinces.local` | `admin1234` |
| Usuario (con datos de ejemplo) | `juan@myfinces.local` | `demo1234` |

- **Administrador**: entra a **Usuarios** (barra lateral) para crear, editar,
  activar/desactivar y eliminar las personas que manejan sus finanzas. Cada
  usuario nuevo arranca con su propio juego de categorías y sin movimientos.
- **Usuario**: solo ve y gestiona **sus** finanzas; los datos están aislados por cuenta.

Cambia las credenciales y `SECRET_KEY` en `docker-compose.yml` antes de usarlo en serio.

## Empezar de cero (borrar todo)

```bash
docker compose down -v && docker compose up -d
```

Se recrean el admin y el usuario demo. Sin `-v`, los datos existentes se conservan
(al añadir el login, las filas previas se asignan al usuario demo automáticamente).

---

## Módulos

| Pantalla | Qué hace |
|---|---|
| **Resumen** | Hero con el balance del mes, gráfica de ahorro de los últimos 6 meses, anillos de progreso (ingreso libre, meta, deuda), "Ideas para ti" con proyecciones (cuándo saldas la deuda / completas la meta), gastos por categoría y últimos movimientos. Selector de mes arriba a la derecha. |
| **Movimientos** | Registrar/editar/eliminar ingresos y egresos, con categoría, fecha y nota. Filtros y totales del mes. |
| **Gastos fijos** | Arriendo, servicios, suscripciones… con día de pago. Botón "Marcar pagado" que genera el egreso del mes. |
| **Deudas** | Préstamos/tarjetas: monto, tasa, nº de cuotas, valor de cuota, avance. "Registrar cuota" descuenta y (opcional) crea el egreso. Si el mes no alcanza: **plan de rescate** con orden de pago (avalancha), **plan de ahorro para ponerse al día** (crea una meta automáticamente) y **mes libre** para aplazar una cuota (+1 cuota de plazo, calcula el interés extra). Avisa cuando una cuota está vencida. |
| **Presupuesto y metas** | Límite mensual de gasto por categoría (con barra de consumo real) y metas de ahorro con aportes. |

## Estructura

```
myfinces/
├── docker-compose.yml
├── backend/            FastAPI + SQLAlchemy
│   └── app/
│       ├── models.py   tablas
│       ├── schemas.py  validación / respuestas
│       ├── routers/    endpoints por módulo
│       └── seed.py     datos de ejemplo
└── frontend/           Next.js (App Router)
    ├── app/            una carpeta por pantalla
    ├── components/
    └── lib/            cliente HTTP y formato COP
```

## Notas técnicas

- El backend corre en Docker, así que **no necesitas Python instalado**.
- El puerto de la API es **8010** (host) → 8000 (contenedor). Si lo cambias, ajusta
  `frontend/.env.local` (`NEXT_PUBLIC_API_URL`).
- Base de datos Postgres persistida en el volumen `myfinces_db_data`.
- No hay autenticación: pensado para uso personal en tu equipo. No lo expongas a internet tal cual.
