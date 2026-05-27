# Data Model: Sincronización y Aislamiento de Notificaciones Push por Rol

Este documento define el modelo de datos y las restricciones de base de datos asociadas a las suscripciones push de usuario.

## Entidades

### `push_subscriptions`
La tabla `push_subscriptions` almacena las suscripciones activas del navegador para cada usuario registrado.

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Identificador único del registro de suscripción |
| `user_id` | `uuid` | `NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE` | ID del usuario de Supabase Auth dueño de este navegador/token |
| `subscription` | `jsonb` | `NOT NULL` | Objeto de suscripción generado por el navegador (contiene endpoint y keys) |
| `created_at` | `timestamptz`| `DEFAULT now()` | Fecha de creación del registro |

### Restricciones de Unicidad y Validación
- **Endpoint Único**: Para evitar la duplicación de tokens en navegadores compartidos, no debe haber más de un registro activo para el mismo valor de `subscription->>'endpoint'`. El frontend y las Edge Functions aseguran que, al insertar una nueva suscripción, se eliminen los registros antiguos con el mismo endpoint.
- **Relación de Roles**: Para validar el rol antes del envío, la Edge Function cruzará el `user_id` de la suscripción con las tablas del sistema:
  - `public.usuarios.id = user_id`
  - `public.usuarios.rol_id = public.roles.id`
