# Tasks: Sistema de Diseño y Optimización UI/UX

**Input**: Design documents from `/specs/003-improve-ui-ux/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Connect Google Fonts link tags for the Inter font in `index.html`
- [x] T002 Configure the `@theme` directive, `--font-sans`, and color tokens in `src/index.css`
- [x] T003 Bind local colors `C_BLUE` and `C_RED` to `var(--color-primary)` and `var(--color-accent)` in `src/components/UIPrimitives.jsx`
- [x] T004 Refactor `Button`, `Input`, `Select`, `Card`, `Modal`, `DatePicker`, `Badge`, and `ModuleHeader` in `src/components/UIPrimitives.jsx` to consume native CSS variables and guarantee tactile padding/sizes >=44px on mobile viewports

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T005 [P] [US1] Apply font-sans configuration to the main body container in `src/index.css`

---

## Phase 3: User Story 1 - Consistencia y Centralización Visual (Priority: P1) 🎯 MVP

**Goal**: Definir los design tokens y unificar la visualización de las vistas base de inicio y sesión.

- [x] T006 [US1] Refactor `src/Login.jsx` to use `Card`, `Input`, and `Button` primitives from UIPrimitives
- [x] T007 [US1] Refactor `src/CompletarRegistro.jsx` to use standard primitive input/button components
- [x] T008 [US1] Refactor `src/CambiarContrasena.jsx` to use standard primitive input/button components

---

## Phase 4: User Story 2 - Armonización de Interfaces y Vistas de Módulos (Priority: P2)

**Goal**: Implementar los primitivos base en todos los módulos de administración existentes.

- [x] T009 [US2] Update inline `ClientesModule` in `src/App.jsx` to leverage standard primitive buttons and inputs
- [x] T010 [US2] Update inline `EmpleadosModule` in `src/App.jsx` to leverage standard primitive buttons and inputs
- [x] T011 [US2] Update inline `VehiculosModule` (inside `src/App.jsx`) to leverage standard primitive buttons and inputs
- [x] T012 [US2] Refactor `src/components/MecanicoDiagnosticosModule.jsx` to use standard header actions and primitives
- [x] T013 [US2] Refactor `src/components/RefaccionesModule.jsx` to use standard header actions and primitives
- [x] T014 [US2] Refactor `src/components/ProveedoresModule.jsx` to use standard header actions and primitives

---

## Phase 5: User Story 3 - Adaptabilidad y Usabilidad Móvil Completa (Priority: P3)

**Goal**: Optimizar todas las tablas, vistas densas, calendarios y selectores para usabilidad táctil móvil sin scroll horizontal.

- [x] T015 [US3] Refactor the appointments table in `src/components/CitasModule.jsx` to render as responsive cards on mobile viewports (`hidden md:table` / `md:hidden`)
- [x] T016 [US3] Refactor the tables in `src/components/HistorialServiciosAdmin.jsx` (services, diagnostics, and quotes) to collapse into responsive card grids on mobile viewports
- [x] T017 [US3] Refactor the historical parts table in `src/components/HistorialRefacciones.jsx` to collapse into responsive cards on mobile viewports
- [x] T018 [US3] Refactor report lists and tables in `src/components/ReportesOperativosModule.jsx` to collapse into responsive cards on mobile viewports
- [x] T019 [US3] Refactor tables and summaries in `src/components/ReporteFinancieroModule.jsx` to adapt to mobile grids
- [x] T023 [US3] Refactor the monthly calendar grid view in `src/components/CitasModule.jsx` to use compact day cells (`min-h-12 md:min-h-24`) on mobile viewports, hiding the verbose list of appointments inside cells (delegating to the day-click details modal) and replacing it with a simple dot indicator.
- [x] T024 [US3] Add horizontal bounding checks to the `DatePicker` coordinate positioning in `src/components/UIPrimitives.jsx` to prevent the portal dropdown from overflowing the left or right edges on mobile screens.
- [x] T027 [US3] Add a `trigger` render prop to `DatePicker` in `src/components/UIPrimitives.jsx` to support custom elements acting as the dropdown trigger.
- [x] T028 [US3] Refactor the specific day filter button in `src/components/CitasModule.jsx` to render `<DatePicker>` inline using the custom button trigger, showing the selected date on the button label.
- [x] T031 [US3] Refactor the filter buttons wrapper in `src/components/CitasModule.jsx` to prevent wrapping (`whitespace-nowrap`) and allow horizontal scrolling (`overflow-x-auto no-scrollbar`) on mobile devices.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificaciones globales, linter y compilado sin fallas.

- [x] T020 Run code linters and remove unused inline styling overrides
- [x] T021 Run `npm run build` to verify Vite bundle compilation
- [x] T022 Execute manual validation checklist defined in `quickstart.md`
- [x] T025 Run ESLint code linters and verify project build (`npm run build`) with the new calendar and datepicker changes
- [x] T026 Perform manual verification on mobile simulator for the DatePicker positioning and compact monthly calendar views
- [x] T029 Run ESLint code linters and verify project build (`npm run build`) with the new filter button trigger changes.
- [x] T030 Perform manual verification on mobile simulator for the new date selection filter.
- [x] T032 Run ESLint code linters and verify project build (`npm run build`) with the horizontal filter buttons layout changes.
- [x] T033 Perform manual verification on mobile viewport simulator for the horizontal scrolling filter buttons.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion.
- **Polish (Final Phase)**: Depends on all user story tasks being complete.
