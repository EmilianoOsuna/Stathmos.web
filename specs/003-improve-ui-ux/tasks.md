# Tasks: Sistema de Diseño y Optimización UI/UX

**Input**: Design documents from `/specs/003-improve-ui-ux/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and base assets loading

- [ ] T001 Connect Google Fonts link tags for the Inter font in `index.html`
- [ ] T002 Configure the `@theme` directive, `--font-sans`, and color tokens in `src/index.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Bind local design assets to native CSS variables and ensure primitives support tactile size rules

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Bind local colors `C_BLUE` and `C_RED` to `var(--color-primary)` and `var(--color-accent)` in `src/components/UIPrimitives.jsx`
- [ ] T004 Refactor `Button`, `Input`, `Select`, `Card`, `Modal`, `DatePicker`, `Badge`, and `ModuleHeader` in `src/components/UIPrimitives.jsx` to consume native CSS variables and guarantee tactile padding/sizes >=44px on mobile viewports

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Consistencia y Centralización Visual (Priority: P1) 🎯 MVP

**Goal**: Apply typography and primitive styling guidelines to main app views

**Independent Test**: Switch light/dark mode and confirm that login and basic text areas update style dynamically according to the custom variables.

### Implementation for User Story 1

- [ ] T005 [P] [US1] Apply font-sans configuration to the main body container in `src/index.css`
- [ ] T006 [US1] Refactor `src/Login.jsx` to use `Card`, `Input`, and `Button` primitives from UIPrimitives
- [ ] T007 [US1] Refactor `src/CompletarRegistro.jsx` to use standard primitive input/button components
- [ ] T008 [US1] Refactor `src/CambiarContrasena.jsx` to use standard primitive input/button components

**Checkpoint**: User Story 1 complete. Core views are styled with the centralized tokens.

---

## Phase 4: User Story 2 - Armonización de Interfaces y Vistas de Módulos (Priority: P2)

**Goal**: Align headers, alignments, margins, and actions across all dashboard modules

**Independent Test**: Verify margins and positioning of `ModuleHeader` and search bars when navigating between client, employee, vehicle, and inventory screens.

### Implementation for User Story 2

- [ ] T009 [US2] Update inline `ClientesModule` in `src/App.jsx` to leverage standard primitive buttons and inputs
- [ ] T010 [US2] Update inline `EmpleadosModule` in `src/App.jsx` to leverage standard primitive buttons and inputs
- [ ] T011 [US2] Update inline `VehiculosModule` (inside `src/App.jsx`) to leverage standard primitive buttons and inputs
- [ ] T012 [US2] Refactor `src/components/MecanicoDiagnosticosModule.jsx` to use standard header actions and primitives
- [ ] T013 [US2] Refactor `src/components/RefaccionesModule.jsx` to use standard header actions and primitives
- [ ] T014 [US2] Refactor `src/components/ProveedoresModule.jsx` to use standard header actions and primitives

**Checkpoint**: User Story 2 complete. Dashboard modules share uniform UI structures.

---

## Phase 5: User Story 3 - Adaptabilidad y Usabilidad Móvil Completa (Priority: P3)

**Goal**: Collapse dense layout tables into card lists for screens under 768px wide

**Independent Test**: Inspect app at 360px viewport width and verify that no horizontal overflow exists on any module.

### Implementation for User Story 3

- [ ] T015 [US3] Refactor the appointments table in `src/components/CitasModule.jsx` to render as responsive cards on mobile viewports (`hidden md:table` / `md:hidden`)
- [ ] T016 [US3] Refactor the tables in `src/components/HistorialServiciosAdmin.jsx` (services, diagnostics, and quotes) to collapse into responsive card grids on mobile viewports
- [ ] T017 [US3] Refactor the historical parts table in `src/components/HistorialRefacciones.jsx` to collapse into responsive cards on mobile viewports
- [ ] T018 [US3] Refactor report lists and tables in `src/components/ReportesOperativosModule.jsx` to collapse into responsive cards on mobile viewports
- [ ] T019 [US3] Refactor tables and summaries in `src/components/ReporteFinancieroModule.jsx` to adapt to mobile grids

**Checkpoint**: User Story 3 complete. Mobile layouts are fully responsive and touch-friendly.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, build verification, and final validation

- [ ] T020 Run code linters and remove unused inline styling overrides
- [ ] T021 Run `npm run build` to verify Vite bundle compilation
- [ ] T022 Execute manual validation checklist defined in `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all user stories being complete

### Parallel Opportunities

- T001 and T002 can be done in parallel
- T003 and T004 can be worked in parallel within UIPrimitives
- Once Foundation (Phase 2) is complete, User Story 1 (Phase 3) and User Story 2 (Phase 4) can be worked in parallel if needed (affecting different files/modules)
- Mobile refactoring tasks (T015 - T019) can run in parallel since they target distinct component files

---

## Parallel Example: User Story 3

```bash
# Refactor CitasModule and HistorialRefacciones tables independently:
Task: "Refactor appointments table in src/components/CitasModule.jsx"
Task: "Refactor parts table in src/components/HistorialRefacciones.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Setup (Phase 1)
2. Complete Foundational (Phase 2)
3. Complete User Story 1 & 2 (Phases 3 and 4)
4. Validate primitive compliance and visual harmony on desktop viewports.

### Incremental Delivery

1. Setup + Foundation -> Central styles ready
2. Add User Story 1 -> Core app styled
3. Add User Story 2 -> Dashboard aligned
4. Add User Story 3 -> Mobile responsive viewports enabled
