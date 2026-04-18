# Historial de Servicios (Admin) 📜

## Descripción
Módulo administrativo que permite visualizar el **historial completo de servicios** de clientes y vehículos, incluyendo:
- Información del cliente y vehículo
- Fotos antes, durante y después del servicio
- Cotizaciones y facturas
- Estado del proyecto
- Descarga de reportes en PDF

## Características

### 1. Búsqueda Flexible
- **Por Cliente**: Busca servicios de un cliente específico por nombre
- **Por Vehículo**: Busca por marca y modelo
- **Por Placa**: Búsqueda exacta de placa del vehículo

### 2. Filtrado
- Filtro por estado del proyecto (Activo, En Progreso, Terminado, Entregado, Cancelado)

### 3. Detalles del Servicio
Cada servicio expandible muestra:

#### 📋 Información General
- Datos del cliente (nombre, correo, teléfono, RFC)
- Datos del vehículo (marca, modelo, año, placas, color, VIN)
- Fechas de ingreso y cierre

#### 📝 Descripción del Servicio
- Descripción completa del trabajo realizado

#### 📸 Fotos del Servicio
- Organizadas por momento: **Antes**, **Durante**, **Después**
- Vista en miniatura con opción de ampliar
- Descripción de cada foto
- Lightbox para visualizar fotos en grande

#### 💰 Cotizaciones y Facturas
- Historial completo de cotizaciones
- Estado de cada cotización (Pendiente, Aprobada, Rechazada)
- Detalle de items (descripción, cantidad, precio unitario, subtotal)
- Desglose de costos:
  - Mano de obra
  - Refacciones
  - **Total**
- Notas de la cotización

### 4. Acciones
- **Descargar PDF**: Genera un PDF con el historial completo del servicio (información, fotos y cotizaciones)

## Estructura de Datos

### Tabla: `proyectos`
```
id, titulo, descripcion, estado, fecha_ingreso, fecha_cierre
```

### Tabla: `clientes`
```
id, nombre, correo, telefono, rfc, direccion
```

### Tabla: `vehiculos`
```
id, marca, modelo, anio, placas, color, vin
```

### Tabla: `fotografias`
```
id, proyecto_id, mecanico_id, diagnostico_id, momento, url, descripcion, created_at
```
- **momento**: antes, durante, despues

### Tabla: `cotizaciones`
```
id, proyecto_id, monto_mano_obra, monto_refacc, monto_total, estado, 
fecha_emision, fecha_respuesta, notas, created_at
```

### Tabla: `cotizacion_items`
```
id, cotizacion_id, descripcion, cantidad, precio_unit, subtotal
```

## Ubicación en la UI
- **Menú Admin**: Historial de Servicios (📜)
- **Path**: `/dashboard` → activeModule: "historial-servicios"

## Componentes

### HistorialServiciosAdmin.jsx
Componente principal que contiene toda la lógica de búsqueda, filtrado y visualización.

### HistorialServiciosAdminWrapper.jsx
Componente wrapper que proporciona el layout correcto con estilos del tema.

## Ejemplo de Uso

```jsx
import HistorialServiciosAdminWrapper from "./components/HistorialServiciosAdminWrapper";

// En App.jsx
{activeModule === "historial-servicios" && <HistorialServiciosAdminWrapper darkMode={darkMode} />}
```

## Variables de Configuración

- **darkMode**: Boolean - Activa/desactiva tema oscuro (heredado del dashboard)
- **searchType**: "cliente" | "vehiculo" | "placa"
- **filtroEstado**: "todos" | "activo" | "en_progreso" | "terminado" | "entregado" | "cancelado"

## Características Futuras

- [ ] Filtrar por rango de fechas
- [ ] Filtrar por precio (min-max)
- [ ] Exportar a Excel
- [ ] Editar descripciones de servicios
- [ ] Agregar fotos desde el historial
- [ ] Generar reportes personalizados
- [ ] Búsqueda avanzada con múltiples criterios

## Notas Técnicas

- Utiliza **Supabase** para todas las consultas a BD
- Las fotos se obtienen de **Supabase Storage** (URL pública)
- PDF generado con **html2canvas** y **jsPDF**
- Soporta **tema claro y oscuro**
- Responsive design para móvil y desktop
