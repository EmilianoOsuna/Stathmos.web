# Implementation Plan: Sincronización y Aislamiento de Notificaciones Push por Rol (Role-Based Notifications)

**Branch**: `005-role-notifications` | **Date**: 2026-05-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-role-notifications/spec.md`

## Summary

Implementar un aislamiento robusto de notificaciones push de navegador (Web Push) para evitar la filtración de alertas entre distintos roles (Administrador, Mecánico, Cliente) en un mismo navegador/dispositivo.
El plan de diseño técnico consta de:
1. **Unicidad de endpoints**: Modificar `usePushNotifications.js` para buscar y remover cualquier registro en `push_subscriptions` que contenga el mismo endpoint de navegador antes de registrar un nuevo usuario.
2. **Cierre de sesión seguro**: Modificar `handleLogout` en `App.jsx` para realizar la baja de la suscripción push del navegador de forma asíncrona antes de invalidar la sesión del usuario.
3. **Validación de roles en Edge Function**: Añadir validación de roles en la Edge Function `enviar-notificacion` para descartar envíos automáticos si el destinatario no cumple con el rol requerido.
4. **Matriz de Notificaciones Extendida**: Registrar e implementar las reglas de validación para las nuevas notificaciones recomendadas del mercado en `enviar-notificacion/index.ts` (ej. "Cotización aceptada/rechazada", "Refacciones disponibles", "Cita confirmada/rechazada", "Presupuesto disponible", "Vehículo listo para entrega").

## Technical Context

**Language/Version**: JavaScript (React 19+, Vite, Deno for Edge Functions)  
**Primary Dependencies**: `@supabase/supabase-js`, `web-push`  
**Storage**: Supabase (PostgreSQL)  
**Testing**: Manual push notification simulator, browser DevTools  
**Target Platform**: Web browsers (supporting Service Workers and Push API)  
**Project Type**: SPA Web Application  
**Performance Goals**: Desvinculación de token en logout en < 1.5 segundos  
**Constraints**: RLS transparente, evitar tokens duplicados por navegador  
**Scale/Scope**: 1 Custom Hook, 1 shell de aplicación (`App.jsx`), 1 Edge Function

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Core Principles Alignment**: La solución propuesta respeta la simplicidad y el enfoque de reutilización de código. No añade servicios de terceros innecesarios ni complejiza el flujo de autenticación existente.
- **Complexity Gates**: No se introduce complejidad injustificada.

**Status**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/005-role-notifications/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── quickstart.md        # Phase 1 output
```

### Source Code (repository root)

```text
src/
├── hooks/
│   └── usePushNotifications.js   # Registro de token y limpieza de duplicados
├── App.jsx                       # Limpieza de token en handleLogout
└── sw.js                         # Service Worker para recibir notificaciones

supabase/
└── functions/
    └── enviar-notificacion/
        └── index.ts              # Validación de roles previa al envío push
```

**Structure Decision**: Se mantiene la estructura modular existente de la aplicación React SPA y la carpeta de Edge Functions en `supabase/functions/`.

## Complexity Tracking

*No violations identified. Architecture remains simple and compliant.*

