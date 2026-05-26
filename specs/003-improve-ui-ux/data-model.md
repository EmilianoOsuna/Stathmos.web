# Design System Data Model and Primitives: Sistema de Diseño y Optimización UI/UX

Este documento describe la estructura y los contratos de los tokens de diseño y los componentes primitivos que garantizan la consistencia visual y la adaptabilidad responsiva del sistema.

## 1. Design Tokens (CSS Variables)

Los tokens de diseño se definen de forma centralizada en `src/index.css` mediante la directiva `@theme` de Tailwind CSS v4, lo que genera automáticamente variables CSS nativas disponibles en toda la aplicación.

### Colores Base e Identidad
* `--color-primary`: `#60aebb` (C_BLUE) - Usado para elementos interactivos principales, links y fondos activos.
* `--color-accent`: `#db3c1c` (C_RED) - Usado para alertas, botones peligrosos y estados de error.
* `--color-success`: `#10b981` - Usado para estados positivos e indicaciones de finalización.
* `--color-warning`: `#f59e0b` - Usado para estados de advertencia o pendientes de aprobación.

### Tipografía y Espaciados
* `--font-sans`: `'Inter', sans-serif` - Tipografía uniforme para todo el sistema cargada vía Google Fonts.
* `--radius-lg`: `0.5rem` (8px) - Radio de bordes estándar para inputs, botones y badges.
* `--radius-xl`: `0.75rem` (12px) - Radio de bordes para tarjetas y modales.

---

## 2. Componentes Primitivos (UIPrimitives)

Definidos en `src/components/UIPrimitives.jsx`. Son los bloques de construcción obligatorios para todas las vistas.

### `Button`
Botón estandarizado con soporte para variantes consistentes.
* **Props**:
  * `variant`: `'primary' | 'accent' | 'ghost' | 'outline'` (Default: `'primary'`)
  * `darkMode`: `boolean`
  * `disabled`: `boolean`
  * `className`: `string`
* **Estilos**:
  * Altura mínima garantizada de interacción táctil en móvil (min-h-[44px] o padding px-4 py-2.5).

### `Input` y `Textarea`
Campos de texto con estilos consistentes en temas claro/oscuro.
* **Props**:
  * `darkMode`: `boolean`
  * `icon`: `string` (nombre de icono SVG opcional)
  * `className`: `string`
* **Estilos**:
  * Bordes y focos dinámicos en base a `--color-primary`.

### `Select`
Selector personalizado desplegado vía portal React para evitar desbordamientos y recortes de flujo.
* **Props**:
  * `options`: `Array<{ value: any, label: string }>`
  * `value`: `any`
  * `onChange`: `(e: { target: { value: any } }) => void`
  * `darkMode`: `boolean`

### `DatePicker`
Selector de fecha interactivo con restricciones del taller (excluye domingos e inhábiles).
* **Props**:
  * `value`: `string` (formato YYYY-MM-DD)
  * `onChange`: `(value: string) => void`
  * `isBlockedDate`: `(dateString: string) => boolean`
  * `darkMode`: `boolean`

### `Card`
Contenedor base con bordes, color de fondo dinámico por tema y sombreado premium.
* **Props**:
  * `darkMode`: `boolean`
  * `className`: `string`

### `ModuleHeader`
Encabezado estándar de cada módulo de trabajo.
* **Props**:
  * `title`: `string`
  * `count`: `number` (opcional)
  * `countLabel`: `string` (opcional)
  * `action`: `React.ReactNode` (ej. botón de acción "+ Nuevo")
  * `darkMode`: `boolean`

---

## 3. Reglas de Validación de Interacción (Touch Target size)

* **Botones e Inputs**: El tamaño mínimo en móvil debe ser de **44px** de alto.
  * *Implementación*: Asegurar que las clases base en `UIPrimitives.jsx` tengan los paddings correctos (`py-2.5` en móvil, `md:py-2` en pantallas más grandes) o alturas mínimas específicas (`h-[44px]`).
