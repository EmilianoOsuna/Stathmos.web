# Research & Technical Decisions: Push Notifications

## 1. Generación de VAPID Keys
- **Decision**: Se utilizará el estándar VAPID (Voluntary Application Server Identification) para firmar las notificaciones.
- **Rationale**: Es el requisito estándar de los navegadores modernos (Chrome, Firefox, Edge) para enviar push notifications sin depender de Firebase Cloud Messaging de manera forzosa, manteniendo la independencia.
- **Alternatives considered**: FCM (Firebase Cloud Messaging). Rechazado por agregar una dependencia pesada al cliente y backend cuando la API nativa Push es suficiente.

## 2. Almacenamiento de Suscripciones
- **Decision**: Crear una tabla `push_subscriptions` en Supabase.
- **Rationale**: Un usuario puede tener múltiples dispositivos (Ej. PC y Celular). Cada dispositivo genera un `PushSubscription` único. La tabla relacionará `user_id` con el JSON de la suscripción.
- **Alternatives considered**: Guardar la suscripción como un array JSON en la tabla `usuarios`. Rechazado porque dificulta la limpieza de suscripciones expiradas y el manejo concurrente.

## 3. Envío desde Backend
- **Decision**: Utilizar la librería `web-push` en la Edge Function de Supabase (`enviar-notificacion`).
- **Rationale**: La Edge Function (basada en Deno) puede importar `web-push` vía CDN (esm.sh) para encriptar y disparar el payload a los endpoints de Google/Apple.

## 4. Service Worker (VitePWA)
- **Decision**: Inyectar un custom service worker utilizando la estrategia `injectManifest` o registrando un manejador de evento `push` global en la configuración de VitePWA.
- **Rationale**: Para interceptar eventos push en background y llamar a `self.registration.showNotification`, se necesita lógica explícita en el Service Worker.
