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

- [ ] T001 Preparar `vite.config.js` para asegurar que el Service Worker permite inyección de lógica (modo `injectManifest` o similar si es requerido para la Push API).
- [ ] T002 [P] Crear el archivo base para las utilerías del cliente en `src/lib/pushUtils.js`.
- [ ] T003 [P] Crear el archivo base para el hook en `src/hooks/usePushNotifications.js`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Crear la tabla `push_subscriptions` en Supabase (ejecutando script SQL desde dashboard o CLI) de acuerdo a `data-model.md`.
- [ ] T005 [P] Configurar las políticas RLS (Row Level Security) para `push_subscriptions` (Select, Insert, Delete).
- [ ] T006 Generar el par de llaves VAPID públicas y privadas. Añadir la llave pública al `.env` del frontend y ambas al entorno de Supabase Edge Functions.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Opt-in a Notificaciones Push (Priority: P1) 🎯 MVP

**Goal**: Permitir al usuario aceptar las notificaciones push nativas y almacenar su suscripción en Supabase.

**Independent Test**: Al presionar el botón de suscripción, el navegador debe pedir permisos, generar el objeto `PushSubscription` y la base de datos debe reflejar un nuevo registro en `push_subscriptions`.

### Implementation for User Story 1

- [ ] T007 [P] [US1] Implementar la función de conversión VAPID (`urlBase64ToUint8Array`) en `src/lib/pushUtils.js`.
- [ ] T008 [US1] Implementar la lógica del ServiceWorker `pushManager.subscribe()` usando la llave pública dentro de `src/hooks/usePushNotifications.js`.
- [ ] T009 [US1] Implementar la función en `usePushNotifications.js` que inserta la suscripción generada en la tabla `push_subscriptions` usando `@supabase/supabase-js`.
- [ ] T010 [US1] Actualizar la UI (puede ser dentro de `src/components/InstallPrompt.jsx` o en la configuración de usuario) para invocar el hook y renderizar el botón de "Activar Notificaciones".

**Checkpoint**: At this point, User Story 1 should be fully functional y capaz de registrar dispositivos en la DB.

---

## Phase 4: User Story 2 - Recepción de Notificación en Segundo Plano (Priority: P2)

**Goal**: Enviar notificaciones desde el backend y recibirlas nativamente en el dispositivo usando Service Workers.

**Independent Test**: Invocar manualmente la Edge Function y verificar que la alerta push aparezca en el sistema operativo.

### Implementation for User Story 2

- [ ] T011 [P] [US2] Modificar el Service Worker generado o inyectado para añadir los event listeners de `push` y `notificationclick`.
- [ ] T012 [P] [US2] Añadir y configurar la librería `web-push` en `supabase/functions/enviar-notificacion/index.ts` (u otra Edge function dedicada si prefieren separarlo).
- [ ] T013 [US2] Modificar la lógica de la Edge Function para buscar las suscripciones en `push_subscriptions` del usuario destino.
- [ ] T014 [US2] Enviar los payloads push utilizando la llave VAPID privada para cada suscripción encontrada.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T015 [P] Mejorar el manejo de errores en caso de que el usuario bloquee los permisos manualmente después de haberlos dado.
- [ ] T016 Manejar el evento de des-suscripción (limpiar `push_subscriptions` de la DB si `pushManager.getSubscription()` retorna null o el backend detecta error HTTP 410 Gone de Google/Apple).

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
