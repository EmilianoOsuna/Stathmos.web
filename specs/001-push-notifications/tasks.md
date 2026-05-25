---
description: "Task list for Push Notifications implementation"
---

# Tasks: Push Notifications

**Input**: Design documents from `/specs/001-push-notifications/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Preparar `vite.config.js` para asegurar que el Service Worker permite inyección de lógica (modo `injectManifest` o similar si es requerido para la Push API).
- [x] T002 [P] Crear el archivo base para las utilerías del cliente en `src/lib/pushUtils.js`.
- [x] T003 [P] Crear el archivo base para el hook en `src/hooks/usePushNotifications.js`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Crear la tabla `push_subscriptions` en Supabase (ejecutando script SQL desde dashboard o CLI) de acuerdo a `data-model.md`.
- [x] T005 [P] Configurar las políticas RLS (Row Level Security) para `push_subscriptions` (Select, Insert, Delete).
- [x] T006 Generar el par de llaves VAPID públicas y privadas. Añadir la llave pública al `.env` del frontend y ambas al entorno de Supabase Edge Functions.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Opt-in a Notificaciones Push (Priority: P1) 🎯 MVP

**Goal**: Permitir al usuario aceptar las notificaciones push nativas y almacenar su suscripción en Supabase.

**Independent Test**: Al presionar el botón de suscripción, el navegador debe pedir permisos, generar el objeto `PushSubscription` y la base de datos debe reflejar un nuevo registro en `push_subscriptions`.

### Implementation for User Story 1

- [x] T007 [P] [US1] Implementar la función de conversión VAPID en `src/lib/pushUtils.js`.
- [x] T008 [US1] Implementar la lógica del ServiceWorker `pushManager.subscribe()` usando la llave pública dentro de `src/hooks/usePushNotifications.js`.
- [x] T009 [US1] Implementar la función en `usePushNotifications.js` que inserta la suscripción en la tabla.
- [x] T010 [US1] Actualizar la UI (`src/components/InstallPrompt.jsx` o similar) para integrar el hook y mostrar botones / manejar estados de error o navegador no soportado (degradación elegante).

**Checkpoint**: At this point, User Story 1 should be fully functional y capaz de registrar dispositivos en la DB.

---

## Phase 4: User Story 2 - Recepción de Notificación en Segundo Plano (Priority: P2)

**Goal**: Enviar notificaciones desde el backend y recibirlas nativamente en el dispositivo usando Service Workers.

**Independent Test**: Invocar manualmente la Edge Function y verificar que la alerta push aparezca en el sistema operativo.

### Implementation for User Story 2

- [x] T011 [P] [US2] Modificar el Service Worker (`sw.js`) para añadir los event listeners `push` y `notificationclick` de acuerdo al payload dinámico definido en la especificación.
- [x] T012 [P] [US2] Añadir y configurar `web-push` en las dependencias de la Edge Function (`supabase/functions/enviar-notificacion/index.ts` o la respectiva).
- [x] T013 [US2] Modificar la lógica de la Edge Function para que, al buscar el `usuario_id`, obtenga los objetos `PushSubscription` guardados en la tabla `push_subscriptions`.
- [x] T014 [US2] Enviar los payloads push iterando por todas las suscripciones válidas del usuario utilizando la llave VAPID privada y `web-push`.ara cada suscripción encontrada.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T015 [P] Mejorar el manejo de errores en `usePushNotifications.js` si el usuario bloquea los permisos (ej. guiarlos a reactivarlos o degradación silenciosa).
- [x] T016 Implementar lógica para el evento de des-suscripción (eliminar de DB si `web-push` devuelve un código de error de expiración como 410 o 404).`pushManager.getSubscription()` retorna null o el backend detecta error HTTP 410 Gone de Google/Apple).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- Los archivos base en Setup pueden crearse en paralelo.
- El modelo SQL y las políticas RLS se pueden configurar simultáneamente en Foundational.
- El Service Worker del frontend (T011) y la Edge Function del backend (T012) pueden desarrollarse al mismo tiempo por distintos miembros del equipo en la US2.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirmar que las suscripciones están apareciendo exitosamente en Supabase.
5. Continuar a Phase 4 (US2) para cerrar el ciclo backend-cliente.
