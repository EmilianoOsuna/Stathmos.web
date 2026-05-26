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
- [x] T018 [P] Refine the `<ConnectionStatusBadge />` in `src/components/UIPrimitives.jsx` to hide the status text label on mobile screens and only display the indicator dot.

---

## Phase 8: Seamless Real-Time Updates (Sin parpadeo / Sin loading flicker)

**Purpose**: Eliminar el "flash" o parpadeo de pantalla que ocurre cuando llegan eventos de tiempo real, separando la carga inicial (con loading state) de las actualizaciones silenciosas posteriores.

**Root Cause**: Todos los callbacks del hook `useSupabaseRealtime` actualmente llaman directamente a `fetchAll`/`fetchClientes`/etc., funciones que comienzan con `setLoading(true)`. Esto hace que cada evento WebSocket provoque un ciclo loading→datos→loading→datos visible para el usuario.

**Strategy**: Introducir un flag booleano `silent` (o una función separada `fetchSilent`) que ejecute el mismo fetch pero **sin modificar el estado `loading`**, de modo que la UI nunca quede en blanco durante actualizaciones de tiempo real.

### Phase 8a: Infrastructure — Hook upgrade (prerequisite for all 8b tasks)

- [x] T019 Upgrade `useSupabaseRealtime` in `src/hooks/useSupabaseRealtime.js` to forward the raw Postgres change payload (eventType, new, old) to the callback, so components can choose between a full refetch or a targeted state patch.

### Phase 8b: Silent fetch pattern — Components with `setLoading(true)` in fetch (can run in parallel after T019)

- [x] T020 [P] Refactor `ClientesModule` in `src/App.jsx`: extract a `fetchSilent` variant (no `setLoading` toggle) and wire it to `useSupabaseRealtime` instead of the full `fetchClientes`.
- [x] T021 [P] Refactor `EmpleadosModule` in `src/App.jsx`: extract a `fetchSilent` variant and wire it to `useSupabaseRealtime` instead of the full `fetchAll`.
- [x] T022 [P] Refactor `VehiculosModule` in `src/App.jsx`: extract a `fetchSilent` variant and wire it to `useSupabaseRealtime` instead of the full `fetchAll`.
- [x] T023 [P] Refactor `ProyectosModule` in `src/App.jsx`: extract a `fetchSilent` variant and wire it to all six `useSupabaseRealtime` subscriptions.
- [x] T024 [P] Refactor `CompraRefacciones` in `src/components/CompraRefacciones.jsx`: extract a `fetchSilent` variant (no `setLoading`) and wire it to the three `useSupabaseRealtime` calls.
- [x] T025 [P] Refactor `VentaRefacciones` in `src/components/VentaRefacciones.jsx`: extract a `fetchSilent` variant and wire it to the three `useSupabaseRealtime` calls.
- [x] T026 [P] Refactor `RefaccionesModule` in `src/components/RefaccionesModule.jsx`: extract a `fetchSilent` variant and wire it to `useSupabaseRealtime`.
- [x] T027 [P] Refactor `HistorialTickets` in `src/components/HistorialTickets.jsx`: verify the `rtTick` pattern doesn't trigger a visible loading state; if it does, refactor to silent fetch.
- [x] T028 [P] Refactor `Ticket` in `src/components/Ticket.jsx`: verify the `rtTick` pattern doesn't trigger a visible loading state on the `fotografias`/`cotizaciones`/`proyectos`/`pagos` subscriptions; refactor if needed.
- [x] T029 [P] Refactor `CitasModule` in `src/components/CitasModule.jsx`: verify the `rtTick` pattern doesn't trigger a visible loading state; refactor to silent fetch if needed.

### Phase 8c: CSS micro-transition polish (can run in parallel with 8b)

- [x] T030 [P] Add a CSS fade-in transition (`opacity 0 → 1`, ~150 ms) to list items and table rows in `src/index.css` so that newly inserted/updated rows appear smoothly instead of snapping in.

### Phase 8d: Validation

- [x] T031 Run `npm run build` and ESLint after all Phase 8 changes to confirm no regressions.
- [x] T032 Manual smoke test: trigger a real-time DB update while viewing each affected module and confirm zero loading flicker is visible.
