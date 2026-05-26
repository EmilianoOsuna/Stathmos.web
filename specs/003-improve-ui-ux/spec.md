# Feature Specification: Sistema de Diseño y Optimización UI/UX

**Feature Branch**: `003-improve-ui-ux`  
**Created**: 2026-05-25  
**Status**: Draft  
**Input**: User description: "Necesito que creemos un sistema de diseño y que analicemos todo el proyecto para asegurarnos que cada interfaz está sintonizada entre sí y de igual manera hay que comprobar que está completamente optimizada para dispositivos móviles."

## Clarifications

### Session 2026-05-25
- Q: ¿Cuál es la tipografía preferida para el sistema de diseño? → A: La tipografía Inter cargada vía Google Fonts.
- Q: ¿Cómo prefieres estructurar y centralizar los tokens de diseño? → A: Variables de CSS Nativas (`index.css`).
- Q: ¿Cuál es la estrategia de usabilidad móvil para las tablas densas de datos del sistema? → A: Tarjetas Responsivas (Cards).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistencia y Centralización Visual (Priority: P1)

Como desarrollador del sistema, quiero que todos los componentes y vistas de la aplicación compartan una paleta de colores, tipografía, bordes, sombras y espaciados centralizados, para evitar la duplicidad y garantizar una estética homogénea en modo claro y oscuro.

**Why this priority**: Es la base del sistema de diseño. Sin tokens consistentes, es imposible asegurar la sintonía entre interfaces.

**Independent Test**: Se puede probar verificando que la edición de una variable de diseño centralizada afecte a todos los componentes primitivos y módulos a la vez.

**Acceptance Scenarios**:

1. **Given** que un módulo utiliza un componente del sistema de diseño (ej: `Button`, `Input`, `Card`), **When** se alterna el modo oscuro, **Then** todos los componentes se adaptan siguiendo las mismas variables de contraste y color sin estilos "ad-hoc".
2. **Given** la paleta de colores del proyecto, **When** se visualiza cualquier pantalla, **Then** todos los bordes, fuentes y sombras respetan los tokens definidos sin variaciones manuales.

---

### User Story 2 - Armonización de Interfaces y Vistas de Módulos (Priority: P2)

Como administrador del taller, quiero que todos los módulos administrativos (Clientes, Personal, Vehículos, Citas, Diagnósticos) tengan el mismo orden visual, espaciado de tarjetas y estructura de tablas, para navegar de forma natural sin saltos visuales incómodos.

**Why this priority**: Asegura que el flujo de trabajo operativo se sienta consistente y profesional.

**Independent Test**: Navegar secuencialmente entre todos los módulos y validar con herramientas de inspección visual que la alineación de márgenes externos, encabezados y radios de bordes coinciden al 100%.

**Acceptance Scenarios**:

1. **Given** un usuario que navega de Clientes a Personal, **When** se renderizan las páginas, **Then** la altura del `ModuleHeader`, los márgenes y la estructura del buscador y tablas se mantienen alineados exactamente en la misma posición.

---

### User Story 3 - Adaptabilidad y Usabilidad Móvil Completa (Priority: P3)

Como mecánico en el taller, quiero ver la aplicación en mi teléfono celular sin desbordamiento horizontal y con elementos interactivos de tamaño adecuado para pantallas táctiles, para poder registrar diagnósticos y refacciones cómodamente desde el vehículo.

**Why this priority**: El taller opera sobre dispositivos móviles/táctiles. La optimización para estos dispositivos es clave para la usabilidad.

**Independent Test**: Redimensionar la pantalla a menos de 768px de ancho y comprobar que no existan barras de scroll horizontal ni textos cortados.

**Acceptance Scenarios**:

1. **Given** una pantalla móvil de menos de 768px, **When** se visualiza cualquier tabla de datos (ej. diagnósticos o citas), **Then** la información se colapsa en un layout responsivo tipo tarjeta (cards) en lugar de una tabla horizontal ancha.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El proyecto DEBE centralizar sus tokens de diseño en archivos globales reutilizables.
- **FR-002**: Todos los ModuleHeaders DEBEN usar el componente `ModuleHeader` de `UIPrimitives.jsx` con idénticos paddings y gaps.
- **FR-003**: Los botones de acción DEBEN utilizar de manera exclusiva el componente `Button` de `UIPrimitives.jsx` con sus variantes (primary, accent, ghost, outline) para unificar bordes y sombras.
- **FR-004**: El sistema DEBE cargar y aplicar una familia tipográfica moderna uniforme, específicamente la tipografía Inter cargada vía Google Fonts.
- **FR-005**: Los tokens de diseño (colores primarios, espaciados y sombras) DEBEN centralizarse mediante variables de CSS nativas en `index.css`.
- **FR-006**: Las tablas de datos densas en pantallas móviles DEBEN optimizarse mediante la conversión a tarjetas responsivas independientes (cards).

### Key Entities

- **UIPrimitives**: Componentes base de la interfaz (Button, Input, Select, Card, Modal, DatePicker, Badge, ModuleHeader).
- **DesignTokens**: Variables de color, fuentes, márgenes, y radios de bordes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las interfaces de los módulos en `src/components/` utilizan los componentes primitivos centralizados de `UIPrimitives.jsx`.
- **SC-002**: Ninguna vista de la aplicación presenta desbordamiento horizontal (scroll en eje X) en resoluciones superiores a 320px de ancho.
- **SC-003**: Las áreas de interacción táctil (botones, inputs, selectores) en dispositivos móviles cumplen con un tamaño mínimo de 44x44 píxeles para asegurar su usabilidad.

## Assumptions

- El proyecto utiliza Tailwind CSS como motor de estilos principal (vía `@import "tailwindcss";` en `index.css`).
- Los navegadores de los clientes y del personal del taller soportan CSS Grid, Flexbox y variables CSS nativas.
