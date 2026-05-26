# Guía de Verificación Rápida: Sistema de Diseño y Optimización UI/UX

Este documento proporciona los pasos necesarios para verificar y validar de forma manual que los cambios del sistema de diseño y optimización móvil se hayan implementado correctamente.

## 1. Verificación de Carga de Tipografía (Inter)

1. Levanta el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
2. Abre la aplicación en el navegador e inspecciona cualquier elemento de texto (clic derecho -> **Inspeccionar**).
3. Ve a la pestaña **Computed** (Calculado) del panel de estilos del desarrollador.
4. Busca la propiedad `font-family` y verifica que el valor sea `Inter, sans-serif`.
5. En la pestaña **Network** (Red), filtra por `Font` y verifica que haya peticiones exitosas (código HTTP 200/304) a `fonts.gstatic.com`.

---

## 2. Verificación de Tokens Centralizados

1. Abre `src/index.css` y localiza el bloque `@theme`.
2. Cambia temporalmente la variable `--color-primary` por un color llamativo, por ejemplo:
   ```css
   --color-primary: #ff00ff; /* Fucsia */
   ```
3. Verifica en el navegador que todos los botones primarios, enlaces y bordes de focus en todas las pantallas hayan cambiado automáticamente a fucsia.
4. Deshaz el cambio temporal una vez validado.

---

## 3. Verificación de Adaptabilidad Móvil (Scroll y Layout de Tarjetas)

1. Abre las herramientas de desarrollador en el navegador (F12) y activa la vista de dispositivo móvil (**Toggle device toolbar** o Ctrl+Shift+M).
2. Selecciona un dispositivo móvil típico de pantalla estrecha (por ejemplo, **iPhone SE** o **Pixel 5**, ancho de 320px a 390px).
3. Navega a las siguientes pantallas y verifica que no exista barra de scroll horizontal en la parte inferior de la ventana:
   * **Módulo de Citas**: La lista debe colapsar a tarjetas verticales.
   * **Módulo de Historial de Servicios**: La tabla de servicios, diagnósticos y cotizaciones debe colapsar a tarjetas individuales responsivas.
   * **Módulo de Clientes**: Confirmar que sigue funcionando su layout de tarjetas.
4. Verifica que los botones de acción (`button`), selectores (`select`), e inputs (`input`) tengan una altura física de al menos **44px** para facilitar la pulsación táctil (puedes verificarlo inspeccionando las dimensiones del elemento en el inspector).

---

## 4. Verificación de Modo Claro/Oscuro

1. Cambia el tema del sistema operativo o utiliza la funcionalidad de simulación del navegador para cambiar entre modo claro y oscuro (`prefers-color-scheme`).
2. Verifica que las tarjetas de UIPrimitives (`Card`), inputs, badges y modales adapten sus colores de fondo y bordes según las variables de tema establecidas.
