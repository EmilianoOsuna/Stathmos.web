# Checklist de Validación: Developer Readiness (Push Notifications)

**Purpose**: Unit test para la calidad de los requerimientos desde la perspectiva del desarrollador.
**Created**: 2026-05-25
**Feature**: [spec.md](../spec.md)

## Completeness & Clarity (UX / UI Flow)

- [x] CHK001 - ¿Están documentados los estados visuales del botón de suscripción (ej. "Cargando", "Suscrito", "Denegado")? [Clarity, Gap]
- [x] CHK002 - ¿Se especifica el momento o acción exacta del usuario que dispara la solicitud nativa de permisos? [Completeness, Spec §US1]
- [x] CHK003 - ¿El contenido del mensaje de la notificación push (título, cuerpo, ícono) está definido o parametrizado? [Clarity, Gap]

## Scenario Coverage & Edge Cases

- [x] CHK004 - ¿Están definidos los pasos a seguir si el navegador no soporta la API Push o Service Workers? [Coverage, Edge Case]
- [x] CHK005 - ¿El documento especifica cómo proceder si el usuario revoca los permisos directamente desde los ajustes del SO/Navegador? [Coverage, Exception Flow]
- [x] CHK006 - ¿Se indica la frecuencia o los triggers para limpiar suscripciones expiradas o inválidas en la tabla `push_subscriptions`? [Completeness, Spec Edge Cases]
- [x] CHK007 - ¿Existe un requerimiento sobre cómo reaccionar si el usuario intenta suscribirse pero falla la red? [Coverage, Exception Flow]

## Backend & Integration Consistency

- [x] CHK008 - ¿Se documenta la estructura esperada del payload JSON que la Edge Function enviará a los dispositivos? [Clarity, Gap]
- [x] CHK009 - ¿Los requerimientos especifican qué ruta o pantalla debe abrirse al hacer click en la notificación (`notificationclick`)? [Consistency, Spec §US2]
- [x] CHK010 - ¿Están claros los mecanismos de autorización y autenticación para que la Edge Function lea/escriba en `push_subscriptions`? [Consistency, Plan §Data Model]

## Measurability & Non-Functional

- [x] CHK011 - ¿Es el criterio de "entrega menor a 5 segundos" (SC-002) verificable de forma objetiva en un entorno de pruebas sin depender de la red externa? [Measurability, Spec §SC-002]
- [x] CHK012 - ¿Se especifican métricas concretas de carga para las Edge Functions en caso de envíos masivos? [Clarity, Gap]

## Updated Requirements Validation (Post-Clarification)

- [x] CHK013 - ¿Están documentados los campos requeridos vs opcionales en el payload dinámico JSON enviado por el backend? [Clarity, Spec §FR-004]
- [x] CHK014 - ¿Se define cómo manejar la navegación cuando la ruta específica (`url` del payload) requiere autenticación pero la sesión expiró en background? [Coverage, Exception Flow]
- [x] CHK015 - ¿Se especifican las dimensiones o formato requerido para el `ícono` dinámico que se enviará en el payload? [Completeness, Spec §FR-004]
