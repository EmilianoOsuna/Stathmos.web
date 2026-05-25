# Implementation Plan: Push Notifications

**Branch**: `001-push-notifications` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-push-notifications/spec.md`

## Summary

Implementación de notificaciones push nativas mediante la API Push, Service Workers, y Supabase Edge Functions. Permitirá al usuario registrar sus dispositivos y recibir alertas en segundo plano cuando existan actualizaciones relevantes en el sistema.

## Technical Context

**Language/Version**: JavaScript (ES6+), React 18
**Primary Dependencies**: Vite, vite-plugin-pwa, @supabase/supabase-js, web-push (Edge Function)
**Storage**: Supabase PostgreSQL
**Testing**: Manual Testing (Browser DevTools / Mobile Devices)
**Target Platform**: Web Browsers (PWA on iOS, Android, Desktop)
**Project Type**: Web Application (React SPA)
**Performance Goals**: Entrega de notificación en < 5s.
**Constraints**: Dependencia estricta de HTTPS / localhost y permisos del navegador.
**Scale/Scope**: Múltiples dispositivos por usuario.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] I. Library-First: Se aislará la lógica de la API Push en funciones / hooks reutilizables.
- [x] II. CLI Interface: N/A para interfaces web PWA puras, pero las Edge Functions pueden probarse vía cURL/CLI.
- [x] III. Test-First: Validaremos el registro de SW y llaves VAPID antes de UI complejas.

## Project Structure

### Documentation (this feature)

```text
specs/001-push-notifications/
├── plan.md
├── research.md
├── data-model.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── components/
│   └── InstallPrompt.jsx (Modificado / Integrado con Push)
├── hooks/
│   └── usePushNotifications.js (Nuevo)
├── lib/
│   └── pushUtils.js (Nuevo)
supabase/
├── functions/
│   └── enviar-notificacion/
│       └── index.ts (Actualizado para web-push)
```

**Structure Decision**: El proyecto es una Single Page Application (Opción Web Application) que ya cuenta con `src/components`. Añadiremos hooks y utilerías en `src/hooks` y `src/lib`. El backend recae en `supabase/functions/`.

## Complexity Tracking

N/A - La arquitectura se alinea a los patrones de la web moderna.
