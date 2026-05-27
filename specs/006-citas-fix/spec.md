# Feature Specification: Corrección en Gestión de Citas y Manejo de Sesión/Realtime (Citas and Auth Fixes)

**Feature Branch**: `006-citas-fix`  
**Created**: 2026-05-27  
**Status**: Draft  
**Input**: User description: "Errores 401 en resolver-cita, 403 en logout de Supabase, y advertencias CHANNEL_ERROR en canales realtime de citas, dias_inhabiles, clientes y vehiculos. Bug de UI donde los botones de aprobar/rechazar abren la modal y muestran la cita ya resuelta. Se quiere que los botones de aprobar/rechazar en la tarjeta resuelvan la cita directamente. Clics en el resto de la tarjeta deben abrir la modal de detalles, la cual solo mostrará los botones de resolución si la cita está pendiente."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resolución Directa de Citas desde la Lista (Priority: P1) 🎯 MVP

**Why this priority**: Permite a los administradores y mecánicos gestionar las citas de forma rápida y directa desde la interfaz principal sin pasos intermedios innecesarios, alineándose con el flujo de trabajo esperado.

**Independent Test**:
1. Iniciar sesión como Administrador o Mecánico.
2. Ir al módulo de Citas y ubicar una cita en estado "pendiente".
3. Hacer clic en el botón "Aceptar" (o "Rechazar") que aparece en la tarjeta de la cita.
4. Confirmar que el estado cambie de inmediato en la pantalla (a "confirmada" o "cancelada") y que la base de datos se actualice, sin que se abra la ventana modal de detalles.

**Acceptance Scenarios**:
1. **Given** una cita en estado "pendiente" visible en la lista, **When** el usuario hace clic en el botón directo de aprobar/aceptar, **Then** el sistema procesa la aprobación inmediatamente y actualiza la tarjeta a "confirmada" sin abrir ninguna modal.
2. **Given** una cita en estado "pendiente" visible en la lista, **When** el usuario hace clic en el botón directo de rechazar, **Then** el sistema procesa el rechazo inmediatamente y actualiza la tarjeta a "cancelada" sin abrir ninguna modal.

---

### User Story 2 - Visualización de Detalles y Acciones Contextuales en Modal (Priority: P1)

**Why this priority**: Mantiene la capacidad de ver la información completa de la cita sin alterar su estado de manera accidental, y restringe visualmente las acciones solo a estados válidos (pendientes).

**Independent Test**:
1. Hacer clic en una parte neutra (no los botones directos) de una tarjeta de cita "pendiente". Confirmar que se abre la ventana modal de detalles y que esta contiene los botones para Aceptar y Rechazar la cita.
2. Cerrar la modal, y hacer clic en una tarjeta de cita ya "confirmada" o "cancelada". Confirmar que la modal se abre pero no muestra ninguna opción o botón para cambiar su estado (solo lectura).

**Acceptance Scenarios**:
1. **Given** una cita en cualquier estado, **When** el usuario hace clic en el cuerpo de la tarjeta (fuera de los botones de acción directos), **Then** se abre la modal mostrando los detalles completos de la cita.
2. **Given** que la modal de detalles está abierta para una cita con estado "pendiente", **Then** el sistema muestra los botones de acción para Aceptar y Rechazar la cita dentro de la modal.
3. **Given** que la modal de detalles está abierta para una cita con estado "confirmada" o "cancelada", **Then** el sistema oculta los botones de acción de aprobación/rechazo dentro de la modal.

---

### User Story 3 - Robustez en Autenticación de Funciones de Servidor y Cierre de Sesión (Priority: P2)

**Why this priority**: Evita que los usuarios experimenten errores de autorización silenciosos o visibles (como el 401 en resolver-cita y el 403 al cerrar sesión) que afecten la confiabilidad y la usabilidad del sistema en producción.

**Independent Test**:
1. Con una sesión iniciada, realizar una acción de resolución de cita. Confirmar que el backend procesa la petición de forma segura sin arrojar error 401.
2. Hacer clic en "Cerrar sesión" en un entorno donde el token haya expirado o se esté invalidando. Confirmar que la aplicación realiza la limpieza local de las suscripciones push, elimina los datos de sesión locales y redirige de inmediato a la pantalla de Login, manejando cualquier respuesta de error del servidor de forma silenciosa para el usuario.

**Acceptance Scenarios**:
1. **Given** una sesión activa, **When** el cliente invoca la resolución de una cita, **Then** la función del servidor valida correctamente el token de usuario activo y procesa la operación si el rol es el adecuado.
2. **Given** que un usuario inicia el proceso de cierre de sesión, **When** se envía la petición de cierre de sesión al servidor y este responde con un error de autorización (ej. 403 por token caducado), **Then** el cliente intercepta el fallo de red, limpia localmente las credenciales y las suscripciones del navegador, y completa la redirección al Login de manera exitosa.

---

### User Story 4 - Resiliencia en Conexión Realtime (Priority: P3)

**Why this priority**: Asegura que el estado en tiempo real sea confiable y se recupere automáticamente tras desconexiones, cambios de token o cierres de sesión, sin llenar la consola de advertencias innecesarias o estados huérfanos.

**Independent Test**:
1. Observar la consola al iniciar y cerrar sesión.
2. Validar que las suscripciones a los canales realtime se liberen ordenadamente al cerrar la sesión y se vuelvan a suscribir solo cuando exista una sesión activa válida, evitando reportar errores de conexión persistentes (`CHANNEL_ERROR`) durante las transiciones de autenticación.

**Acceptance Scenarios**:
1. **Given** una transición de cierre de sesión, **When** las conexiones en tiempo real se interrumpen o se cierran deliberadamente, **Then** el sistema cancela los canales de forma ordenada y no activa advertencias de conexión fallida por reintentos sin credenciales.

---

### Edge Cases

- **Cita modificada concurrentemente**: Si dos administradores intentan aprobar o rechazar la misma cita al mismo tiempo, el sistema debe resolver la primera petición de manera exitosa y, en la segunda, notificar amigablemente que la cita ya ha sido resuelta en lugar de fallar con error de servidor.
- **Acceso con token corrupto**: Si se invoca la función de resolución con un token alterado o inválido, el sistema debe responder de manera uniforme con una denegación de acceso clara y no procesar ningún cambio en la base de datos.
- **Pérdida temporal de red**: Si el usuario realiza una acción directa y se pierde la conexión a internet, el sistema debe reintentar o informar al usuario del fallo de red, manteniendo la consistencia de la interfaz.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir la resolución directa de una cita (aprobar o rechazar) desde la vista de lista mediante un solo clic en los botones correspondientes de la tarjeta.
- **FR-002**: Al hacer clic en un botón de resolución directa, el sistema DEBE actualizar el estado de la cita en el backend y de forma optimista en el frontend sin abrir la ventana modal de detalles.
- **FR-003**: El sistema DEBE abrir la modal de detalles únicamente al hacer clic en áreas de la tarjeta de cita que no correspondan a los botones de acción rápida.
- **FR-004**: La ventana modal de detalles DEBE condicionar la visibilidad de los controles de aprobación y rechazo: se mostrarán si el estado actual es "pendiente" y se ocultarán por completo si está en cualquier otro estado.
- **FR-005**: La función del servidor para resolver citas DEBE admitir y verificar de forma segura los tokens de sesión de usuario y confirmar que pertenecen a un rol autorizado ("administrador" o "mecánico") antes de alterar el estado de la cita.
- **FR-006**: Durante la acción de cierre de sesión, el frontend DEBE capturar cualquier error derivado de la petición al servidor (incluyendo errores 403 por sesión expirada) y forzar la limpieza del almacenamiento local y la redirección a la pantalla de inicio de sesión.
- **FR-007**: El sistema de sincronización en tiempo real DEBE pausar o cancelar las suscripciones activas a los canales WebSocket inmediatamente al iniciar el cierre de sesión, evitando reintentos de conexión con credenciales nulas o inválidas que provoquen advertencias de error de canal.

### Key Entities *(include if feature involves data)*

- **Cita**: Registro del servicio programado. Atributos clave: `id` (UUID), `estado` ("pendiente", "confirmada", "cancelada"), `fecha_hora`, `cliente_id` y metadatos de auditoría.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El número de clics requeridos para que un administrador apruebe o rechace una cita desde el listado principal se reduce de **3 clics** (clic en tarjeta -> abrir modal -> clic en acción) a exactamente **1 clic**.
- **SC-002**: El 100% de los cierres de sesión de usuario redirigen correctamente al Login en menos de **2 segundos**, incluso si la llamada API de logout del backend falla o devuelve errores 403.
- **SC-003**: La función de servidor de resolución de citas rechaza correctamente las solicitudes con tokens inválidos o roles no autorizados con una respuesta de error estandarizada y estado HTTP 401 en menos de **500 ms**.
- **SC-004**: No se generan advertencias de reintento de conexión realtime en la consola una vez finalizado el proceso de cierre de sesión.

## Assumptions

- Se asume que el backend de base de datos y la autenticación de Supabase están operativos.
- Se asume que el token JWT del usuario contiene los claims de rol en la metadata accesible por el servidor.
- Se asume que el navegador del usuario tiene soporte básico para WebSockets y JavaScript moderno para renderizar la modal y manejar clics.
