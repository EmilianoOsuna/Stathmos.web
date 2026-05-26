# Tasks: Corrección Soft Delete Empleados

**Input**: Design documents from `/specs/002-correccion-soft-delete-empleados/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: None requested. Verification will be performed manually following quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

- Single project: `src/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Task verification and branch setup

- [x] T001 Verify active branch is `002-correccion-soft-delete-empleados` and setup is complete

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core code locating

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Locate `EmpleadosModule` and query handlers inside [src/App.jsx](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIER%C3%8DA%20DE%20SOFTWARE/Stathmos.web/src/App.jsx)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Visualización y Reactivación de Empleados Inactivos (Priority: P1) 🎯 MVP

**Goal**: Retrieve all employees (both active and inactive) from Supabase and show them in the administration module, enabling activation/deactivation.

**Independent Test**: Inactivate an employee in the UI, verify they remain visible as "Inactivo" and unavailable ("No"), then reactivate them and verify they return to "Activo".

### Implementation for User Story 1

- [x] T003 [US1] Remove `.eq("activo", true)` filter from `fetchAll` query in [src/App.jsx](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIER%C3%8DA%20DE%20SOFTWARE/Stathmos.web/src/App.jsx)
- [x] T004 [US1] Verify that `handleToggle` successfully updates and persists the `activo` status to the database in [src/App.jsx](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIER%C3%8DA%20DE%20SOFTWARE/Stathmos.web/src/App.jsx)
- [x] T005 [US1] Confirm active badge styling and BtnToggleActive labels are rendered correctly for inactive employees in [src/App.jsx](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIER%C3%8DA%20DE%20SOFTWARE/Stathmos.web/src/App.jsx)

**Checkpoint**: User Story 1 is fully functional and testable.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and styling review

- [x] T006 Verify there are no compiler errors by building the project
- [x] T007 Run the manual validation steps defined in [quickstart.md](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIER%C3%8DA%20DE%20SOFTWARE/Stathmos.web/specs/002-correccion-soft-delete-empleados/quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion.
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2).
- **Polish (Phase 4)**: Depends on User Story 1 completion.

### Parallel Opportunities

- T004 and T005 can be validated in parallel once T003 is implemented.
