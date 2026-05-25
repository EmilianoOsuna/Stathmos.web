# Data Model: Push Notifications

## Base de Datos (Supabase)

### Tabla: `push_subscriptions`

Esta tabla almacena los endpoints únicos de los navegadores de los usuarios.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | PK, Default gen_random_uuid() | Identificador único de la suscripción |
| `user_id` | `uuid` | FK -> auth.users(id), Not Null | Usuario al que pertenece el dispositivo |
| `subscription` | `jsonb` | Not Null | El objeto PushSubscription crudo devuelto por el navegador (contiene `endpoint`, `keys.p256dh`, `keys.auth`) |
| `created_at` | `timestamptz` | Default now() | Fecha de registro |

### Índices
- Índice en `user_id` para búsquedas rápidas al momento de enviar notificaciones.

### RLS (Row Level Security)
- **Insert**: Los usuarios autenticados solo pueden insertar registros donde `user_id == auth.uid()`.
- **Select**: Los usuarios solo pueden ver sus propias suscripciones (o solo lectura para el rol de servicio `service_role` en las Edge Functions).
- **Delete**: Los usuarios pueden borrar sus propias suscripciones (ej. al cerrar sesión o desactivar notificaciones).

## Entidades de la Aplicación (Frontend)

### Objeto `PushSubscription` (Nativo del Navegador)
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "expirationTime": null,
  "keys": {
    "p256dh": "B... (llave pública del cliente)",
    "auth": "C... (secreto de autenticación)"
  }
}
```
Este es el objeto exacto que se almacena en la columna `subscription` de Supabase.
