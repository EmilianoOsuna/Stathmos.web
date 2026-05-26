# Quickstart: Verificación Corrección Soft Delete Empleados

Este documento detalla los pasos para validar localmente que el flujo de soft delete y reactivación de empleados funcione correctamente.

## Requisitos Previos

1. Asegúrate de estar en la rama: `002-correccion-soft-delete-empleados`.
2. Servidor de desarrollo corriendo localmente: `npm run dev`.

## Pasos para la Verificación

### 1. Inactivar un Empleado
1. Inicia sesión como Administrador en el panel de control.
2. Navega al módulo **Personal** (sección de empleados).
3. Ubica un empleado activo en la lista y presiona el botón **Desactivar**.
4. Confirma la acción en la ventana modal de advertencia.
5. **Resultado Esperado**: El empleado ahora debe permanecer en la lista pero mostrar el badge de **Inactivo** (gris) y su disponibilidad debe cambiar a **No**.

### 2. Reactivar el Empleado
1. En el mismo módulo **Personal**, localiza al empleado recién desactivado.
2. Presiona el botón **Activar** correspondiente a ese empleado.
3. Confirma la acción en la ventana modal de confirmación.
4. **Resultado Esperado**: El estado del empleado debe cambiar inmediatamente a **Activo** (verde) y estar disponible nuevamente en el sistema.
