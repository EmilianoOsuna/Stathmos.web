# Data Model: UI/UX Refactor

*(Note: Esta etapa concierne únicamente a la capa de vista y componentes de interfaz; el Data Model en base de datos permanece intacto. A continuación se describe la estructura del Sistema de Diseño (Design Tokens).)*

## Design Tokens (index.css)

Se establecen grupos fundamentales de tokens:

- **Colors**:
  - --color-primary, --color-primary-dark, --color-accent
  - --color-bg-base, --color-bg-surface (Tema claro y oscuro)
  - --color-text-base, --color-text-muted
- **Spacings**: Variables o escala estándar de Tailwind.
- **Borders & Shadows**: Radios estándar (--radius-md, --radius-lg) y elevación para Cards (sombras ligeras con bordes sutiles).

## Component Contract: UIPrimitives.jsx

- Button: ariant ('primary' | 'secondary' | 'outline' | 'ghost'), size ('sm' | 'md' | 'lg'), onClick, children, className. Asegura un height de al menos h-11 (44px) en touch targets móviles.
- Card: Contenedor base de contenido con padding estandarizado, border-radius global y background surface (color-bg-surface).
- ModuleHeader: Estandariza los títulos principales y filtros/botones de acción de una pantalla (ej. HistorialTickets, MecanicoDiagnosticosModule).
- MobileResponsiveTable: Componente o lógica de iteración. Recibe data y columns. Renderiza <table> en escritorio y bloque flex/grid tipo <Card> en mobile (menor a md brekapoint).
