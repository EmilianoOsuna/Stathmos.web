# Diagnósticos de Vehículos 📋

## Descripción
Módulo que permite a los **Mecánicos** registrar y gestionar diagnósticos iniciales de fallas encontradas en vehículos durante la inspección.

## Características

### 1. Registro de Diagnóstico Inicial
Los mecánicos pueden registrar:
- **Síntomas Observados** (obligatorio): Describe qué comportamientos anormales presenta el vehículo
- **Hallazgos Encontrados** (opcional): Detalle de lo encontrado durante la inspección
- **Causa Raíz** (opcional): Análisis inicial de la causa del problema

### 2. Visualización de Diagnósticos
- Lista de todos los proyectos asignados al mecánico
- Estado del proyecto (Activo, En Progreso, Terminado, Entregado, Cancelado)
- Información del cliente y vehículo
- Indicador visual si ya existe diagnóstico inicial
- Historial completo de diagnósticos (inicial y final)

### 3. Búsqueda y Filtrado
- Búsqueda por nombre de proyecto, cliente o placa
- Filtrado por estado del proyecto
- Contador de proyectos con diagnóstico inicial registrado

### 4. Gestión de Diagnósticos
- Ver diagnósticos anteriores expandiendo cada proyecto
- Editar diagnóstico inicial (si existe)
- Eliminar diagnósticos
- Información del mecánico que lo registró y fecha

## Acceso

**Rol**: Mecánico  
**Ubicación**: Dashboard Mecánico → Diagnósticos (📋)  
**Path**: activeModule = "diagnosticos"

## Componentes

### MecanicoDiagnosticosModule.jsx
Componente principal que muestra:
- Lista de proyectos asignados
- Búsqueda y filtrado
- Botón para abrir modal de diagnóstico
- Contador de diagnósticos registrados

### DiagnosticoModal.jsx
Modal para registrar nuevo diagnóstico:
- Campo de síntomas (obligatorio)
- Campo de hallazgos (opcional)
- Campo de causa raíz (opcional)
- Validaciones
- Mensaje de éxito/error

### DiagnosticoView.jsx
Componente para visualizar diagnósticos registrados:
- Lista expandible de diagnósticos
- Clasificación por tipo (inicial/final)
- Información del mecánico y fecha
- Botones de edición y eliminación

## Estructura de Datos

### Tabla: `diagnosticos`
```sql
CREATE TABLE public.diagnosticos (
  id          uuid                    NOT NULL DEFAULT gen_random_uuid(),
  proyecto_id uuid                    NOT NULL,
  mecanico_id uuid                    NOT NULL,
  tipo        public.tipo_diagnostico NOT NULL,  -- 'inicial' o 'final'
  sintomas    text,
  hallazgos   text,
  causa_raiz  text,
  created_at  timestamptz                      DEFAULT now()
);
```

### Relaciones
- `proyecto_id` → proyectos.id
- `mecanico_id` → empleados.id
- tipo: ENUM ('inicial', 'final')

## Flujo de Uso

1. **Mecánico accede al módulo** "Diagnósticos"
2. **Ve lista de proyectos asignados** con búsqueda/filtrado
3. **Selecciona proyecto** y hace click en "Registrar Diagnóstico"
4. **Se abre modal** con campos para:
   - Síntomas (obligatorio)
   - Hallazgos (opcional)
   - Causa raíz (opcional)
5. **Guarda el diagnóstico** → se actualiza la vista automáticamente
6. **Puede ver diagnósticos anteriores** expandiendo el proyecto
7. **Puede editar o eliminar** si es necesario

## Validaciones

✅ Síntomas: Campo obligatorio, no puede estar vacío  
✅ Hallazgos: Opcional, máximo 1000 caracteres  
✅ Causa raíz: Opcional, máximo 1000 caracteres  
✅ Un proyecto puede tener múltiples diagnósticos (inicial y final)  
✅ Solo se permite UN diagnóstico inicial por proyecto

## Estados Visuales

### Modal
- **Cargando**: Botón deshabilitado con "Guardando..."
- **Éxito**: Mensaje de confirmación verde
- **Error**: Mensaje de error rojo

### Proyecto sin diagnóstico
- Botón naranja: "Registrar Diagnóstico"

### Proyecto con diagnóstico
- Botón gris: "Diagnóstico Registrado" (deshabilitado)

## Ejemplo de Registro

**Síntomas:**
```
Motor hace ruido extraño al acelerar, especialmente en revoluciones altas. 
El vehículo pierde potencia intermitentemente.
```

**Hallazgos:**
```
Bujías desgastadas, cables de encendido con oxidación visible.
Filtro de aire muy sucio.
```

**Causa raíz:**
```
Combinación de ignición deficiente por bujías viejas y mala circulación de aire.
Requiere cambio de bujías y filtro de aire.
```

## Características Futuras

- [ ] Adjuntar fotos al diagnóstico
- [ ] Campos personalizables por tipo de vehículo
- [ ] Template de diagnósticos comunes
- [ ] Estimación de tiempo de reparación
- [ ] Autorización del cliente antes de proceder
- [ ] Historial de cambios en diagnósticos
- [ ] Exportar diagnóstico a PDF

## Notas Técnicas

- Usa Supabase para almacenamiento de datos
- Obtiene automáticamente el ID del mecánico de su email
- Carga diagnósticos en tiempo real
- Soporta tema claro y oscuro
- Responsive design para móvil y desktop
