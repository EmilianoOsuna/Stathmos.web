# Research and Decisions: Sistema de Diseño y Optimización UI/UX

## 1. Centralización de CSS y Tokens de Diseño

* **Decision**: Utilizar variables CSS nativas centralizadas dentro de la directiva `@theme` de Tailwind CSS v4.2.1 en `src/index.css`.
* **Rationale**: En Tailwind v4, cualquier variable definida dentro del bloque `@theme` se expone automáticamente como una variable de CSS nativa (e.g., `--color-primary`) y al mismo tiempo genera las clases correspondientes de Tailwind (e.g., `bg-primary`). Esto satisface la preferencia por variables CSS nativas sin perder la potencia y velocidad de desarrollo de Tailwind.
* **Alternatives considered**:
  * *Valores hardcoded*: Mantener colores en hexadecimal directamente en cada componente. Rechazado por violar los principios de consistencia y dificultar el mantenimiento del modo oscuro.
  * *JavaScript Theme Config*: Configuración clásica a través de un objeto JS. Rechazado porque Tailwind v4 prefiere la configuración declarativa en CSS y la compilación es más eficiente usando CSS nativo.

## 2. Integración de la Familia Tipográfica (Inter)

* **Decision**: Cargar la tipografía Inter desde Google Fonts utilizando etiquetas `<link>` de preconexión en `index.html` y declararla como la tipografía base en `src/index.css`.
* **Rationale**: La carga por CDN con preconexión minimiza el retardo en el renderizado inicial de la página (FOIT/FONT) y asegura que los navegadores móviles descarguen rápidamente los pesos requeridos (300, 400, 500, 600, 700).
* **Alternatives considered**:
  * *Self-hosting de fuentes*: Descargar los archivos `.woff2` e importarlos localmente. Rechazado por añadir peso de assets al paquete de la PWA innecesariamente y requerir mayor esfuerzo de configuración.

## 3. Adaptabilidad Móvil para Tablas Densas (Citas y Módulos de Historial/Reportes)

* **Decision**: Implementar el patrón de renderizado condicional responsivo: ocultar la estructura `<table>` tradicional en dispositivos móviles (`hidden md:table` o `hidden md:block` para su contenedor) y renderizar en su lugar una lista vertical de tarjetas (`md:hidden` con flex/grid) con áreas de click ampliadas.
* **Rationale**: Las tarjetas responsivas eliminan el scroll horizontal en dispositivos móviles de menos de 768px, alinean la experiencia táctil con los tamaños objetivos de 44x44px y se adaptan a la lectura vertical natural en teléfonos celulares.
* **Alternatives considered**:
  * *Contenedores con scroll horizontal (`overflow-x-auto`)*: Mantener la tabla y dejar que el usuario se desplace lateralmente. Rechazado porque la usabilidad móvil se ve gravemente afectada al tener scroll bidireccional y celdas difíciles de tocar con precisión.
  * *Ocultar columnas menos importantes*: Mostrar solo 2 o 3 columnas en móvil. Rechazado porque en un entorno operativo de taller, los mecánicos y administradores necesitan ver toda la información de la cita/servicio (vehículo, cliente, estado, etc.) en su dispositivo.
