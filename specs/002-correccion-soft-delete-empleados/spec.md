# Feature Specification: Corrección Soft Delete Empleados

**Feature Branch**: `002-correccion-soft-delete-empleados`  
**Created**: 2026-05-25  
**Status**: Draft  
**Input**: User description: "Parece que surgió un bug en el que el administrador puede desactivar un empleado pero luego ya no puede volver a activarlo, necesitamos asegurarnos de que ese flujo sea correcto y le permita volverlos a activar si lo desea"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualización y Reactivación de Empleados Inactivos (Priority: P1)

Como administrador del sistema, quiero ver a los empleados inactivos en el listado del Personal y poder volver a activarlos si lo requiero, para gestionar el personal del taller sin perder su historial en la base de datos.

**Why this priority**: Es la solución directa al bug reportado. Permite recuperar la gestión de empleados previamente desactivados y corrige el bloqueo de activación.

**Independent Test**: Se puede probar desactivando un empleado, verificando que permanezca visible en la tabla con un badge de "Inactivo", y luego haciendo clic en su botón de activar para devolverlo al estado "Activo" en la base de datos.

**Acceptance Scenarios**:

1. **Given** un administrador en la sección de Personal, **When** se carga la lista de empleados, **Then** el sistema muestra tanto a los empleados activos como a los inactivos.
2. **Given** un empleado inactivo en la lista, **When** el administrador hace clic en el botón de cambiar estado (`BtnToggleActive`) o edita su estado a "Activo" en la modal, **Then** el sistema actualiza su estado en la base de datos y su estado cambia a "Activo" en la interfaz.

---

### Edge Cases

- **Desactivación con Proyectos Activos**: Si un empleado (mecánico) está asignado a un diagnóstico o servicio activo y se desactiva, el sistema debe permitir la desactivación en la base de datos, pero debe removerlo de la lista de mecánicos disponibles para nuevas asignaciones.
- **Visualización en Dispositivos Móviles**: La interfaz móvil debe mostrar de manera clara el badge de "Inactivo" y proveer el botón de toggle o edición para reactivarlo, manteniendo paridad con la vista de escritorio.
- **Sincronización en Tiempo Real**: Si múltiples administradores están gestionando el personal, los cambios en el estado de un empleado deben propagarse inmediatamente a través de la suscripción en tiempo real de Supabase sin requerir recarga de la página.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE cargar todos los registros de la tabla `empleados` (incluyendo activos e inactivos) en la vista de administración del Personal.
- **FR-002**: El sistema DEBE mostrar un indicador visual ("Activo" / "Inactivo") diferenciado para cada empleado en el listado.
- **FR-003**: El sistema DEBE permitir al administrador alternar el estado `activo` de un empleado mediante el botón de toggle (`BtnToggleActive`) y la modal de confirmación correspondiente.
- **FR-004**: Al desactivar un empleado, su campo `disponible` DEBE establecerse en `false` de manera automática para evitar asignaciones de trabajo mientras se encuentra inactivo.
- **FR-005**: Al reactivar un empleado, su campo `disponible` DEBE restaurarse según la selección del administrador o por defecto en `true`.

### Key Entities *(include if feature involves data)*

- **Empleado**: Representa al personal del taller (mecánico o administrador) registrado en el sistema. Atributos clave: `nombre`, `correo`, `rfc`, `telefono`, `disponible` (booleano), `activo` (booleano).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los empleados inactivos registrados en la base de datos son visibles en el módulo de Personal para los administradores.
- **SC-002**: El tiempo para reactivar o desactivar a un empleado (incluyendo confirmación en modal e interacción con la base de datos) es menor a 2 segundos bajo condiciones de red normales.
- **SC-003**: Las actualizaciones del estado activo/inactivo se reflejan de inmediato en la interfaz de usuario sin necesidad de recargar la página manualmente.

## Assumptions

- El administrador tiene permisos completos sobre la tabla de `empleados`.
- Los empleados inactivos se conservan en la base de datos (soft delete) para mantener la integridad referencial en diagnósticos, reportes e historiales de servicios pasados.
