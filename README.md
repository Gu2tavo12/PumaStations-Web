# Puma Estaciones Web: Gerente General

Versión web de la app de iOS [`PumaStations`](../PumaStations), solo para el rol **gerente general**. Usa el mismo proyecto de Supabase que iOS (Auth, tablas, RLS y la RPC `save_manager`), así que no tiene backend propio.

El plan completo y el avance por fases están en [PLAN.md](PLAN.md).

## Requisitos

- Node 20 o superior.
- El proyecto de Supabase ya configurado con `PumaStations/supabase/schema.sql` y `seed.sql`.

## Configurar

```bash
npm install
cp .env.example .env.local
```

En `.env.local` escribe la **Project URL** y la **publishable key** (Settings → API Keys). Son los mismos valores de `Supabase.plist` en iOS. Nunca uses la *secret key*.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Revisa los tipos y compila para producción en `dist/` |
| `npm run lint` | oxlint |
| `npm test` | Pruebas con Vitest |
| `npm run gen:types` | Regenera `src/lib/database.types.ts` (requiere Supabase CLI con el proyecto enlazado) |

## Acceso

Solo entra el **gerente general** activo. Un gerente de sucursal que intente entrar ve un mensaje y se cierra su sesión; RLS en Supabase sigue protegiendo los datos de todos modos. En desarrollo, el login muestra la cuenta de prueba del seed.

## Stack

Vite + React 19 + TypeScript, Tailwind v4 + shadcn/ui, TanStack Query, React Router, react-hook-form + zod, Recharts y date-fns.

## Estructura

```
src/
├── app/         providers, router, sesión (auth), tema y layout
├── api/         descarga de datos desde Supabase (TanStack Query)
├── components/
│   ├── ui/      componentes de shadcn (generados)
│   └── puma/    componentes con la estética de la app de iOS
├── domain/      reglas de negocio portadas de iOS (TS puro, con pruebas)
├── features/    pantallas por sección
└── lib/         cliente de Supabase, variables de entorno, tipos de la BD y formatos
```

Los colores de marca de `Theme.swift` están como tokens en `src/index.css`: `brand-green`, `brand-red`, `diesel-gray`, `warning-amber` y `track`, con sus variantes para modo oscuro. Se usan como clases de Tailwind, por ejemplo `bg-brand-green` o `text-warning-amber`.
