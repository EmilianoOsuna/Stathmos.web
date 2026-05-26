# Data Model: Corrección Soft Delete Empleados

This feature works with the existing `empleados` and `usuarios` tables. No database schema changes are required.

## Entities

### Empleados (public.empleados)

Represents the staff (mechanics, admins) of the workshop.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, default `gen_random_uuid()` |
| `usuario_id` | `uuid` | Foreign Key referencing `public.usuarios(id)` |
| `nombre` | `text` | Full name of the employee |
| `correo` | `text` | Contact email |
| `telefono` | `text` | Contact phone |
| `rfc` | `text` | SAT RFC identifier |
| `fecha_ingreso` | `date` | Hire/admission date |
| `disponible` | `boolean` | Availability status for new service assignments |
| `activo` | `boolean` | Soft-delete status flag. `true` = Active, `false` = Deactivated. |

### Relationships

- `empleados.usuario_id` references `usuarios.id`.
- When `empleados.activo` is set to `false`, the employee should also be marked as unavailable (`disponible = false`).
