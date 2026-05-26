# Data Model: Sincronización en Tiempo Real

Esta funcionalidad no introduce cambios en la estructura de la base de datos de Supabase, pero implementa un modelo de datos en memoria para la multiplexación de suscripciones WebSocket.

## Estructura en Memoria (SuscripcionRegistry)

El objeto global `channelRegistry` se define a nivel de módulo en `src/hooks/useSupabaseRealtime.js`. Mapea las tablas de base de datos activas a sus correspondientes canales y conjuntos de callbacks de componentes de React.

### channelRegistry (Map/Object)
- **Key**: `table` (string, ej: `"refacciones"`, `"citas"`)
- **Value**: Objeto de suscripción de canal (`TableSubscription`)

### TableSubscription (Object)
- **channel**: `SupabaseRealtimeChannel` (Instancia de canal de Supabase suscrita mediante `.subscribe()`)
- **callbacks**: `Set<Function>` (Conjunto de funciones callback registradas por los componentes activos que invocan el hook)
- **refCount**: `number` (Contador de componentes que actualmente están suscritos a esta tabla. Se incrementa al montar y se decrementa al desmontar)
- **status**: `string` (Estado actual del canal: `"SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR"`)

---

## Mapeo de Suscripciones en Pantallas

A continuación se detalla el conjunto de tablas a las que se suscribe cada componente para asegurar que su interfaz se actualiza sin refrescar la página:

| Componente / Módulo | Tabla de Base de Datos | Disparador de Sincronización |
| :--- | :--- | :--- |
| **ClientesModule** | `clientes` | Inserción, actualización o desactivación de un cliente. |
| **EmpleadosModule** | `empleados` | Cambios en el perfil o estado activo/disponible de mecánicos/empleados. |
| **VehiculosModule** | `vehiculos` | Alta, edición de placas/propietario o desactivación de vehículos. |
| **CitasModule** | `citas`, `dias_inhabiles` | Agendado de citas, cambios de estado y fechas no laborables. |
| **RefaccionesModule** | `refacciones` | Ventas, compras o ajustes manuales de stock en el catálogo. |
| **CompraRefacciones** | `refacciones`, `proveedores`, `proyectos` | Altas de piezas, nuevos proveedores o proyectos creados. |
| **VentaRefacciones** | `refacciones`, `clientes`, `proyectos` | Altas de piezas, nuevos clientes registrados o proyectos creados. |
| **ProyectosModule** | `proyectos`, `cotizaciones`, `fotografias`, `clientes`, `vehiculos`, `empleados` | Cambios en el flujo del taller, edición de vehículos/clientes propietarios y asignaciones de mecánicos. |
| **Ticket (Cliente)** | `proyectos`, `cotizaciones`, `fotografias`, `pagos` | Avances reportados por el mecánico, montos de cobro y registro de pagos. |
| **HistorialTickets (Cliente)** | `proyectos` | Cambios de estado en los vehículos del cliente en el taller. |
