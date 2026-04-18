# 📊 Reportes Operativos - Documentación

## Descripción General

El módulo **Reportes Operativos** proporciona análisis completos sobre la productividad del taller, estatus de órdenes de servicio y uso de refacciones durante un período seleccionado.

**Ubicación:** Admin Dashboard → 📊 Reportes Operativos

---

## Características Principales

### 1. **Selección de Período**
- Permite seleccionar fecha de inicio y fin
- Por defecto muestra los últimos 30 días
- Rango de fechas flexible

### 2. **Tres Tipos de Reportes**

#### 📈 Reporte de Productividad
- **Información:** Productividad de cada mecánico
- **Métricas:**
  - Total de proyectos asignados
  - Proyectos completados
  - Porcentaje de completación
  - Monto total facturado
  - Promedio por proyecto
- **Ordenamiento:** Por número de proyectos completados (descendente)

#### 📋 Reporte de Estatus de Órdenes
- **Información:** Distribución de órdenes por estado
- **Estados Incluidos:**
  - Activo
  - En Progreso
  - Terminado
  - Entregado
  - Cancelado
  - Pendiente de Cotización
- **Visualización:** Tabla + gráficos de barras de progreso
- **Métricas:** Cantidad absoluta y porcentaje

#### 🔩 Reporte de Uso de Refacciones
- **Información:** Top 20 refacciones más usadas
- **Métricas:**
  - Número de parte
  - Total de unidades vendidas
  - Número de transacciones
  - Monto total de ventas
- **Ordenamiento:** Por unidades vendidas (descendente)

### 3. **Resumen General**
Tarjetas informativas que muestran:
- Período del reporte
- Total de órdenes registradas
- Número de mecánicos activos
- Cantidad de refacciones diferentes usadas
- Monto total de ventas de refacciones

### 4. **Exportación a PDF**
- Botón para descargar el reporte actual en PDF
- Formato horizontal (landscape)
- Nombre del archivo: `Reportes_Operativos_YYYY-MM-DD.pdf`

---

## Estructura del Código

```
ReportesOperativosModule.jsx
├── Estado Principal
│   ├── fechaInicio / fechaFin
│   ├── reporteActivo (productividad|ordenes|refacciones)
│   ├── loading / generandoPDF
│   └── datos de reportes
├── Funciones Principales
│   ├── generateReports() - Obtiene datos del período
│   ├── generatePDF() - Exporta a PDF
│   └── Funciones de agregación de datos
└── Componentes Secundarios
    ├── ReporteProductividad
    ├── ReporteEstatusOrdenes
    └── ReporteUsoRefacciones
```

---

## Queries Utilizadas

### Productividad (proyectos completados)
```sql
SELECT proyectos.*, empleados.nombre, cotizaciones.monto_total
FROM proyectos
LEFT JOIN empleados ON proyectos.mecanico_id = empleados.id
LEFT JOIN cotizaciones ON proyectos.id = cotizaciones.proyecto_id
WHERE fecha_cierre BETWEEN ? AND ?
```

### Estatus de Órdenes
```sql
SELECT estado, COUNT(*) as cantidad
FROM proyectos
WHERE fecha_ingreso BETWEEN ? AND ?
GROUP BY estado
```

### Uso de Refacciones
```sql
SELECT refacciones.*, 
       COUNT(*) as transacciones,
       SUM(cantidad) as total_unidades,
       SUM(subtotal) as total_venta
FROM ventas_refacciones
LEFT JOIN refacciones ON ventas_refacciones.refaccion_id = refacciones.id
WHERE fecha_venta BETWEEN ? AND ?
GROUP BY refaccion_id
ORDER BY total_unidades DESC
LIMIT 20
```

---

## Integración en App.jsx

### Import
```jsx
import ReportesOperativosWrapper from "./components/ReportesOperativosWrapper";
```

### Menu Item
```jsx
{ id: "reportes", label: "Reportes Operativos", icon: "📊" }
```

### Conditional Rendering
```jsx
{activeModule === "reportes" && <ReportesOperativosWrapper darkMode={darkMode} />}
```

---

## Propiedades (Props)

```jsx
ReportesOperativosModule.propTypes = {
  darkMode: PropTypes.bool  // Activa/desactiva modo oscuro
}
```

---

## Modo Oscuro

El módulo soporta completamente el modo oscuro con paleta de colores:
- Fondo primario: `#16161e`
- Fondo secundario: `#1e1e28`
- Texto primario: `text-zinc-100`
- Bordes: `border-zinc-700`
- Botones y acentos: Colores vibrantes que contrastan en ambos modos

---

## Validaciones

✅ **Validaciones Implementadas:**
- Verifica que se seleccionen ambas fechas antes de generar reportes
- Valida que existan datos antes de mostrar tablas
- Desactiva botón PDF si no hay datos generados
- Manejo de errores con alerts informativos

---

## Ejemplo de Uso

```jsx
// En el dashboard admin
<ReportesOperativosWrapper darkMode={true} />

// Flujo típico:
1. Usuario selecciona fecha inicio y fin
2. Hace clic en "Generar"
3. Sistema consulta datos de Supabase
4. Se muestran los 3 reportes en pestañas
5. Usuario puede cambiar entre pestañas
6. Opcional: descargar como PDF
```

---

## Campos Esperados en Supabase

### Tabla: `proyectos`
- `id` (uuid)
- `titulo` (text)
- `estado` (text) - activo, en_progreso, terminado, entregado, cancelado, pendiente_cotizacion
- `fecha_ingreso` (date)
- `fecha_cierre` (date)
- `mecanico_id` (uuid) - FK a empleados
- `cotizaciones` (relación)

### Tabla: `empleados`
- `id` (uuid)
- `nombre` (text)

### Tabla: `cotizaciones`
- `id` (uuid)
- `proyecto_id` (uuid) - FK a proyectos
- `monto_total` (decimal)
- `estado` (text)

### Tabla: `ventas_refacciones`
- `id` (uuid)
- `refaccion_id` (uuid) - FK a refacciones
- `cantidad` (integer)
- `subtotal` (decimal)
- `fecha_venta` (date)
- `refacciones` (relación)

### Tabla: `refacciones`
- `id` (uuid)
- `nombre` (text)
- `numero_parte` (text)
- `precio_venta` (decimal)

---

## Mejoras Futuras

💡 **Posibles Enhancements:**
- Gráficos visuales con Chart.js o Recharts
- Filtro adicional por mecánico específico
- Comparativa entre períodos
- Exportación a Excel además de PDF
- Reportes programados por email
- Dashboard con widgets en tiempo real
- Análisis de rentabilidad por servicio
- Predicciones de demanda

---

## Notas Técnicas

- Usa Supabase para queries reales
- Soporta dark mode con Tailwind CSS
- HTML2Canvas para captura de contenido PDF
- jsPDF para generación de PDF
- Paginación automática en PDF para reportes largos
- Fechas formateadas con función `formatDateWorkshop()` del utils

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| "No hay datos" | Verifica que existan registros en el período seleccionado |
| PDF vacío | Espera a que termine de cargar los datos antes de descargar |
| Fechas no se ven | Asegúrate de que el input date sea soportado (navegadores modernos) |
| Performance lento | Para períodos muy largos, usa rangos más pequeños (máx 90 días recomendado) |

