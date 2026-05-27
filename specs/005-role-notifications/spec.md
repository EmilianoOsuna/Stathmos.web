# Feature Specification: Sincronización y Aislamiento de Notificaciones Push por Rol (Role-Based Notifications)

**Feature Branch**: `005-role-notifications`  
**Created**: 2026-05-26  
**Status**: Draft  
**Input**: User description: "Necesito que me ayudes a que las notificaciones push sean específicas para cada rol. Porque actualmente con la sesión iniciada en cliente, me llegan notificaciones de administrador. No debería ser así, hay que lograr que solamente cliente vea notificaciones de cliente y así con admin y mecánico"

## Clarifications

### Session 2026-05-26

- Q: ¿A través de qué canal o componentes visuales de la aplicación te están llegando las notificaciones del administrador mientras estás en la sesión del cliente? → A: Solamente en las notificaciones push (ventanas emergentes del navegador); en la campana de notificaciones web solo aparecen las correspondientes a su rol (eso funciona de forma correcta).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unicidad de Suscripciones por Dispositivo/Navegador (Priority: P1) 🎯 MVP

**Why this priority**: Evita la causa principal de la contaminación de notificaciones. Si múltiples usuarios inician sesión secuencialmente en el mismo dispositivo o navegador, la suscripción push física del navegador debe asociarse únicamente con el último usuario autenticado.

**Independent Test**:
1. Iniciar sesión como Administrador en un navegador y activar las notificaciones push.
2. Cerrar sesión e iniciar sesión como Cliente en el mismo navegador. Activar las notificaciones push.
3. Validar en la base de datos que el registro de suscripción anterior (para el Administrador con ese endpoint) se haya eliminado o actualizado para pertenecer únicamente al Cliente actual, evitando que existan múltiples registros activos con el mismo token.

**Acceptance Scenarios**:
1. **Given** que un Administrador tiene registrada una suscripción push con endpoint `EP_X`, **When** un Cliente inicia sesión en el mismo navegador y registra su suscripción con el mismo endpoint `EP_X`, **Then** el sistema elimina el registro de la suscripción del Administrador y crea/asocia la suscripción únicamente para el Cliente actual.
2. **Given** una suscripción push existente para un token específico, **When** otro usuario registra el mismo token, **Then** el sistema asegura que no se dupliquen los tokens en la tabla `push_subscriptions`.

---

### User Story 2 - Limpieza de Suscripción al Cerrar Sesión (Priority: P2)

**Why this priority**: Garantiza la seguridad y privacidad del usuario cuando abandona un dispositivo. Al dar click en cerrar sesión, la relación entre el navegador y la cuenta del usuario debe romperse en la base de datos inmediatamente.

**Independent Test**:
1. Iniciar sesión en la aplicación, activar las notificaciones.
2. Presionar el botón "Cerrar sesión" (Logout).
3. Validar en la base de datos que el registro en `push_subscriptions` asociado al endpoint del navegador actual ha sido eliminado.

**Acceptance Scenarios**:
1. **Given** un usuario autenticado con una suscripción push activa, **When** el usuario ejecuta la acción de cerrar sesión, **Then** el sistema remueve su suscripción de la tabla `push_subscriptions` antes de finalizar la sesión de Supabase Auth.

---

### User Story 3 - Validación de Destinatarios y Roles en el Servidor (Priority: P2)

**Why this priority**: Asegura que las Edge Functions no envíen notificaciones a usuarios cuyo rol actual no coincida con el objetivo del mensaje (por ejemplo, evitar que se envíen avisos administrativos a IDs de usuarios que son Clientes).

**Independent Test**:
1. Disparar un evento que notifique a administradores (por ejemplo, agendar una nueva cita).
2. Validar que la Edge Function `enviar-notificacion` verifique que el `usuario_id` destinatario realmente posea el rol canónico de "administrador" antes de proceder con el insert en base de datos o el envío de la notificación push.

**Acceptance Scenarios**:
1. **Given** un trigger de notificación para administradores, **When** se invoca la función para enviar notificaciones, **Then** solo se procesan envíos para aquellos usuarios que tienen el rol de "administrador" en la base de datos.

---

### Edge Cases

- **Usuario invitado / Sin rol asignado**: Si un usuario con rol corrupto o nulo intenta suscribirse o ser notificado, el sistema debe ignorar el envío y no generar un error fatal en la Edge Function.
- **Suscripción push no soportada o bloqueada**: Si el navegador no soporta notificaciones push o el usuario deniega los permisos, el flujo de cierre de sesión y la navegación del sistema deben continuar funcionando normalmente.
- **Falta de conexión al cerrar sesión**: Si el usuario cierra sesión sin internet, el sistema debe intentar borrar localmente el service worker y limpiar el estado de sesión de inmediato, manejando con gracia el fallo de red del API.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE garantizar que un endpoint de suscripción push (`endpoint` de la carga útil del navegador) solo esté asociado a un único `usuario_id` en la tabla `push_subscriptions` a la vez.
- **FR-002**: Durante el registro de notificaciones en `usePushNotifications.js`, el sistema DEBE eliminar cualquier registro de suscripción preexistente en la base de datos que comparta el mismo endpoint, antes de insertar la nueva asociación.
- **FR-003**: Al ejecutar la acción de cierre de sesión (`handleLogout` en `App.jsx`), el sistema DEBE eliminar de forma segura la suscripción push asociada al navegador actual en la base de datos antes de invalidar la sesión.
- **FR-004**: La Edge Function `enviar-notificacion` DEBE verificar el rol del usuario destinatario antes de persistir o transmitir notificaciones push de carácter exclusivo (ej. avisos de pagos, citas nuevas).
- **FR-005**: Si se detecta que el destinatario de una notificación de rol administrativo o de taller ya no posee dicho rol, la Edge Function DEBE omitir el envío y registrar el incidente en los logs.

### Key Entities *(include if feature involves data)*

- **PushSubscription**: Representa el token de suscripción del navegador de un usuario. Atributos clave: `id`, `user_id` (UUID), `subscription` (JSON conteniendo endpoint, keys, auth, p256dh).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El número máximo de registros activos en `push_subscriptions` para un mismo endpoint del navegador debe ser **estrictamente 1**, garantizando que no se crucen notificaciones en navegadores compartidos.
- **SC-002**: El tiempo que toma limpiar la suscripción push en la base de datos durante el cierre de sesión no debe retrasar la redirección del usuario al Login en más de **1.5 segundos**.
- **SC-003**: El 100% de los envíos de notificaciones push desencadenados por acciones exclusivas de un rol (ej. "nueva cita" para admin, o "fotos de avance" para clientes) deben llegar únicamente al dispositivo del usuario correspondiente que tiene ese rol activo.

## Assumptions

- Se asume que los navegadores utilizados soportan la API de `PushManager` de HTML5 y Service Workers.
- Se asume que las tablas `push_subscriptions`, `usuarios` y `roles` tienen una relación consistente en la base de datos para validar de forma rápida el rol de cada `usuario_id`.
