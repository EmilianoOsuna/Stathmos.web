# Implementation Plan: Corrección Soft Delete Empleados

**Branch**: `002-correccion-soft-delete-empleados` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-correccion-soft-delete-empleados/spec.md`

## Summary

Corregir el bug de filtrado en el listado de Personal (`EmpleadosModule`) modificando la consulta a la base de datos de Supabase para que recupere tanto empleados activos como inactivos (eliminando la cláusula `.eq("activo", true)`). Esto permitirá visualizarlos en la tabla con su badge correspondiente ("Activo" / "Inactivo") y habilitar el botón de toggle para reactivarlos según lo requiera el administrador.

## Technical Context

**Language/Version**: JavaScript (ES6+), React 18  
**Primary Dependencies**: Vite, @supabase/supabase-js  
**Storage**: Supabase PostgreSQL  
**Testing**: Manual Testing (Browser DevTools / Toggle States)  
**Target Platform**: Web Browsers  
**Project Type**: Web Application (React SPA)  
**Performance Goals**: Actualización de estado en UI en < 1 segundo.  
**Constraints**: Mantener consistencia con el diseño del módulo `ClientesModule`.  
**Scale/Scope**: Soporte para el volumen regular de empleados de un taller (~50 registros).  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] I. Library-First: La consulta modificada se encapsula en la función callback `fetchAll` de React.
- [x] II. CLI Interface: N/A para interfaces web PWA.
- [x] III. Test-First: Se validará el comportamiento mediante pruebas de estado locales antes de verificar persistencia.

## Project Structure

### Documentation (this feature)

```text
specs/002-correccion-soft-delete-empleados/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── quickstart.md        # Phase 1 output
```

### Source Code (repository root)

```text
src/
└── App.jsx              # Modificar la query fetchAll en EmpleadosModule (L867)
```

**Structure Decision**: El proyecto es una Single Page Application (React) estructurada principalmente en [src/App.jsx](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/src/App.jsx). La modificación se limita a la consulta de obtención del personal en `EmpleadosModule`.

## Complexity Tracking

N/A - Cambio sumamente directo y simplificado que no requiere justificaciones de complejidad.
