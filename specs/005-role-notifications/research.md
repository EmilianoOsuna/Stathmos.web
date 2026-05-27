# Technical Research & Decisions: Sincronización y Aislamiento de Notificaciones Push por Rol

## Decision 1: Prevención de Duplicados de Tokens Push (Evitar Cruce de Roles)

### Rationale
El problema de que a un Cliente le lleguen notificaciones de un Administrador se debe a que ambos usuarios iniciaron sesión secuencialmente en el mismo navegador y registraron la misma suscripción de push (`endpoint`). Esto genera múltiples filas en `push_subscriptions` con distintos `user_id` pero el mismo token/endpoint físico. Cuando el servidor envía un push al Administrador, localiza el token del navegador y lo envía, pero el navegador muestra la notificación push sin importar qué sesión de usuario esté activa en la interfaz.

Para solucionar esto de raíz, implementaremos una restricción en la base de datos o en la consulta antes de insertar: antes de guardar una nueva suscripción push para el usuario actual en `usePushNotifications.js`, eliminaremos cualquier registro existente en `push_subscriptions` que tenga el mismo endpoint. Esto garantiza que un token de navegador solo pertenezca a un usuario a la vez.

### Alternatives Considered
- **Filtro del lado del Service Worker**: Que el service worker verifique el usuario actual en localStorage antes de mostrar la notificación push. Se rechazó porque el service worker corre en un hilo separado del navegador y no tiene acceso síncrono al estado local de React o la sesión de Supabase si la pestaña está cerrada.
- **Limpieza exclusiva al hacer Logout**: Confiar únicamente en eliminar el token cuando el usuario da click en cerrar sesión. Se rechazó como solución única porque si el usuario limpia las cookies, la sesión expira sola, o el usuario cierra el navegador directamente, el flujo de logout no se ejecuta y el token viejo queda huérfano en la base de datos.

---

## Decision 2: Limpieza de Suscripción en el Cierre de Sesión (Logout)

### Rationale
Para garantizar la privacidad inmediata al presionar "Cerrar sesión" en la barra de navegación, la función `handleLogout` de `App.jsx` debe ser asíncrona y ejecutar la baja de la suscripción del navegador actual en la base de datos de Supabase antes de llamar a `supabase.auth.signOut()`. De esta forma, el token queda desvinculado antes de que las credenciales del usuario expiren en el cliente.

### Alternatives Considered
- **No limpiar en logout y confiar solo en expiración**: Se rechazó porque compromete la privacidad del usuario en computadoras o dispositivos compartidos (por ejemplo, en el taller).

---

## Decision 3: Validación del Rol de Destinatario en la Edge Function

### Rationale
La función `enviar-notificacion` actúa como puerta de enlace de envíos. Si bien el frontend envía la notificación al `usuario_id` correcto, agregaremos una regla de seguridad en la Edge Function para validar que si se intenta notificar sobre eventos críticos de roles (ej. pagos, citas nuevas que son exclusivas de admin), el `usuario_id` destinatario realmente posea dicho rol en la base de datos (`usuarios` -> `roles`).

### Alternatives Considered
- **Bypass de roles**: Confiar plenamente en que el frontend siempre enviará el ID de usuario correcto. Se rechazó porque ante un bug o manipulación de cliente, un usuario podría recibir notificaciones confidenciales.
