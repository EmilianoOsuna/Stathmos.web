# Implementation Plan: Corrección en Gestión de Citas y Manejo de Sesión/Realtime (Citas and Auth Fixes)

**Branch**: `006-citas-fix` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-citas-fix/spec.md`

## Summary

Corregir múltiples errores y comportamientos inesperados en el flujo de gestión de citas, el ciclo de vida de la autenticación de Supabase (errores 401 en la Edge Function y 403 en el cierre de sesión) y las advertencias de conexión de tiempo real (`CHANNEL_ERROR`).
El diseño técnico consta de:
1. **Flujo de UI de Citas**: Detener la propagación de eventos (`e.stopPropagation()`) al hacer clic en los botones de "Aceptar/Rechazar" en la lista de citas de `CitasModule.jsx` para evitar que se abra la ventana modal de detalles.
2. **Cierre de Sesión Seguro**: Envolver `supabase.auth.signOut()` en un bloque `try-catch` dentro de `App.jsx` para evitar bloqueos y forzar la redirección a `/login` aunque el token haya expirado en el servidor (403 Forbidden).
3. **Limpieza de WebSocket en Tiempo Real**: Crear y exportar la función `cleanAllRealtimeChannels()` en `useSupabaseRealtime.js` para dar de baja de forma ordenada todas las suscripciones a canales antes de cerrar sesión en la aplicación, evitando reintentos de conexión fallidos sin credenciales.
4. **Verificación de Tokens en Backend**: Refactorizar `resolver-cita/index.ts` para verificar la identidad y sesión del usuario utilizando una instancia del cliente de Supabase instanciada con el token recibido (cliente anon con cabeceras globales), previniendo fallos de autorización 401 en el servidor.

## Technical Context

**Language/Version**: JavaScript/TypeScript (React 19+, Vite, Deno 1.x para Edge Functions)  
**Primary Dependencies**: `@supabase/supabase-js`  
**Storage**: Supabase (PostgreSQL)  
**Testing**: Manual testing, browser DevTools, Deno local testing  
**Target Platform**: Web browsers  
**Project Type**: SPA Web Application  
**Performance Goals**: Resolución directa de citas en 1 clic; proceso de cierre de sesión con redirección en < 2 segundos.  
**Constraints**: Controlar la expiración de tokens sin romper el flujo de la aplicación; limpieza proactiva de WebSocket en transiciones de estado de sesión.  
**Scale/Scope**: 1 módulo (`CitasModule.jsx`), 1 shell principal (`App.jsx`), 1 hook (`useSupabaseRealtime.js`), 1 Edge Function (`resolver-cita/index.ts`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Core Principles Alignment**: La solución proposta es directa, modular y respeta la arquitectura actual del proyecto. Corrige fugas de comportamiento (bubbling) y optimiza el ciclo de vida de las conexiones sin añadir dependencias externas.
- **Complexity Gates**: No se añade ninguna complejidad innecesaria ni sobre-ingeniería en las interfaces.

**Status**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/006-citas-fix/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── contracts/
    └── resolver-cita-contract.md # API interface contract for Edge Function
```

### Source Code (repository root)

```text
src/
├── hooks/
│   └── useSupabaseRealtime.js    # Definición de limpieza global de canales
├── components/
│   └── CitasModule.jsx           # Detener bubbling en botones directos de citas
└── App.jsx                       # Limpieza de WebSocket y try/catch en signOut

supabase/
└── functions/
    └── resolver-cita/
        └── index.ts              # Robustez en autenticación de token JWT
```

**Structure Decision**: Se mantiene la estructura existente del código React del cliente y la configuración del backend serverless de Supabase.

## Complexity Tracking

*No violations identified. Architecture remains simple, lightweight, and aligned with standard React + Supabase patterns.*

