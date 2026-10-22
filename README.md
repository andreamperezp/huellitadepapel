# Huellita de papel

Web de marca para los diarios de embarazo de Huellita de papel (clásicos y personalizados). No es una tienda: el objetivo es transmitir confianza y llevar las consultas a WhatsApp.

## Qué tiene
- **Diario en 3D (three.js)** que acompaña el scroll: flota en la portada, se abre en "Por dentro", pasa una hoja en "Semana a semana" y se cierra para diseñar la tapa.
- **Diseñá tu tapa**: versión (personalizado / clásico), nombre, frase y color. La tapa 3D se actualiza en vivo y el botón arma el mensaje de WhatsApp con lo elegido.
- Si el navegador no tiene WebGL, se muestran las mismas tapas en 2D.

## Estructura
- `index.html`: contenido y textos
- `assets/css/estilos.css`: paleta, tipografías y diseño
- `assets/js/tapa.js`: dibuja tapas y páginas del diario (canvas)
- `assets/js/libro.js`: escena 3D
- `assets/js/ui.js`: WhatsApp, configurador y animaciones
- `assets/vendor/three.module.min.js`: three.js r169 (licencia MIT)

## Ver en local
Los módulos JS necesitan un servidor (abrir el archivo con doble clic no alcanza):

    python3 -m http.server

y entrar a http://localhost:8000. Para publicar alcanza con GitHub Pages, Netlify o Vercel, sin build.

## Cambios rápidos
- Número y mensajes de WhatsApp: arriba de `assets/js/ui.js` (`WA_NUMERO`, `MENSAJES`).
- Textos de las páginas del diario 3D: `PAGES` en `assets/js/tapa.js`.
