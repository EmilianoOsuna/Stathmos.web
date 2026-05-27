# Tasks: Sincronización y Aislamiento de Notificaciones Push por Rol (Role-Based Notifications)

**Input**: Design documents from `/specs/005-role-notifications/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

- [x] T001 Verify project structure and configuration settings in `specs/005-role-notifications/plan.md`
- [x] T002 Verify local environment variables for push notifications (e.g., `VITE_VAPID_PUBLIC_KEY` in `.env`)
- [x] T003 Validate connectivity to Supabase and query the `push_subscriptions` schema structures in SQL Editor



**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Unicidad de Suscripciones por Dispositivo/Navegador (Priority: P1) 🎯 MVP

**Goal**: Evitar duplicados de tokens push en navegadores compartidos, garantizando que un token pertenezca a un único usuario a la vez.

**Independent Test**: Iniciar sesión como Admin y activar push, luego cambiar a Cliente y hacer lo mismo; validar que en la DB el token viejo del Admin se haya borrado.

### Implementation for User Story 1

- [x] T004 [P] [US1] Refactor push registration to delete any existing subscription with the same endpoint URL in `src/hooks/usePushNotifications.js`
- [x] T005 [US1] Add robust error handling and debug console logs during the duplication check in `src/hooks/usePushNotifications.js`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Limpieza de Suscripción al Cerrar Sesión (Priority: P2)

**Goal**: Borrar la suscripción push activa del navegador en la base de datos al dar clic en cerrar sesión.

**Independent Test**: Iniciar sesión y suscribir push, cerrar sesión y comprobar en la base de datos que el token del navegador actual ha sido borrado.

### Implementation for User Story 2

- [x] T006 [P] [US2] Create helper function to retrieve active push subscription endpoint and delete it from `push_subscriptions` in `src/hooks/usePushNotifications.js`
- [x] T007 [US2] Integrate the push subscription delete helper into the `handleLogout` flow in `src/App.jsx` before executing the `signOut()` command

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Validación de Destinatarios y Roles en el Servidor (Priority: P2)

**Goal**: Filtrar y descartar notificaciones push si el rol del destinatario no corresponde con el tipo de mensaje (ej. alertas de citas o cobros dirigidas a un Cliente).

**Independent Test**: Invocar la Edge Function para notificar a un Cliente sobre una nueva cita de taller y validar en consola que la función lo descarta debido a la discrepancia de roles.

### Implementation for User Story 3

- [x] T008 [P] [US3] Add SQL query to fetch user role information from `usuarios` and `roles` tables using the target `usuario_id` in `supabase/functions/enviar-notificacion/index.ts`
- [x] T009 [US3] Add validation logic to verify the user has the required role (e.g. "administrador") before inserting the notification or sending the web-push payload in `supabase/functions/enviar-notificacion/index.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Remediation of Push Sync Gap & Auto-Subscription (Priority: P1)

**Goal**: Asegurar que las suscripciones push de base de datos se sincronicen automáticamente en segundo plano cuando la sesión se inicie y el permiso ya sea 'granted', y separar por usuario el estado de descarte del prompt para que no bloquee otros usuarios en el mismo navegador.

**Independent Test**:
1. Iniciar sesión como Cliente y activar notificaciones.
2. Cerrar sesión (debe eliminarse la suscripción de la base de datos).
3. Iniciar sesión como Administrador en el mismo navegador. El sistema debe suscribir automáticamente al Administrador en segundo plano sin mostrar prompts de activación.
4. Validar en la base de datos que se registró el token para el Administrador y que funciona la recepción de la notificación push de cita agendada.

### Implementation for Remediation

- [x] T012 [P] [US1] Scope localStorage pushPromptDismissed key by userId in `src/components/PushPrompt.jsx` and pass it from `src/App.jsx`
- [x] T013 [P] [US1] Implement background auto-subscription when Notification.permission is granted and active session is detected in `src/hooks/usePushNotifications.js`
- [ ] T014 Deploy updated files, compile (`npm run build`), and push the Edge Function to production
- [ ] T015 Perform manual validation scenarios in production using both Client and Administrator sessions to confirm push notifications arrive

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificaciones de calidad, compilación y linter global final.

- [x] T010 Run ESLint code check and verify project build (`npm run build`)
- [ ] T011 Execute manual validation checklist defined in `specs/005-role-notifications/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) should be done first to establish clean registration patterns.
  - User Story 2 and 3 can proceed in parallel once US1 is done.
  - Remediation (Phase 6) depends on User Stories 1, 2, and 3.
- **Polish (Final Phase)**: Depends on all user stories and remediation being complete

### Parallel Opportunities

- Tasks marked with `[P]` (T004, T006, T008, T012, T013) can be developed in parallel as they target different files.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently in the browser and DB

### Incremental Delivery

1. Foundation ready
2. Add User Story 1 -> Test -> Deploy (MVP!)
3. Add User Story 2 -> Test -> Deploy
4. Add User Story 3 -> Test -> Deploy
5. Add Remediation -> Test -> Deploy (Complete Fix!)
