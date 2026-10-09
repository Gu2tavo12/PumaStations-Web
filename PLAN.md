# Plan: Puma Estaciones Web (Gerente General)

Versión web de la app de iOS `PumaStations`, limitada al rol **Gerente General**: todo lo que ve, maneja y administra. Usa TypeScript, React y shadcn/ui, y mantiene la estética de la app de iOS.

## Decisión de arquitectura: un solo proyecto frontend

**El backend ya existe: es Supabase.** La app de iOS no tiene un servidor propio. Habla directo con Supabase Auth, con PostgREST y con la RPC `save_manager`, y la seguridad vive en la base de datos (RLS): el gerente general ve todo y solo él crea gerentes o sucursales.

Por eso la web es una **SPA (Vite + React + TS) que usa `@supabase/supabase-js` directamente**, igual que iOS.

| Opción | Veredicto |
|---|---|
| **SPA + Supabase (elegida)** | Reusa el mismo backend, las mismas políticas y los mismos datos que iOS. Sin servidores que mantener. Se despliega como sitio estático. |
| Back separado (Node o Express) | Duplica lo que ya hacen RLS y las RPC, y deja dos fuentes de verdad de seguridad. Solo tendría sentido con integraciones de terceros o secretos del lado del servidor. |
| Next.js fullstack | SSR y SEO no aportan nada en un panel interno detrás de un login. |

Si hace falta lógica en el servidor, se agrega como **función SQL o RPC en Supabase**, para que la aprovechen iOS y la web.

## Alcance (paridad con `GeneralTabView` de iOS)

1. **Dashboard** (`GeneralDashboardView` + `DashboardCalculator`)
   - Filtros: alcance (todo el país o una sucursal), periodo (Hoy, Semana, Mes, Año o Rango) y combustible.
   - KPI de ventas: comparación con el periodo anterior, volumen vendido y margen bruto.
   - Alertas de reabastecimiento.
   - Matriz de tanques por sucursal, o los tanques de una sucursal si se filtra por una.
   - Gráfica apilada por combustible.
   - Tabla por combustible y tabla por sucursal.
   - Compras recibidas y pérdidas.
2. **Sucursales**
   - Lista con búsqueda y tarjetas de resumen.
   - **Nueva sucursal**: crea las 6 bombas, fija las capacidades y permite vincular un gerente libre.
   - **Detalle de estación** (solo lectura):
     - Banner, tanques, KPI y consumo.
     - Cortes de hoy, últimas pérdidas e historial.
     - **Reporte de corte**.
3. **Gerentes**
   - Lista con filtro (Todos, Vinculados o Sin sucursal) y búsqueda.
   - Formulario de alta o edición con vínculo a sucursal, mediante la RPC `save_manager`.
4. **Perfil**: datos del usuario y cerrar sesión.

### Reglas de negocio a portar tal cual

- `TankStatus.evaluate`:
  - Crítico: menos del 20 % o menos de 1.5 días.
  - Medio: menos del 40 % o menos de 3 días.
  - Óptimo: el resto.
- Promedio de venta de los últimos 7 días.
- Pedido sugerido para llevar el tanque al 85 %, redondeado hacia abajo a múltiplos de 500 gal.
- Solo cuentan los cortes **cerrados**. Margen bruto = ventas − compras − pérdidas (a costo).
- Buckets de la gráfica según la longitud del rango:
  - 1 día o menos: por corte.
  - 8 días o menos: por día.
  - 62 días o menos: por semana.
  - Más: por mes.
- La semana empieza en lunes. Zona horaria `America/El_Salvador`.
- Fecha de referencia de un corte: el día a las 10:00 (matutino) o a las 18:00 (vespertino).

## Stack

| Capa | Elección |
|---|---|
| Build | Vite 8 + React 19 + TypeScript 6 (strict) |
| UI | Tailwind v4 + shadcn/ui (Radix, preset Nova) + lucide-react |
| Datos | `@supabase/supabase-js` + TanStack Query |
| Rutas | React Router |
| Formularios | react-hook-form + zod |
| Gráficas | Recharts mediante el componente Chart de shadcn |
| Fechas | date-fns + `@date-fns/tz` (locale `es`) |
| Tema | `ThemeProvider` propio (claro, oscuro o del sistema), sin dependencias |
| Calidad | oxlint + Vitest |

> `tsconfig` usa `erasableSyntaxOnly`: no se usan `enum` de TS. Los enums de Swift se modelan como uniones de strings y objetos `as const`.

## Estructura

```
src/
├── lib/            supabase.ts, env.ts, database.types.ts, format.ts, utils.ts
├── domain/         port 1:1 de Models + Services (TS puro, con pruebas)
├── api/            queries y mutations (TanStack Query) por recurso
├── components/
│   ├── ui/         shadcn
│   └── puma/       StatTile, Pill, TankLevelRow, TankMatrixCard, SalesKPICard…
├── features/       auth, dashboard, branches, managers, profile
└── app/            router, providers, layout (sidebar), guard de rol
```

## Estética (de `Theme.swift`)

| Token | Claro | Oscuro |
|---|---|---|
| `brand-green` (primario) | `#00773B` | `#34B86B` |
| `brand-red` (destructivo) | `#D0021B` | `#FF5A67` |
| `diesel-gray` | `#48484D` | `#BDBDC2` |
| `warning-amber` | `#A35F00` | `#F2A93B` |
| fondo de pantalla | `#F2F2F7` | `#000000` |
| tarjeta | `#FFFFFF` | `#1C1C1E` |

- Tarjetas con radio de 16 px y botones con radio de 14 px. Tipografía del sistema (SF Pro en Apple).
- **Pill**: texto del color con fondo de ese color al 14 % de opacidad. **IconSquare** e **InitialsAvatar** usan el mismo patrón.
- Combustibles: Diésel en gris, Regular en verde y Súper en rojo.
- TabView → Sidebar en escritorio y barra inferior en móvil.
- Sheet → Dialog o Sheet. Picker segmentado → Tabs o ToggleGroup.

## Fases

- [x] **Fase 0: base**
  - Vite, Tailwind, shadcn y alias `@/`.
  - Tokens de color y modo oscuro.
  - Cliente de Supabase con variables de entorno.
  - Tipos de la base de datos.
  - Providers (Query, tema, router y toasts).
  - Vitest.
  - Logo sin el cuadriculado incrustado del PNG original. En modo oscuro va sobre una placa blanca.
- [ ] **Fase 1: autenticación y guard**
  - Login con la estética de `LoginView`.
  - Si el rol no es `generalManager` o la cuenta está inactiva, se cierra la sesión con un mensaje.
  - Layout con sidebar y la página de Perfil.
- [ ] **Fase 2: dominio**
  - Portar `Enums`, `CutModels`, `InventoryCalculator` y `DashboardCalculator` a TS.
  - Pruebas con Vitest sobre los casos del seed.
  - Carga de todas las tablas, como `RemoteSync.signIn`.
- [ ] **Fase 3: Dashboard**
  - Filtros guardados en la URL.
  - Todas las tarjetas.
- [ ] **Fase 4: Sucursales**
  - Lista, nueva sucursal, detalle de estación y reporte de corte.
- [ ] **Fase 5: Gerentes**
  - Lista con filtros.
  - Formulario de alta o edición con `rpc('save_manager')`.
- [ ] **Fase 6: pulido y despliegue**
  - Skeletons, toasts, diseño responsive y accesibilidad.
  - Despliegue en Vercel o Netlify.
  - Agregar el dominio en Supabase → Auth → URL Configuration.

## Mejoras opcionales en Supabase (no rompen iOS)

- RPC `create_branch` transaccional para insertar la sucursal y sus 6 bombas de una vez.
- Supabase Realtime sobre `sales_cuts` y `branches` para refrescar el dashboard en vivo.
- Si el volumen crece, mover las métricas a una RPC `dashboard_metrics(start, end, branch)`.
