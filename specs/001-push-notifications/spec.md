# Feature Specification: Push Notifications

**Feature Branch**: `001-push-notifications`  
**Created**: 2026-05-25  
**Status**: Draft  
**Input**: User description: "Necesito implementar push notifications al proyecto, analiza primeramente el stack tecnológico que tenemos"

## Clarifications

### Session 2026-05-25
- Q: Acción al hacer clic en la notificación (notificationclick) → A: Abrir / enfocar la ruta específica enviada en el payload del push (comportamiento dinámico).
- Q: Compatibilidad de Navegador → A: Ocultar silenciosamente el botón/opción de suscribirse (Degradación elegante).
- Q: Estructura del Payload (Contenido) → A: Completamente Dinámico (el backend envía título, cuerpo, ícono y URL).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Opt-in a Notificaciones Push (Priority: P1)

Como usuario del sistema, quiero poder aceptar o rechazar la recepción de notificaciones push en mi dispositivo, para estar enterado de actualizaciones en tiempo real sin tener que revisar la aplicación constantemente.

**Why this priority**: Es el paso fundamental e indispensable. Si el usuario no otorga permiso y no se guarda su suscripción, es imposible enviar notificaciones.

**Independent Test**: Se puede probar independientemente mostrando un modal o botón en la interfaz. Al hacer clic, el navegador debe mostrar el prompt nativo de permisos, y si se acepta, el sistema debe registrar el dispositivo del usuario en la base de datos.

**Acceptance Scenarios**:

1. **Given** un usuario que ha iniciado sesión, **When** navega por el dashboard, **Then** el sistema le solicita permiso para enviar notificaciones push.
2. **Given** un usuario que otorga el permiso de notificaciones, **When** el navegador genera el objeto de suscripción (`PushSubscription`), **Then** el sistema guarda esta suscripción en la base de datos asociada a su cuenta.

---

### User Story 2 - Recepción de Notificación en Segundo Plano (Priority: P2)

Como usuario, quiero recibir alertas nativas en la pantalla de bloqueo o centro de notificaciones de mi dispositivo (PC o Celular) cuando ocurre un evento importante en mi proyecto (ej. nueva cita, actualización de estado), incluso si la aplicación web está cerrada.

**Why this priority**: Es el valor principal (core) de la funcionalidad, asegurando que el sistema sea proactivo y mantenga a los usuarios informados en todo momento.

**Independent Test**: Se puede probar lanzando un mensaje push desde el backend hacia una suscripción registrada, verificando que el dispositivo la muestre a nivel sistema operativo sin tener la app abierta en pantalla.

**Acceptance Scenarios**:

1. **Given** que el usuario tiene la PWA cerrada o en segundo plano, **When** el sistema envía un mensaje push (ej. cambio de estado de proyecto), **Then** aparece una notificación nativa en el dispositivo del usuario.
2. **Given** que el usuario recibe una notificación push, **When** el usuario hace clic o toca la notificación, **Then** se abre la aplicación web enfocando la información relevante.

---

### Edge Cases

- ¿Qué pasa si el usuario deniega los permisos de notificación desde el inicio? (Se debe ocultar el botón o mostrar instrucciones para reactivarlo manualmente desde la configuración del navegador).
- ¿Cómo maneja el sistema múltiples dispositivos por usuario? (Ej. Un usuario inicia sesión en Laptop y iPhone. Ambos dispositivos deben generar y registrar sus propias suscripciones independientemente).
- ¿Qué ocurre si la suscripción de un dispositivo expira o es revocada por el navegador? (El sistema debe detectar el fallo al enviar y limpiar esa suscripción inválida de la base de datos).
- **Falta de soporte en el navegador**: Si el entorno del usuario (navegador antiguo, webview) no soporta la API Push, el sistema simplemente ocultará los botones y opciones de suscripción de manera silenciosa (degradación elegante).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE solicitar permisos nativos del navegador para notificaciones.
- **FR-002**: El sistema DEBE generar y almacenar las suscripciones VAPID (`PushSubscription`) por cada dispositivo de un usuario.
- **FR-003**: El sistema DEBE permitir a un usuario tener múltiples dispositivos suscritos simultáneamente.
- **FR-004**: El backend DEBE poder enviar cargas útiles (payloads) de notificaciones push dinámicas firmadas con las llaves VAPID privadas. El payload debe contener: `título`, `cuerpo`, `ícono` y `url`.
- **FR-005**: El Service Worker DEBE interceptar el evento "push" en segundo plano y mostrar la notificación nativa usando la API `showNotification`.
- **FR-006**: El Service Worker DEBE manejar el evento de clic en la notificación (`notificationclick`) para redirigir al usuario a la ruta específica enviada en el payload dinámico del push (enfocando la pestaña de la PWA si existe).

### Key Entities

- **PushSubscription**: Representa el endpoint único, las llaves de encriptación (`p256dh`, `auth`) y el dispositivo del usuario. Relacionado directamente con la entidad `Usuario`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los usuarios que aceptan los permisos logran registrar su dispositivo en la base de datos.
- **SC-002**: El tiempo de entrega desde que el backend dispara la notificación hasta que aparece en el dispositivo del usuario es menor a 5 segundos en condiciones de red estables.
- **SC-003**: El sistema es capaz de entregar exitosamente la notificación al menos al 95% de las suscripciones válidas registradas.

## Assumptions

- Los usuarios utilizan navegadores modernos que soportan la API Service Workers y la Push API (Safari en iOS 16.4+, Chrome, Edge, Firefox).
- El proyecto ya cuenta con PWA y Service Worker configurado (comprobado vía VitePWA).
- El backend y los servicios en la nube utilizados (Edge Functions) tienen soporte para instalar dependencias de terceros para manejar la encriptación web-push.
