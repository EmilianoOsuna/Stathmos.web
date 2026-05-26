# Quickstart & Verification Scenarios: Tiempo Real

Este documento detalla las pruebas manuales y los escenarios de verificación para asegurar que la multiplexación de canales WebSocket y la cobertura en tiempo real de pantallas funcione correctamente.

## Escenarios de Verificación

### Escenario 1: Multiplexación de WebSocket (Consolidación de Canales)
1. Inicia sesión en la aplicación.
2. Abre la consola de desarrollo del navegador (F12) en la pestaña de red (Network) y filtra por la pestaña "WS" (WebSockets).
3. Navega al módulo de **Citas**. Verás que se establece la conexión WebSocket con Supabase Realtime y se registra la suscripción a `citas` y `dias_inhabiles`.
4. Abre otra pestaña del navegador en la misma sesión o renderiza componentes que también escuchen la tabla `citas` (por ejemplo, los reportes en el panel de administración).
5. **Verificación**: Confirma en la consola de red que no se crean conexiones de WebSocket adicionales redundantes ni se envían múltiples mensajes de suscripción `subscribe` para la misma tabla. Solo debe existir una única suscripción activa para la tabla `citas`.

---

### Escenario 2: Sincronización en Tiempo Real de Ventas y Compras
1. Abre dos navegadores o una ventana en modo incógnito:
   - **Navegador A**: Inicia sesión como administrador y navega a **Gestión de Inventario > Catálogo**.
   - **Navegador B**: Inicia sesión como administrador/mecánico y navega a **Gestión de Inventario > Ventas** (o **Compras**).
2. En el **Navegador A**, edita el stock de una refacción (ej. disminuye la cantidad de "Frenos delanteros" de 10 a 5) o cambia el precio.
3. En el **Navegador B**, observa el listado de refacciones disponibles en la sección de Ventas.
4. **Verificación**: Sin necesidad de refrescar la pantalla en el Navegador B, el stock disponible y el precio deben cambiar instantáneamente (dentro de los 2 segundos posteriores al guardado en A).

---

### Escenario 3: Desconexión y Reconexión WebSocket (UI Indicator)
1. Abre la aplicación y busca el indicador de conexión (un círculo verde en la TopBar).
2. **Caso Desconexión**: Desactiva la conexión a internet (puedes simularlo usando la opción "Offline" en la pestaña de red de Chrome DevTools).
3. **Verificación**: El indicador debe cambiar inmediatamente de círculo verde (Conectado) a un círculo naranja parpadeante indicando "Reconectando...".
4. **Caso Reconexión**: Activa de nuevo la conexión a internet.
5. **Verificación**: El indicador debe cambiar a verde fijo una vez que el WebSocket de Supabase se reconecte con éxito.

---

### Escenario 4: Portal del Cliente (Actualización de Notas y Fotos)
1. **Vista Mecánico**: Abre el detalle de un proyecto activo y escribe una nueva nota en las observaciones o sube una fotografía.
2. **Vista Cliente**: Abre la pantalla del ticket del proyecto correspondiente en el portal del cliente.
3. **Verificación**: Las observaciones del mecánico y la fotografía subida deben renderizarse automáticamente en la pantalla del cliente en tiempo real sin requerir una recarga manual del navegador.
