# Tasks: Optimización y Cobertura de Actualizaciones en Tiempo Real

**Input**: Design documents from `/specs/004-realtime-update/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify project structure and configuration settings in `specs/004-realtime-update/plan.md`
- [x] T002 [P] Configure custom connection status styling classes and animations in `src/index.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Refactor the real-time hook in `src/hooks/useSupabaseRealtime.js` to implement the `channelRegistry` multiplexing layer and event debounce mechanism.
- [x] T004 [P] Implement the global connection status listener on `supabase.realtime` and export the unified hook `useSupabaseConnectionState` from `src/hooks/useSupabaseRealtime.js`.
- [x] T005 Implement the `<ConnectionStatusBadge />` component in `src/components/UIPrimitives.jsx` and render it inside the header of `DashboardShell` in `src/App.jsx`.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Multiplexación y Optimización de Suscripciones (Priority: P1) 🎯 MVP

**Goal**: Migrar los componentes del panel administrativo para reutilizar la infraestructura multiplexada de WebSockets.

**Independent Test**: Verificar mediante la consola de desarrollo (pestaña Network/WS) que solo se abre 1 WebSocket channel por cada tabla, incluso al navegar entre módulos.

### Implementation for User Story 1

- [x] T006 [P] [US1] Refactor `ClientesModule` inside `src/App.jsx` to consume the multiplexed `useSupabaseRealtime` hook.
- [x] T007 [P] [US1] Refactor `EmpleadosModule` inside `src/App.jsx` to consume the multiplexed `useSupabaseRealtime` hook.
- [x] T008 [P] [US1] Refactor `VehiculosModule` inside `src/App.jsx` to consume the multiplexed `useSupabaseRealtime` hook.
- [x] T009 [P] [US1] Refactor `CitasModule` inside `src/components/CitasModule.jsx` to consume the multiplexed `useSupabaseRealtime` hook.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Actualización en Tiempo Real de Compras y Ventas de Inventario (Priority: P2)

**Goal**: Integrar suscripciones en tiempo real en los componentes de compra y venta de refacciones.

**Independent Test**: Modificar stock o precio de refacciones desde el catálogo y confirmar que se refleja de forma instantánea en los buscadores de las pestañas de compra y venta.

### Implementation for User Story 2

- [x] T010 [P] [US2] Integrate the `useSupabaseRealtime` hook inside `src/components/CompraRefacciones.jsx` to listen for updates on the `refacciones`, `proveedores`, and `proyectos` tables.
- [x] T011 [P] [US2] Integrate the `useSupabaseRealtime` hook inside `src/components/VentaRefacciones.jsx` to listen for updates on the `refacciones`, `clientes`, and `proyectos` tables.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Cobertura de Entidades Relacionadas en Proyectos y Citas (Priority: P3)

**Goal**: Sincronizar catálogos de soporte para los dropdowns y asignación de proyectos.

**Independent Test**: Añadir un cliente o cambiar el estado de disponibilidad de un mecánico y verificar que se refleje instantáneamente en el formulario de proyectos.

### Implementation for User Story 3

- [x] T012 [P] [US3] Add `useSupabaseRealtime` subscriptions for `clientes`, `vehiculos`, and `empleados` tables inside `ProyectosModule` in `src/App.jsx`.
- [x] T013 [P] [US3] Add `useSupabaseRealtime` subscriptions for `clientes` and `vehiculos` tables inside `CitasModule` in `src/components/CitasModule.jsx` to synchronize scheduling filters.

**Checkpoint**: All internal taller modules should now be fully synced in real-time.

---

## Phase 6: User Story 4 - Tiempo Real Completo en el Portal del Cliente (Priority: P2)

**Goal**: Garantizar que las vistas de ticket orientadas a clientes reciban actualizaciones en tiempo real.

**Independent Test**: Cargar fotos o notas desde la vista de mecánicos y confirmar su aparición instantánea en el ticket de clientes.

### Implementation for User Story 4

- [x] T014 [P] [US4] Integrate `useSupabaseRealtime` subscriptions for the `proyectos`, `cotizaciones`, and `fotografias` tables inside `src/components/Ticket.jsx`.
- [x] T015 [P] [US4] Integrate `useSupabaseRealtime` subscription for the `proyectos` table inside `src/components/HistorialTickets.jsx` to update ticket list status.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificaciones de calidad, compilación y linter global.

- [x] T016 Run ESLint code check and verify project build (`npm run build`) with all real-time changes.
- [x] T017 Execute manual validation checklist defined in `specs/004-realtime-update/quickstart.md` on mobile viewports.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel.
- **Polish (Final Phase)**: Depends on all user story tasks being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2).
- **User Story 3 (P3)**: Can start after Foundational (Phase 2).
- **User Story 4 (P4)**: Can start after Foundational (Phase 2).

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel.
- All Foundational tasks marked [P] can run in parallel (within Phase 2).
- Once Foundational phase completes, all user stories can start in parallel (US1, US2, US3, US4).
- All implementation tasks within the same story marked [P] can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch all refactors of administrative modules together:
Task: "Refactor ClientesModule inside src/App.jsx to consume the multiplexed useSupabaseRealtime hook"
Task: "Refactor EmpleadosModule inside src/App.jsx to consume the multiplexed useSupabaseRealtime hook"
Task: "Refactor VehiculosModule inside src/App.jsx to consume the multiplexed useSupabaseRealtime hook"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently on browser
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test independently -> Deploy/Demo (MVP!)
3. Add User Story 2 & 4 -> Test independently -> Deploy/Demo
4. Add User Story 3 -> Test independently -> Deploy/Demo
