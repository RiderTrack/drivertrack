# LEEME F-ID2.4 — "El escáner no reconoce" → Escáner a prueba de balas + 🖼️ Galería

**Fecha:** 24 set 2026 · **APK:** ~2.6 MB · **Se instala ENCIMA** de F-ID2.3 (misma firma, tus viajes/key/ajustes no se tocan)

## Qué pasaba

Escaneabas y te decía "hacelo manual" una y otra vez. Cuatro causas juntas:

| Causa | Explicación |
|-------|-------------|
| **Solo cámara** | El botón abría SIEMPRE la cámara. Una foto a la pantalla sale con reflejos, borrosa, con líneas — la IA no puede leerla. Una captura de pantalla se lee perfecto, pero no había forma de subirla |
| **Bug de la cadena** | Si el primer modelo respondía vacío (les pasa a los "pensantes" 3.x), el escaneo moría ahí mismo SIN probar los otros 2 modelos de respaldo |
| **Modo JSON estructurado** | El `responseSchema` que le exigía el formato a Gemini con los modelos 3.x a veces devolvía vacío o rechazaba el pedido |
| **Timeout corto** | 25 segundos para mandar ~500 KB de foto — en tu red a veces no llega ni la mitad |

## Qué se arregló

| Fix | Detalle |
|-----|---------|
| **🖼️ Botón Galería** | Al lado de 📷 Cámara. Subís la captura de pantalla del pedido (o la foto que ya tenés en el chat) y la IA la lee mucho mejor |
| **Cadena con reintentos** | Modelo vacío → prueba el siguiente. Ya no muere al primer intento |
| **Rescate de pensamientos** | Si el modelo dejó el dato "pensando", se saca de ahí igual |
| **Modo JSON simplificado** | Sin responseSchema — menos formas de fallar, mismo resultado |
| **Timeout 45s** | Aire de sobra para tu red; y si la conexión se corta, avisa al toque (no espera 3 veces) |
| **Foto comprimida en el teléfono** | Ya venía de F-ID2, verificado: una foto de 3200px baja a 1400px y ~80 KB antes de enviarse |
| **Errores con detalle** | Si algo falla, ahora sale una línea chica en rojo con el motivo técnico (`gemini · gemini-flash-latest · ...`). **Si vuelve a fallar, mandame una captura de ese mensaje** y en la próxima ronda lo mato seguro |

## Cómo probar (1 minuto)

1. Instalá el APK encima → pestaña **Viajes** → ahora hay **dos botones**: 📷 Cámara y 🖼️ **Galería**
2. Andá a inDrive → abrí el pedido → **captura de pantalla** (botón de bajar volumen + power)
3. Volvé a DriverTrack → **Galería** → elegís la captura → esperá unos segundos → el viaje se llena solo ✅
4. Si algo falla, mirá el mensaje rojo con el detalle chiquito y mandamelo 🙏

## Validación

- **50/50 tests headless** (Playwright + API mockeada): galería end-to-end (Gemini y Claude), compresión real
  (3200px → 1400px / 81 KB), cadena con modelo vacío que responde el segundo, JSON rescatado de thoughts,
  errores con detalle (key inválida, red cortada, todos vacíos), sin responseSchema en el body,
  y regresiones de F-ID2.2/F-ID2.3 (key que no se borra, ping con thoughts, decimales 10.89, tema claro/oscuro).
- tsc 0 errores · build Vite OK.

## Siguiente fase
**F-ID3: mapa de zonas** — cada viaje con su distrito en el mapa. Después: F-ID4 stats semanales, F-ID5 robot de WhatsApp.
