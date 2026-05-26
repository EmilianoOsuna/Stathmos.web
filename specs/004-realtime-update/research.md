# Technical Research & Decisions: Optimización y Cobertura de Actualizaciones en Tiempo Real

## Decision 1: Multiplexador de Canales en Tiempo Real (SuscripcionRegistry)

### Rationale
Actualmente, el hook `useSupabaseRealtime` crea un canal de WebSocket único para cada componente que lo monte. Si hay 5 componentes activos escuchando la tabla `refacciones`, se abren 5 conexiones de canal paralelas, lo que consume recursos innecesarios del cliente y excede los límites de conexiones concurrentes en los planes gratuitos de Supabase.

Implementaremos un registro de canales compartido a nivel de módulo en `useSupabaseRealtime.js`. Este registro almacenará por cada tabla activa:
1. El canal de Supabase suscrito.
2. Un conjunto (`Set`) de funciones callback de componentes activos.
3. El número de referencias de suscripciones activas (`refCount`).

Al montar el hook:
- Si la tabla no está registrada, creamos el canal de Supabase, lo suscribimos, agregamos el callback al `Set` e inicializamos `refCount = 1`.
- Si la tabla ya está en el registro, simplemente añadimos el callback al `Set` e incrementamos `refCount`.

Al desmontar el hook:
- Disminuimos `refCount` y removemos el callback del `Set`.
- Si `refCount` llega a 0, desuscribimos el canal (`supabase.removeChannel`) y lo removemos del registro en memoria.

### Alternatives Considered
- **React Context**: Crear un proveedor de contexto de tiempo real. Se rechazó porque añade anidamiento innecesario en el árbol de componentes de `App.jsx` y complejidad en la inicialización, mientras que una variable de módulo en el archivo del hook es más ligera y directa.
- **Suscripciones Manuales en Componentes**: Se descartó porque viola el principio de DRY y dispersa la lógica de red.

---

## Decision 2: Monitoreo Global del Estado de Conexión de Supabase (Connection Status UI)

### Rationale
Para cumplir con el requerimiento **FR-007** e informar al usuario sobre desconexiones temporales, aprovecharemos los eventos que emite directamente el cliente `supabase.realtime` (instancia de `RealtimeClient` de la SDK de Supabase).

El cliente de Realtime expone los métodos y callbacks:
- `supabase.realtime.connectionState()`: Retorna `"connecting" | "open" | "closing" | "closed"`.
- `supabase.realtime.onOpen(callback)`: Se ejecuta cuando se establece la conexión.
- `supabase.realtime.onClose(callback)`: Se ejecuta al cerrarse.
- `supabase.realtime.onError(callback)`: Se ejecuta al ocurrir un fallo.

Crearemos una función exportada en `useSupabaseRealtime.js` o un hook compañero `useSupabaseConnectionState()` que devuelva el estado unificado `"connected" | "connecting" | "disconnected"`.
En `UIPrimitives.jsx`, crearemos un componente visual `<ConnectionStatusBadge />` que consuma este estado y muestre:
- Círculo verde fijo si está conectado.
- Círculo naranja parpadeante con la leyenda "Reconectando..." si está reconectando o desconectado.

### Alternatives Considered
- **Medición por canal**: Monitorear el estado de cada canal individualmente (`SUBSCRIBED`, `CHANNEL_ERROR`, `CLOSED`). Se descartó por ser más compleja y ruidosa que escuchar el estado general del cliente WebSocket de Supabase.

---

## Decision 3: Debouncing para Modificaciones de Alta Frecuencia

### Rationale
Cuando ocurren actualizaciones masivas en base de datos (por ejemplo, al procesar inventarios grandes), el callback de tiempo real puede dispararse decenas de veces por segundo. Para evitar bloqueos en el hilo principal de renderizado de React por llamadas excesivas a funciones de fetch, la ejecución de los callbacks registrados en el multiplexador se agrupará mediante un pequeño debounce/throttle de 150ms.

```javascript
let debounceTimeout = null;
const triggerCallbacks = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    callbacks.forEach(cb => cb());
  }, 150);
};
```

---

## Decision 4: Estrategia de Cobertura en Pantallas

### Rationale
Se integrará la suscripción a tiempo real en las siguientes vistas:
- `CompraRefacciones.jsx`: Se suscribe a `refacciones` (stock/precios), `proveedores` (nombres) y `proyectos` (títulos de proyectos activos).
- `VentaRefacciones.jsx`: Se suscribe a `refacciones` (stock/precios), `clientes` (nombres) y `proyectos` (proyectos activos).
- `ProyectosModule` (en `App.jsx`): Se añaden suscripciones auxiliares para las tablas `clientes`, `vehiculos` y `empleados` para actualizar en tiempo real los dropdowns de selección del formulario de creación y edición.
- `Ticket.jsx` y `HistorialTickets.jsx`: Sincronización completa de proyectos, cotizaciones y fotografías en tiempo real para el portal del cliente.
