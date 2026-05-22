# Documentación Técnica - Stathmos.web

## Introducción
Este documento resume la documentación técnica agregada al proyecto siguiendo el estándar **JSDoc** para JavaScript/TypeScript. Cada función y componente incluye su propósito, parámetros con tipos y descripciones, y valor de retorno.

## Estándar Utilizado
- **JSDoc** (estándar de documentación para JavaScript/TypeScript)
- Formato: `/** ... */` encima de cada función
- Incluye: `@param`, `@returns`, `@async`, `@component`, `@throws` según corresponda
- Parámetros opcionales indicados con `[nombreParam=default]`

---

## Archivos Documentados

### 1. Utilidades - `src/utils/datetime.js`
**Propósito:** Funciones de formateo de fecha y hora en zona horaria del taller (México).

#### Funciones:
1. **`toWorkshopYmd(value)`**
   - Convierte fecha a formato YYYY-MM-DD (zona horaria del taller)
   - Entrada: `string|Date|number`
   - Salida: `string` (ej: "2026-05-10")

2. **`formatDateWorkshop(value, options)`**
   - Formatea fecha a formato legible en español
   - Entrada: `string|Date|number`, opciones de formateo
   - Salida: `string` (ej: "10/5/2026") o "—"

3. **`formatTimeWorkshop(value, options)`**
   - Formatea hora a formato HH:mm en español
   - Entrada: `string|Date|number`, opciones de formateo
   - Salida: `string` (ej: "14:30") o "—"

4. **`formatDateTimeWorkshop(value, options)`**
   - Formatea fecha y hora completa en español
   - Entrada: `string|Date|number`, opciones de formateo
   - Salida: `string` (ej: "10/05/2026 14:30") o "—"

5. **`todayWorkshopYmd()`**
   - Obtiene fecha actual en formato YYYY-MM-DD
   - Entrada: ninguna
   - Salida: `string` (fecha actual del taller)

---

### 2. Hooks - `src/hooks/useSupabaseRealtime.js`
**Propósito:** Hook React para monitorear cambios en tiempo real en tablas de Supabase.

#### Hook:
**`useSupabaseRealtime(table, callback)`**
- Escucha cambios (INSERT, UPDATE, DELETE) en una tabla específica
- Parámetros:
  - `table`: `string` - Nombre de la tabla a monitorear
  - `callback`: `Function` - Función a ejecutar cuando hay cambios
- Usa canal Postgres real-time de Supabase
- Se limpia automáticamente al desmontar

---

### 3. Funciones Supabase Edge - `supabase/functions/`

#### 3.1 Enviar Notificación
**Archivo:** `enviar-notificacion/index.ts`

**Propósito:** Crear notificación para un usuario y registrar auditoría.

**Entrada (POST):**
```
{
  usuario_id: string (requerido),
  proyecto_id?: string (opcional),
  titulo: string (requerido),
  mensaje: string (requerido)
}
```

**Salida (Éxito):**
```
{
  success: true,
  notificacion: {id, usuario_id, proyecto_id, titulo, mensaje, leida, created_at}
}
```

---

#### 3.2 Agendar Cita
**Archivo:** `agendar-cita/index.ts`

**Propósito:** Agendar cita de servicio con validación de horarios y disponibilidad.

**Funciones Auxiliares Documentadas:**
- `normalizeRole()` - Normaliza texto de rol
- `toCanonicalRole()` - Convierte a rol estándar ("administrador", "mecanico", "cliente")
- `hmToMinutes()` - Convierte HH:mm a minutos
- `getDateDay()` - Obtiene día de la semana (0-6)
- `isValidSlot()` - Valida horario (debe ser dentro de 9-14 o 17-20 de lunes a viernes, 9-14 sábado)

**Entrada (POST):**
```
{
  fecha: string YYYY-MM-DD (requerido),
  hora: string HH:mm (requerido),
  vehiculo_id: string (requerido),
  servicio: string (requerido),
  notas?: string (opcional),
  cliente_id?: string (solo admin)
}
```

**Validaciones:**
- Token Bearer requerido
- Horario válido según horario comercial
- Vehículo pertenece al cliente
- No hay otra cita en ese horario
- Fecha no es día inhábil

---

#### 3.3 Crear Cliente
**Archivo:** `crear-cliente/index.ts`

**Propósito:** Crear cliente e invitar por correo para completar registro.

**Funciones Auxiliares Documentadas:**
- `getInviteRedirectTo()` - Obtiene URL de redirección para invitación
- `isValidRFC()` - Valida formato RFC mexicano (12-13 caracteres)
- `isValidEmail()` - Valida formato de correo

**Entrada (POST):**
```
{
  nombre: string (requerido),
  correo: string (requerido, válido),
  telefono: string (requerido),
  rfc?: string (opcional, formato mexicano),
  direccion?: string (opcional)
}
```

**Validaciones:**
- Email válido
- RFC válido si se proporciona

**Salida:** Éxito simple o error

---

#### 3.4 Crear Pago
**Archivo:** `crear-pago/index.ts`

**Propósito:** Crear registro de pago para un proyecto con cotización aprobada.

**Entrada (POST):**
```
{
  proyecto_id: string (requerido),
  monto: number (requerido, > 0),
  metodo_cobro: string (requerido: "efectivo", "tarjeta", "transferencia", "otro"),
  referencia?: string (opcional),
  factura_id?: string (opcional)
}
```

**Flujo:**
1. Verifica acceso al proyecto (RLS)
2. Valida cotización aprobada
3. Crea o recupera factura
4. Inserta pago
5. Registra auditoría
6. Notifica administradores

---

#### 3.5 Resolver Cita
**Archivo:** `resolver-cita/index.ts`

**Propósito:** Aceptar, rechazar o cancelar automáticamente una cita.

**Entrada (POST):**
```
{
  cita_id: string (requerido),
  accion: string (requerido: "aceptar", "rechazar", "auto_cancelar")
}
```

**Permisos:**
- "auto_cancelar": sin restricciones
- "aceptar"/"rechazar": solo admin y mecánico

---

#### 3.6 Resolver Cotización
**Archivo:** `resolver-cotizacion/index.ts`

**Propósito:** Aprobar o rechazar cotización con validación de stock.

**Funciones Auxiliares Documentadas:**
- `normalizeRole()` - Normaliza rol
- `toCanonicalRole()` - Rol estándar
- `getUserRole()` - Obtiene rol del usuario desde BD o metadatos
- `getClienteIdForUser()` - Obtiene cliente asociado a usuario
- `buildStockShortage()` - Construye lista de refacciones con stock insuficiente

**Entrada (POST):**
```
{
  cotizacion_id: string (requerido),
  accion: string (requerido: "aprobar", "rechazar"),
  notas?: string (opcional),
  cliente_id?: string (opcional)
}
```

**Salida (si hay faltantes):**
```
{
  success: true,
  warning: "Stock insuficiente",
  stock_shortage: [
    {item_id, refaccion_id, nombre, numero_parte, stock_disponible, cantidad_requerida}
  ]
}
```

---

#### 3.7 Crear Empleado
**Archivo:** `crear-empleado/index.ts`

**Propósito:** Crear empleado e invitar por correo (solo admin).

**Funciones Auxiliares Documentadas:**
- `getInviteRedirectTo()` - Obtiene URL de redirección

**Entrada (POST):**
```
{
  nombre: string (requerido),
  correo: string (requerido),
  rol_destino: string (requerido: "Administrador", "Mecánico"),
  telefono?: string (opcional),
  rfc?: string (opcional),
  fecha_contratacion?: string YYYY-MM-DD (opcional)
}
```

**Validaciones:**
- Token Bearer requerido
- Usuario debe ser administrador

---

### 4. Componentes React - `src/components/`

#### 4.1 Ticket Component
**Archivo:** `Ticket.jsx`

**Propósito:** Vista principal y detallada de un proyecto (ticket de servicio).

**Props:**
- `proyectoId`: `string` (requerido) - ID del proyecto
- `darkMode`: `boolean` (default: false) - Tema oscuro
- `onClose`: `Function` (opcional) - Callback al cerrar
- `showOmit`: `boolean` (default: true) - Mostrar botón de cerrar

**Características Documentadas:**
- Información general del vehículo y cliente
- Diagnósticos registrados
- Cotizaciones con aprobación
- Refacciones utilizadas
- Fotos (antes/durante/después)
- Procesamiento de pagos
- Generación de PDF

**Métodos Documentados:**
- `getLatestCotizacion()` - Obtiene cotización más reciente y aprobada
- `fetchTicket()` - Obtiene datos completos del ticket

---

#### 4.2 DiagnosticoView Component
**Archivo:** `DiagnosticoView.jsx`

**Propósito:** Vista expandible de historial de diagnósticos de un proyecto.

**Props:**
- `proyectoId`: `string` (requerido)
- `mecanico_id`: `string` (opcional)
- `darkMode`: `boolean` (default: false)
- `onEdit`: `Function` (opcional) - Callback para editar

**Características Documentadas:**
- Lista expandible de diagnósticos
- Información de síntomas, hallazgos, causa raíz
- Datos del mecánico que realizó
- Manejo de estados (carga, error, vacío)

**Métodos Documentados:**
- `fetchDiagnosticos()` - Obtiene diagnósticos desde BD
- `cleanHallazgosText()` - Limpia texto removiendo etiquetas

---

## Guía de Uso para Desarrolladores

### ¿Cómo leer la documentación?

1. **Busca el comentario JSDoc** antes de cada función/componente
2. **Lee el propósito** - Descripción clara de qué hace
3. **Revisa los parámetros** - Tipo, descripción, y si es opcional
4. **Entiende el retorno** - Tipo y descripción del valor retornado
5. **Para Supabase:** Lee el flujo explicado en la documentación

### Ejemplo de Lectura:

```javascript
/**
 * Crea una notificación.
 * @param {string} usuario_id - ID del usuario que recibirá la notificación
 * @param {string} titulo - Título de la notificación
 * @returns {Object} Notificación creada con id, titulo, mensaje, etc.
 */
function crearNotificacion(usuario_id, titulo) { ... }
```

Se lee como:
- **Propósito:** Crea una notificación
- **Parámetro 1:** usuario_id (string, requerido)
- **Parámetro 2:** titulo (string, requerido)
- **Retorna:** Objeto con la notificación

---

## Pendiente de Documentar

Se pueden agregar documentaciones adicionales a:

### Componentes React
- `App.jsx` - Componente principal
- `HistorialServiciosAdmin.jsx`
- `MecanicoDiagnosticosModule.jsx`
- `HistorialTickets.jsx`
- `CentroReportes.jsx`
- Y otros componentes en `src/components/`

### Funciones Supabase
- `gestionar-inventario/`
- `crear-dia-inhabil/`
- `eliminar-dia-inhabil/`
- `listar-dias-inhabiles/`
- `reintegrar-cotizacion/`
- `autorizar-pago/`
- `setup-admin/`

### Archivos principales
- `src/App.jsx` - Lógica de enrutamiento y estado global
- `src/supabase.js` - Inicialización de cliente Supabase
- `src/main.jsx` - Punto de entrada

---

## Mantenimiento

Esta documentación debe actualizarse cuando:
- Se agregan nuevas funciones o parámetros
- Cambia el comportamiento de una función
- Se refactoriza el código
- Se agregan componentes nuevos

**Responsabilidad:** Cada desarrollador que modifique el código debe actualizar la documentación correspondiente.

---

## Referencias

- [JSDoc Standard](https://jsdoc.app/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Hooks Documentation](https://react.dev/reference/react/hooks)

