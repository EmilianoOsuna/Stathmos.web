# Implementation Plan: Sistema de Diseño y Optimización UI/UX

**Branch**: `003-improve-ui-ux` | **Date**: 2026-05-25 | **Spec**: [spec.md](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/specs/003-improve-ui-ux/spec.md)
**Input**: Feature specification from `/specs/003-improve-ui-ux/spec.md`

## Summary

Centralizar los tokens de diseño (paletas de colores, fuentes, sombras, espaciado) en variables CSS nativas en `src/index.css` utilizando la directiva `@theme` de Tailwind CSS v4.2.1. Unificar todos los headers y botones usando los componentes reutilizables de `UIPrimitives.jsx`, integrar la tipografía Inter mediante Google Fonts en `index.html`, y rediseñar las tablas densas del sistema (como `CitasModule.jsx` y `HistorialServiciosAdmin.jsx`) para que colapsen en tarjetas responsivas en pantallas móviles (< 768px).

## Technical Context

**Language/Version**: JavaScript (ES6+), React 19, HTML5  
**Primary Dependencies**: React 19, Supabase JS, Vite, Tailwind CSS v4.2.1, framer-motion, lucide-react, react-router-dom  
**Storage**: Supabase (PostgreSQL client)  
**Testing**: Manual testing and browser inspector for mobile viewport validation  
**Target Platform**: Desktop and Mobile browsers (Safari, Chrome, Firefox, Edge)  
**Project Type**: React Single Page Application (Vite PWA)  
**Performance Goals**: Responsive layouts with 0 horizontal overflows down to 320px, tactile targets >= 44x44px  
**Constraints**: Support dark/light mode toggle with native color schemes, Tailwind v4 theme mapping  
**Scale/Scope**: Entire application visual alignment across all dashboard modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No custom rules are defined in `.specify/memory/constitution.md`. All standard design guidelines are followed.

## Project Structure

### Documentation (this feature)

```text
specs/003-improve-ui-ux/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (generated later)
```

### Source Code (repository root)

```text
index.html               # Add Google Fonts connection for Inter
src/
├── App.jsx              # Align inline modules like ClientesModule, EmpleadosModule, and VehiculosModule to use UIPrimitives
├── index.css            # Centralize design tokens under `@theme` in Tailwind CSS v4
└── components/
    ├── UIPrimitives.jsx # Standardize base primitive variables using native CSS variables
    ├── CitasModule.jsx  # Make appointments tables responsive (desktop table / mobile cards)
    ├── HistorialServiciosAdmin.jsx # Make service history tables responsive (desktop table / mobile cards)
    ├── HistorialRefacciones.jsx    # Make part history table responsive (desktop table / mobile cards)
    ├── ReportesOperativosModule.jsx # Make report tables responsive
    └── ReporteFinancieroModule.jsx  # Make financial tables responsive
```

**Structure Decision**: Web application utilizing a centralized components architecture (`src/components/`) and unified styles (`src/index.css`).

## Complexity Tracking

No violations.
