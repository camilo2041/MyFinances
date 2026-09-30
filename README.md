# 💰 MyFinces — Control de finanzas personales

App sencilla para llevar el control de: **ingresos y egresos**, **gastos fijos recurrentes**,
**deudas y cuotas**, y **presupuesto + metas de ahorro**. Moneda: COP.

Stack: **FastAPI + PostgreSQL** (backend) · **Next.js 14 + Tailwind** (frontend).
Login con roles (admin / usuario), datos aislados por cuenta.

`docker-compose.yml` está configurado para **producción detrás de Traefik**. Para
desarrollo local usa `docker-compose.override.yml` (ver abajo).

---

## Desarrollo local

Requisitos: Docker Desktop y Node.js 18+.

```bash
# una sola vez
docker network create traefik-net
cp docker-compose.override.yml.example docker-compose.override.yml
cp .env.example .env      # ajusta si quieres; los valores por defecto sirven en local

# base de datos + API (puerto 8010, con --reload)
docker compose up -d

# frontend con hot-reload
cd frontend && npm install && npm run dev
```

- App: http://localhost:3000 · API: http://localhost:8010 · Docs: http://localhost:8010/docs
- El override crea el usuario de ejemplo `juan@myfinces.local` / `demo1234` con datos precargados.
- Para levantar el frontend también en contenedor: `docker compose --profile web up -d`

## Producción (Traefik)

Requiere un Traefik ya corriendo con la red externa `traefik-net` (otro nombre:
define `TRAEFIK_NETWORK` en el `.env`) y un
`certresolver` (ACME/Let's Encrypt). En el servidor:

```bash
git clone <repo> && cd myfinces
cp .env.example .env      # RELLENA todo: DOMAIN, SECRET_KEY, contraseñas…
# NO crees docker-compose.override.yml en el servidor
docker compose up -d --build
```

- Traefik enruta `https://$DOMAIN` → frontend y `https://$DOMAIN/api` → API
  (quita el prefijo `/api` con un middleware `stripprefix`).
- `SECRET_KEY`, `POSTGRES_PASSWORD` y `ADMIN_PASSWORD` son **obligatorias**:
  si faltan, `docker compose` no arranca.
- Deja `DEMO_EMAIL` / `DEMO_PASSWORD` vacías para no crear datos de ejemplo.
- Postgres persiste en el volumen `myfinces_db_data`.
- `NEXT_PUBLIC_API_URL` se hornea en el build del frontend (`https://$DOMAIN/api`
  por defecto); si cambias el dominio, reconstruye la imagen `web`.

## Acceso

En el primer arranque se crea la cuenta **administrador** (email y contraseña
salen de `ADMIN_EMAIL` / `ADMIN_PASSWORD` en `.env`; en local por defecto
`admin@myfinces.local` / `admin1234`). En local, el override además crea
`juan@myfinces.local` / `demo1234` con datos de ejemplo.

- **Administrador**: entra a **Usuarios** (barra lateral) para crear, editar,
  activar/desactivar y eliminar las personas que manejan sus finanzas. Cada
  usuario nuevo arranca con su propio juego de categorías y sin movimientos.
- **Usuario**: solo ve y gestiona **sus** finanzas; los datos están aislados por cuenta.

## Empezar de cero (borrar todo)

```bash
docker compose down -v && docker compose up -d
```

Con `-v` se borra el volumen `myfinces_db_data`. Sin `-v`, los datos se conservan.

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
