# Quickstart & Verification Scenarios: Notificaciones por Rol

Este documento contiene los escenarios de prueba manuales para verificar que el aislamiento de notificaciones push funcione correctamente y no haya cruce de roles en dispositivos compartidos.

## Escenarios de Verificación

### Escenario 1: Unicidad de Token al Registrar (Evitar Duplicados)
1. Inicia sesión en la aplicación como **Administrador** en el navegador Chrome.
2. Ve al perfil o sección de notificaciones y haz clic en **"Activar notificaciones"**.
3. Abre el SQL Editor en Supabase y ejecuta:
   ```sql
   select id, user_id, subscription->>'endpoint' from public.push_subscriptions;
   ```
   Toma nota del ID de usuario y el endpoint.
4. Cierra sesión e inicia sesión como **Cliente** en el **mismo** navegador.
5. Haz clic en **"Activar notificaciones"** para este nuevo usuario.
6. Vuelve a ejecutar la consulta SQL anterior.
7. **Verificación**: Confirma que el registro viejo del Administrador ha sido eliminado de la tabla, y que ahora solo existe un registro asociado al Cliente con el mismo endpoint.

---

### Escenario 2: Limpieza de Suscripción en Logout
1. Inicia sesión en la aplicación, activa las notificaciones push.
2. Abre la consola de desarrollador del navegador (F12) en la pestaña Application > Service Workers / Push.
3. Haz clic en **"Cerrar sesión"** en el panel lateral de la aplicación.
4. En el SQL Editor de Supabase, consulta la tabla `push_subscriptions`.
5. **Verificación**: Confirma que el registro del token de este navegador se eliminó completamente de la tabla al cerrar sesión.

---

### Escenario 3: Filtro de Envío por Rol en Edge Function
1. Inicia sesión como **Cliente** en tu navegador.
2. Fuerza una notificación administrativa (por ejemplo, mediante un script de prueba o creando una cita desde otra pestaña).
3. Revisa la consola o los logs de la Edge Function en Supabase:
   ```bash
   supabase logs
   ```
4. **Verificación**: Confirma que la Edge Function detectó que el rol del destinatario no era "administrador" y abortó el envío de la notificación push. El cliente no debe recibir ningún popup emergente de esta notificación.
