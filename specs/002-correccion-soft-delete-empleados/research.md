# Research: Corrección Soft Delete Empleados

## Findings & Diagnosis

1. **Root Cause**: In [src/App.jsx](file:///c:/Users/emiliano_osuna/Documents/TEC/INGENIERÍA%20DE%20SOFTWARE/Stathmos.web/src/App.jsx#L867-L875), the `fetchAll` function in `EmpleadosModule` executes the following query:
   ```javascript
   const { data: e, error: eErr } = await supabase
     .from("empleados")
     .select("id,nombre,correo,usuario_id,telefono,rfc,fecha_ingreso,disponible,activo")
     .eq("activo", true)
     .order("nombre");
   ```
   The `.eq("activo", true)` clause filters out all inactive employees.
2. **Impact**: Deactivated employees (soft-deleted) are not fetched from Supabase, making them invisible in the admin table. As a result, the administrator cannot edit or toggle them back to "Activo".
3. **Database Consistency**: The database schema allows `activo = false` for soft delete. The `activo` toggle is handled correctly in the database and triggers, but the UI query limits visibility.
4. **Parity**: The `ClientesModule` fetches all records without filtering `.eq("activo", true)` and successfully renders an active status badge and toggle button.

## Decisions & Rationale

- **Decision**: Remove `.eq("activo", true)` from `EmpleadosModule.fetchAll` to align with the client management module patterns.
- **Rationale**: Since the UI already supports the active badge styling (`activeBadge(e.activo)`) and toggle logic (`BtnToggleActive`), simply removing the filter will restore complete management capability.
- **Alternatives Considered**: 
  - *Adding a separate toggle for "Show Inactive Employees"*: Rejected for now as it adds unnecessary UI complexity. Following the existing `Clientes` tab behavior is the most consistent and simple approach.
