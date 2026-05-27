# Tasks: Corrección en Gestión de Citas y Manejo de Sesión/Realtime (Citas and Auth Fixes)

**Input**: Design documents from `/specs/006-citas-fix/`
**Prerequisites**: [plan.md](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/specs/006-citas-fix/plan.md) (required), [spec.md](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/specs/006-citas-fix/spec.md) (required), [research.md](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/specs/006-citas-fix/research.md), [data-model.md](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/specs/006-citas-fix/data-model.md), [resolver-cita-contract.md](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/specs/006-citas-fix/contracts/resolver-cita-contract.md)

**Tests**: Manual testing in development server and browser console is used, as no automated test suites are requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify repository paths and status.

- [ ] T001 Verify active branch `006-citas-fix` and setup planning details.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure the local development environment is configured.

- [ ] T002 Verify local project dependencies and run `npm run dev` successfully.

---

## Phase 3: User Story 1 - Resolución Directa de Citas desde la Lista (Priority: P1) 🎯 MVP

**Goal**: Allow administrators/mechanics to resolve appointments directly from the card list without opening the details modal.

**Independent Test**: Clicking the direct "Aceptar" or "Rechazar" button on a pending appointment card updates its status immediately in the UI and database, without opening the details modal.

### Implementation for User Story 1

- [ ] T003 Add `e.stopPropagation()` in the direct action buttons' `onClick` event handlers inside the appointment card container in [CitasModule.jsx](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/src/components/CitasModule.jsx).
- [ ] T004 Manually test that clicking direct buttons triggers resolution and prevents the details modal from opening.

---

## Phase 4: User Story 2 - Visualización de Detalles y Acciones Contextuales en Modal (Priority: P1)

**Goal**: Click on any neutral area of the card to open the details modal, showing action buttons only if the appointment is pending.

**Independent Test**: Clicking on the card body opens the modal. If the appointment is resolved, no action buttons appear; if pending, they appear.

### Implementation for User Story 2

- [ ] T005 Update the modal action rendering conditional block around line 1351 in [CitasModule.jsx](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/src/components/CitasModule.jsx) to ensure action buttons are hidden if `selectedCita.estado` is not `"pendiente"`.
- [ ] T006 Verify modal action button conditional visibility for both pending and resolved appointments.

---

## Phase 5: User Story 3 - Robustez en Autenticación de Funciones de Servidor y Cierre de Sesión (Priority: P2)

**Goal**: Ensure Edge Function token verification and client logout handle authentication states reliably.

**Independent Test**: Backend resolves appointments without throwing 401, and client logout completes smoothly even if the server returns 403 Forbidden.

### Implementation for User Story 3

- [ ] T007 [P] [US3] Refactor token verification in [resolver-cita/index.ts](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/supabase/functions/resolver-cita/index.ts) to verify authorization using a user-scoped client and `supabaseUser.auth.getUser()`.
- [ ] T008 [P] [US3] Wrap `supabase.auth.signOut()` in a `try-catch` block inside `handleLogout` in [App.jsx](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/src/App.jsx).
- [ ] T009 [US3] Deploy updated Edge Function and test user-scoped client token verification along with try-catch logout flow.

---

## Phase 6: User Story 4 - Resiliencia en Conexión Realtime (Priority: P3)

**Goal**: Prevent realtime socket connection errors during logout transitions.

**Independent Test**: Logging out closes all websocket channels first, preventing `CHANNEL_ERROR` warnings from appearing in the browser console.

### Implementation for User Story 4

- [ ] T010 [P] [US4] Implement and export `cleanAllRealtimeChannels()` in [useSupabaseRealtime.js](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/src/hooks/useSupabaseRealtime.js) to unsubscribe and delete all registry channels.
- [ ] T011 [US4] Add safety null-checks to the cleanup hook return block in [useSupabaseRealtime.js](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/src/hooks/useSupabaseRealtime.js) to avoid crashes if registry entries were deleted globally.
- [ ] T012 [US4] Import `cleanAllRealtimeChannels` and invoke it in the `handleLogout` function in [App.jsx](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/src/App.jsx) before calling `signOut`.
- [ ] T013 [US4] Validate that logging out does not output any `CHANNEL_ERROR` messages in the console.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification of all functionalities.

- [ ] T014 Execute full validation of [quickstart.md](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/specs/006-citas-fix/quickstart.md) tasks to ensure correct execution.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all stories.
- **User Stories (Phases 3 to 6)**: Depend on Phase 2 completion.
  - Phase 3 (US1) and Phase 4 (US2) are core UI fixes.
  - Phase 5 (US3) is the backend auth and logout robustness fix.
  - Phase 6 (US4) is the realtime channel connection cleanup fix.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

- **T007 (US3)**, **T008 (US3)**, and **T010 (US4)** are parallelizable as they modify different files ([resolver-cita/index.ts](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/supabase/functions/resolver-cita/index.ts), [App.jsx](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/src/App.jsx), and [useSupabaseRealtime.js](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/src/hooks/useSupabaseRealtime.js) respectively).

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)
1. Complete Setup and Foundational verification.
2. Implement T003 & T004 (direct clicks / event bubbling fix).
3. Implement T005 & T006 (modal buttons conditional rendering).
4. Verify core UI functionality.

### Incremental Delivery (Auth & Realtime)
1. Implement Edge Function and logout try-catch fixes (US3).
2. Implement global realtime channel cleanup on logout (US4).
3. Run comprehensive validation of all fixes.
