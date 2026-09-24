# 🎨 F-ID3.1 — El mapa ahora tiene el look de RiderTrack v2

## Qué cambió

La pestaña **Mapa** se viste con el mismo lenguaje visual del mapa de RiderTrack v2 (tu otra app):

1. **Mapa oscuro elegante 🌑 (nuevo default)**: tiles **ESRI Dark Gray** — el fondo gris oscuro con nombres de calles en gris claro que combina perfecto con el tema oscuro de la app. Antes era el mapa callejero común (blanco y colorido), que chocaba con el resto de la interfaz.

2. **Botón 🎨 con 3 estilos**: arriba a la derecha, cicla **Oscuro → Claro → Satélite** mostrando el nombre del estilo actual (antes era un toggle calles/satélite). Tu elección queda guardada.
   - **Oscuro**: ESRI Dark Gray (default, el look RiderTrack)
   - **Claro**: ESRI Light Gray (minimalista, bueno de día)
   - **Satélite**: foto real desde arriba 🛰️ (el de siempre)

3. **Rutas punteadas ANIMADAS**: las líneas de cada viaje ahora son **punteadas y los guiones fluyen** a lo largo de la ruta (animación continua, como la línea de ruta de RiderTrack). Cada app sigue con su color: 🟢 inDrive · 🟠 Rappi · 🔴 PedidosYa · 🔵 directo.

4. **Banderines 🏁 estilo RiderTrack**: el arranque y la llegada de cada viaje ahora son **círculos con borde blanco de 3px y sombra** (verde el arranque, rojo la llegada) con el icono de banderín adentro — antes eran puntos planos sin borde.

5. **Popups y tooltips oscuros**: al tocar una línea, el globo con cliente/app/monto/km ahora tiene **fondo oscuro redondeado con borde** (estilo RiderTrack), en vez del blanco default de Leaflet.

6. **Leyenda flotante DENTRO del mapa**: arriba a la izquierda, con blur (antes estaba abajo del mapa, fuera). Ahora también marca **arranque 🟢 y llegada 🔴**.

7. **Detalles**: el fondo mientras cargan los tiles ya no es blanco (es azul noche #0f172a), los controles de zoom son oscuros, y el mapa es un poco más alto (340px) para ver más ruta.

## 📲 Cómo probar (los 3 Candados 🔒)

1. **🔒 Candado 1 — Instalá el APK nuevo**: GitHub → Actions → *"Build DriverTrack APK"* (la más nueva, F-ID3.1) → artifact **DriverTrack-APK** → instalar ENCIMA. Versión en Ajustes: **v0.3.1 (F-ID3.1)**.

2. **🔒 Candado 2 — Mirá el look**: pestaña **Mapa** (con al menos una ruta grabada con 📍) → el fondo del mapa tiene que ser **gris oscuro elegante** con nombres de calles → las rutas **punteadas con los guiones moviéndose** → banderines verde/rojo con borde blanco → apretá 🎨 y probá los 3 estilos (Claro, Satélite y volvés a Oscuro).

3. **🔒 Candado 3 — Tocá una ruta**: tocá cualquier línea del mapa → popup **oscuro redondeado** con cliente, app, monto, km y duración. Y si tenés viajes de varias apps, confirmá que la leyenda de arriba a la izquierda muestra cada color.

> Nota: si ya tenías rutas grabadas de la F-ID3 anterior, se dibujan igual — nada se pierde, solo cambió el aspecto. Si tenías el estilo "calles" guardado, pasa al nuevo default oscuro.
