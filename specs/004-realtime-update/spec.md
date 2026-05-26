# Feature Specification: Optimización y Cobertura de Actualizaciones en Tiempo Real (Realtime Updates)

**Feature Branch**: `004-realtime-update`  
**Created**: 2026-05-26  
**Status**: Draft  
**Input**: User description: "Necesito que analices cómo es que se lleva a cabo nuestra actualización en tiempo real! No todas las pantallas se actualizan así, la idea es que si se llegan a hacer cambios se visualicen en tiempo real para que en ningún momento el usuario tenga que refrescar la página para ver los cambios. Necesita estar lo más optimizado posible"

## Clarifications

### Session 2026-05-26

- Q: ¿Deberían las vistas orientadas al cliente (detalles de proyecto, notas de mecánicos y carga de fotografías) actualizarse también en tiempo real de forma completa? → A: Sí, todas las vistas del cliente (detalles de ticket, fotos y diagnósticos) deben actualizarse en tiempo real de forma transparente.
- Q: ¿Cómo debería reflejarse visualmente en la interfaz de usuario el estado de la conexión en tiempo real (si está activa o desconectada)? → A: Mostrar un indicador de estado de conexión sutil (un pequeño badge o icono) en la cabecera de los módulos o TopBar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multiplexación y Optimización de Suscripciones (Priority: P1) 🎯 MVP

**Why this priority**: Es la base del rendimiento de la aplicación. Al centralizar y reutilizar las conexiones de canales WebSocket de Supabase, evitamos sobrecargar la conexión cliente-servidor y garantizamos un rendimiento óptimo independientemente de la cantidad de tablas u hojas abiertas.

**Independent Test**: Montar múltiples componentes que escuchen la misma tabla (ej. `refacciones` o `citas`) y verificar por consola o herramientas de red que solo se inicializa y destruye un único canal de Supabase en lugar de múltiples canales individuales.

**Acceptance Scenarios**:
1. **Given** un hook `useSupabaseRealtime` que centraliza suscripciones, **When** tres componentes se suscriben a la tabla `refacciones`, **Then** la app solo mantiene un canal de WebSocket activo para esa tabla.
2. **Given** múltiples componentes suscritos al mismo canal compartido, **When** ocurre un cambio en la base de datos, **Then** todos los callbacks asociados a esa tabla se ejecutan correctamente sin interferir entre sí.
3. **Given** que el último componente que escuchaba la tabla `refacciones` se desmonta, **When** ocurre el desmontaje, **Then** el canal de WebSocket compartido de esa tabla se destruye de forma limpia para liberar recursos.

---

### User Story 2 - Actualización en Tiempo Real de Compras y Ventas de Inventario (Priority: P2)

**Why this priority**: Evita que los administradores tengan discrepancias de stock o catálogos desactualizados al operar transacciones de inventario, reduciendo errores humanos en el registro de mano de obra y refacciones.

**Independent Test**: Abrir la pestaña de "Ventas" o "Compras" en un dispositivo y, en otro diferente, añadir o editar una refacción en el catálogo o modificar un cliente. Los cambios de stock, nombres o estado deben reflejarse de forma instantánea en los dropdowns y listas de selección sin refrescar la página.

**Acceptance Scenarios**:
1. **Given** la pantalla de `CompraRefacciones`, **When** se actualiza el stock de una refacción desde otra vista o sesión, **Then** el stock disponible y los precios en el buscador de compras se actualizan en tiempo real.
2. **Given** la pantalla de `VentaRefacciones`, **When** se crea o desactiva un cliente en el sistema, **Then** la lista de selección de clientes dentro del carrito de ventas se actualiza dinámicamente.

---

### User Story 3 - Cobertura de Entidades Relacionadas en Proyectos y Citas (Priority: P3)

**Why this priority**: Asegura que la gestión de proyectos de taller (`ProyectosModule`) y filtros de citas (`CitasModule`) muestre catálogos de soporte actualizados (clientes, vehículos, empleados asignados) sin requerir recargas manuales.

**Independent Test**: Estar editando un proyecto en `ProyectosModule`, y verificar que si se añade un vehículo o se reasigna la disponibilidad de un mecánico desde otra pestaña, la lista de asignación del formulario de proyectos se actualiza inmediatamente en pantalla.

**Acceptance Scenarios**:
1. **Given** la pantalla de `ProyectosModule`, **When** se desactiva un empleado en el sistema, **Then** el dropdown de mecánicos para asignación excluye al empleado en tiempo real.
2. **Given** la vista de asignación de citas en `ProyectosModule`, **When** una cita se confirma o cancela, **Then** la lista de citas disponibles en el proyecto se actualiza dinámicamente.

---

### User Story 4 - Tiempo Real Completo en el Portal del Cliente (Priority: P2)

**Why this priority**: Asegura que el cliente final visualice las actualizaciones de diagnósticos, fotografías del estado del vehículo y notas de avance de forma inmediata, evitando malentendidos y reduciendo la necesidad de llamar al taller.

**Independent Test**: Acceder al portal de cliente y visualizar el ticket de proyecto activo. Realizar modificaciones o cargar fotos desde la vista de administración/mecánico y validar que aparecen instantáneamente en el ticket del cliente sin refrescar.

**Acceptance Scenarios**:
1. **Given** un cliente visualizando su ticket en `Ticket.jsx`, **When** el mecánico añade una nueva nota o fotografía desde su panel, **Then** la nota y la fotografía aparecen de inmediato en la pantalla del cliente.
2. **Given** un cliente en `HistorialTickets.jsx`, **When** el estado de uno de sus proyectos cambia de "diagnostico" a "reparacion", **Then** el estado se actualiza en tiempo real en su listado.

---

### Edge Cases

- **Pérdida de Conexión de Red**: Si el WebSocket pierde conexión, el sistema debe re-conectarse automáticamente y actualizar el indicador visual en tiempo real a "reconectando" o "desconectado" para advertir al usuario que la sincronización en tiempo real está pausada.
- **Modificaciones de Alta Frecuencia (Bulk Writes)**: Si hay una ráfaga alta de actualizaciones en base de datos (por ejemplo, importaciones de inventario), el gestor de canales debe agrupar (debounce) los callbacks para evitar bloqueos del hilo principal de renderizado de React.
- **Valores Nulos / Registros Vacíos**: Manejar correctamente las respuestas nulas de Supabase en caso de que una suscripción no retorne datos o el usuario no tenga permisos de lectura RLS sobre la tabla.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE multiplexar suscripciones de Supabase Realtime a través de un administrador de canales global o caché compartida en memoria.
- **FR-002**: El hook `useSupabaseRealtime` DEBE registrar dinámicamente callbacks de componentes individuales a canales compartidos y gestionar su ciclo de vida de forma limpia.
- **FR-003**: El componente `CompraRefacciones` DEBE actualizar su catálogo de refacciones, proyectos y proveedores activos en tiempo real ante inserciones, actualizaciones o eliminaciones de BD.
- **FR-004**: El componente `VentaRefacciones` DEBE actualizar su catálogo de refacciones, proyectos y clientes activos en tiempo real.
- **FR-005**: El componente `ProyectosModule` DEBE integrar suscripciones en tiempo real para las tablas de apoyo `clientes`, `vehiculos` y `empleados` a fin de mantener sus dropdowns de asignación completamente sincronizados.
- **FR-006**: Las vistas del portal del cliente (`Ticket.jsx` y `HistorialTickets.jsx`) DEBEN recibir actualizaciones en tiempo real para proyectos, cotizaciones, diagnósticos y fotografías utilizando la infraestructura de suscripciones compartidas.
- **FR-007**: El sistema DEBE exponer visualmente el estado del canal de comunicación en tiempo real mediante un indicador o badge sutil (icono o círculo de color) en la TopBar o cabecera de los módulos, mostrando si está conectado o reintentando la conexión.

### Key Entities *(include if feature involves data)*

- **SuscripcionRegistry**: Entidad en memoria que mapea el nombre de una tabla de Supabase (ej: `refacciones`) a un canal de WebSocket abierto y al conjunto de callbacks activos (`Set<Function>`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El número máximo de canales WebSocket de Supabase abiertos simultáneamente para consultas en tiempo real de tablas del sistema no debe exceder de **1 por tabla activa**, sin importar cuántos componentes escuchen esa tabla en la sesión actual.
- **SC-002**: Todos los cambios de datos realizados en catálogos (clientes, proveedores, stock de refacciones) deben propagarse a las pantallas de transacciones abiertas en un lapso máximo de **2 segundos** desde su confirmación en base de datos, sin requerir recarga manual (F5) de la página.
- **SC-003**: Cero fugas de memoria o canales huérfanos tras cambiar repetidamente de módulo en la navegación lateral del panel.

## Assumptions

- Se asume que el backend de Supabase tiene habilitado el soporte de Realtime ("Replication") para las tablas `clientes`, `vehiculos`, `empleados`, `refacciones`, `proveedores`, `proyectos`, `cotizaciones`, `fotografias`, `dias_inhabiles` y `citas`.
- Las reglas de seguridad de RLS (Row Level Security) aplicadas en Supabase se propagan a las suscripciones de WebSocket, por lo que el cliente solo recibirá actualizaciones de registros a los que tiene acceso legítimo según su sesión.
