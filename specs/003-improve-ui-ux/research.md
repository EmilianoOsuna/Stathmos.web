# Research: UI/UX Refactor & Mobile Optimization

## Area 1: CSS Variables integration with Tailwind CSS V4
**Decision**: Utilizar variables CSS nativas mapeadas con la directiva @theme de Tailwind V4 en index.css.
**Rationale**: Tailwind v4 simplifica enormemente el uso de variables CSS. Podemos declarar nuestras variables en la raíz (ej. --color-primary) y exponerlas a las clases de utilidad nativa a través del bloque @theme. Esto asegura un sistema de diseño centralizado sin desaprovechar el motor de utilidades de Tailwind.
**Alternatives considered**: Usar un archivo de configuración separado 	ailwind.config.js (clásico de v3). Sin embargo, vemos que ya se está usando v4 (@import "tailwindcss" en index.css), por lo que aprovechar CSS nativo y @theme es la opción más limpia.

## Area 2: Patrón Responsive para Tablas
**Decision**: Transición automática de Tablas <table/> orientadas a escritorio hacia Interfaces basadas en Tarjetas (<Card/>) en contenedores Grid o flex para max-width: 768px. Ocultar elemento de encabezado nativo (<thead/>) y renderizar contenido individual de fila como un bloque completo con etiquetas para cada columna.
**Rationale**: Las tablas densas desbordan pantallas de móviles (scroll X), lo que va en contra del criterio de éxito SC-002 y la usabilidad móvil.  
**Alternatives considered**: Hacer la tabla scrolleable solo horizontalmente. Descartado porque rompe la experiencia de toque móvil (preferencia de swipe vertical sobre horizontal).  

## Area 3: Calendario Mobile-Friendly
**Decision**: Adaptar la vista del módulo CitasModule.jsx utilizando CSS Grid para crear una vista mensual compacta, asegurando botones y acciones táctiles mediante clases como h-11 w-11 (min 44x44px, SC-003). Cambiar vista apilada verticalmente o carrusel ligero de días y eventos para mobile por debajo de los breakpoints estándares de Tailwind (md:). 
**Rationale**: Los usuarios móviles necesitan interactuar eficientemente sin roturas visuales (Requirement FR-007).
**Alternatives considered**: Cargar un calendario de terceros; descartado para evitar inflar el bundle de dependencias (react, framer-motion ya presentes, podemos hacer UI local).
