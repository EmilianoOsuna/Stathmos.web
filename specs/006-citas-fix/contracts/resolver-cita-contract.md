# API Contract: resolver-cita

The `resolver-cita` Edge Function resolves the state of an appointment (cita).

## Request

- **HTTP Method**: `POST`
- **URL**: `https://<supabase-project-id>.supabase.co/functions/v1/resolver-cita`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <user-jwt-token>` (Required)

### Request Body
```json
{
  "cita_id": "d3b07384-d113-4a15-b5d1-13f511dfbc3b",
  "accion": "aceptar"
}
```
- `cita_id` (string/UUID, required): The ID of the appointment.
- `accion` (string, required): One of:
  - `"aceptar"`: Sets appointment state to `confirmada` (Authorized roles: `administrador`, `mecanico`).
  - `"rechazar"`: Sets appointment state to `cancelada` (Authorized roles: `administrador`, `mecanico`).
  - `"auto_cancelar"`: Sets appointment state to `cancelada` if the appointment date is in the past (No role restrictions; clients can only auto-cancel their own appointments).

---

## Response

### Success Response (`200 OK`)
```json
{
  "success": true,
  "estado": "confirmada",
  "auto_cancelada": false
}
```

### Error Responses

#### `401 Unauthorized`
Returned if the `Authorization` header is missing, invalid, or the user session token has expired.
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### `403 Forbidden`
Returned if the authenticated user lacks the required role to execute the requested action.
```json
{
  "success": false,
  "error": "No autorizado para validar citas"
}
```

#### `400 Bad Request`
Returned if required body fields are missing or an invalid action was provided.
```json
{
  "success": false,
  "error": "Faltan campos: cita_id, accion"
}
```

#### `404 Not Found`
Returned if the appointment ID does not exist in the database.
```json
{
  "success": false,
  "error": "Cita no encontrada"
}
```
