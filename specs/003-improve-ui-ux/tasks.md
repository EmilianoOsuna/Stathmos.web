# Tasks: Sistema de Diseño y Optimización UI/UX

## Execution Rule
Tasks MUST be executed sequentially in the order listed. A task is considered complete when its checkbox is checked.
Do not proceed to the next phase until all tasks in the current phase are complete.

## Dependencies
- Phase 1 (Setup) -> Phase 2, 3, 4
- Phase 2 (Centralización Visual) -> Phase 3
- Phase 3 (Armonización Vistas) -> Phase 4
- Phase 4 (Mobile Tablas) -> Phase 5
- Phase 5 (Mobile Calendario)

## Phase 1: Setup
- [ ] T001 Evaluar e incorporar la tipografía Inter (Google Fonts) en index.html e index.css.

## Phase 2: User Story 1 - Consistencia y Centralización Visual (P1)
**Goal:** Definir los design tokens en index.css y crear los componentes UI base reutilizables.
**Test:** Cambiar el modo oscuro o una variable en index.css debe afectar todos los primitivos globalmente.

- [ ] T002 [US1] Definir tokens globales (Colors, Spacings, Borders, Shadows) mediante @theme de Tailwind V4 en src/index.css.
- [ ] T003 [US1] Refactorizar componente Button en src/components/UIPrimitives.jsx para usar las variables CSS y variants definidas, con touch target min h-11.
- [ ] T004 [US1] Mover estilos del header a un componente reutilizable ModuleHeader en src/components/UIPrimitives.jsx.
- [ ] T005 [US1] Crear el componente contenedor Card en src/components/UIPrimitives.jsx con los tokens de radio de borde, padding y superficie.

## Phase 3: User Story 2 - Armonización de Interfaces y Vistas de Módulos (P2)
**Goal:** Implementar los primitivos base en todos los módulos de administración existentes.
**Test:** Navegación secuencial por módulos debe mostrar alineación y estilos 100% idénticos.

- [ ] T006 [P] [US2] Reemplazar headers y botones en src/components/HistorialServiciosAdmin.jsx utilizando UIPrimitives.jsx.
- [ ] T007 [P] [US2] Reemplazar headers y botones en src/components/CentroReportes.jsx utilizando UIPrimitives.jsx.
- [ ] T008 [P] [US2] Reemplazar headers y botones en src/components/MecanicoDiagnosticosModule.jsx utilizando UIPrimitives.jsx.
- [ ] T009 [P] [US2] Reemplazar headers y botones en módulos de Inventario (src/components/GestionInventario.jsx, CompraRefacciones.jsx, etc.) utilizando UIPrimitives.jsx.
- [ ] T010 [US2] Aplicar el componente contenedor Card a las vistas principales de la aplicación para estandarizar márgenes y fondos.

## Phase 4: User Story 3 (Parte 1) - Adaptabilidad Mobile Tablas (P3)
**Goal:** Transformar todas las tablas nativas de datos en layouts de tarjetas responsive (Cards) para pantallas <768px.
**Test:** Pantallas menores a 768px no deben tener scroll horizontal en módulos con tablas.

- [ ] T011 [US3] Construir abstracción o clases CSS para MobileResponsiveTable (pasar a Card Layout responsivo) en los datos renderizados (pueden ser funciones/helper classes integradas directamente a las vistas).
- [ ] T012 [P] [US3] Refactorizar tablas en src/components/HistorialServiciosAdmin.jsx a layout responsivo móvil.
- [ ] T013 [P] [US3] Refactorizar tablas en src/components/MecanicoDiagnosticosModule.jsx a layout responsivo móvil.
- [ ] T014 [P] [US3] Refactorizar tablas en los módulos de reportabilidad e inventario a layouts responsivos móviles.

## Phase 5: User Story 3 (Parte 2) - Usabilidad Mobile Calendario (P3)
**Goal:** Adaptar el calendario de citas para visualización óptima mobile.
**Test:** Calendario de citas renderizado en celular muestra botones interactivos (44x44) y no desborda la pantalla.

- [ ] T015 [US3] Refactorizar sección del calendario mensual utilizando iteraciones CSS Grid compactas para <768px en src/components/CitasModule.jsx.
- [ ] T016 [US3] Ajustar botones y touch targets del calendario en src/components/CitasModule.jsx para garantizar altura mínima de 44px (h-11).

## Phase 6: Polish
- [ ] T017 Validación manual unificada: Navegar en Chrome DevTools usando simulación Mobile (iPhone SE/Pro) por todos los módulos verificando SC-002 y SC-003. Limpieza final de código obsoleto.
