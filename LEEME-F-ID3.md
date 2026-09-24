# 📍🗺️ F-ID3 — km GPS reales por viaje + Pestaña Mapa

## Qué cambió

Hasta ahora los km eran un número que podías escribir a mano (o nada). Ahora la app los **mide de verdad** mientras manejás, y te los dibuja en un mapa real.

### 1. Grabar los km de un viaje 📍

- En la lista de Viajes, cada viaje tiene un **botón 📍 azul** (al lado del 💬 de WhatsApp).
- Lo apretás ANTES de arrancar a manejar → aparece la **barra verde flotante** con:
  - 🟢 punto pulsante = grabando
  - **km en vivo** (se actualizan mientras movés)
  - **cronómetro** del viaje
  - botón rojo **■ Terminar**
- Al apretar ■ los **km + el tiempo + el trazado** quedan guardados EN ese viaje. El viaje muestra una línea nueva: `📍 3.2 km reales · 12 min`.
- **La pantalla no se apaga** mientras graba (wake lock).
- Si arrancás la grabación de OTRO viaje sin terminar el anterior, **el anterior se guarda solo** (no perdés nada).
- Si la app se cierra o Android la mata a mitad de camino: al volver, **sigue grabando sola** (resume automático).

**Anti-estafa del GPS 📶**: el GPS del teléfono "tiembla" parado en un semáforo. La app filtra:
- precisión peor a 40 m → se ignora
- micro-movimientos de menos de 8 m → quieto, no suma
- saltos de más de 5 km de un golpe → glitch, se ignora

### 2. Pestaña Mapa 🗺️ (4ta pestaña nueva)

- Las rutas grabadas del día **dibujadas en un mapa real**: cada línea del color de su app (🟢 inDrive, 🟠 Rappi, 🔴 PedidosYa, 🔵 directo).
- 🟢 punto verde = arranque · 🔴 punto rojo = llegada.
- Tocás una línea → popup con **cliente, app, monto, km y duración**.
- Botón para cambiar **calles ↔ satélite** 🛰️ (gratis, sin API key).
- Navegador de fecha ⬅️ ➡️ para revisar los días anteriores.
- Abajo del mapa, los 3 números que importan:
  - **km reales GPS** del día
  - **tiempo manejando**
  - **S/ por km** — cuánto te pagó cada kilómetro (contando SOLO la plata de los viajes grabados, para no inflar el número)
- Los viajes del día sin GPS quedan listados abajo (`🚫 sin GPS`).

### 3. Caja 💰

- Si grabaste km, la Caja muestra: `📍 12.4 km reales · S/ 2.31 por km`.

### Detalles técnicos

- Mapa: Leaflet + tiles de OpenStreetMap (calles) y Esri (satélite) — sin costo, sin key.
- El trazado se guarda comprimido (máx ~1500 puntos por viaje; si se llena, se decima solo).
- Si el localStorage se llena, primero se sueltan los DIBUJOS de rutas viejas — **los km y la plata NUNCA se pierden**.
- Permiso de ubicación: la app lo pide la primera vez que apretás 📍. Si lo negás, te avisa en español claro y no ensucia el viaje.

## 📲 Cómo probar (los 3 Candados 🔒)

1. **🔒 Candado 1 — Instalá el APK nuevo**: GitHub → Actions → *"Build DriverTrack APK"* (la última, de F-ID3) → descargar el artifact **DriverTrack-APK** → instalalo ENCIMA (no hace falta desinstalar, tus viajes y config siguen ahí). La versión en Ajustes debe decir **v0.3.0 (F-ID3)**.

2. **🔒 Candado 2 — Grabá un viaje real**: agregá (o escaneá) un viaje → salí a la calle → apretá 📍 en ese viaje → manejá un par de cuadras → fijate que los km suban en la barra verde y el cronómetro corra → apretá ■ Terminar → el viaje tiene que mostrar `📍 X.X km reales · X min`.

3. **🔒 Candado 3 — Mirá el mapa**: pestaña **Mapa** → tu ruta tiene que estar dibujada (probá el botón satélite 🛰️) → tocá la línea → tienen que salir cliente, app, monto, km y duración → abajo **km totales, tiempo y S/ por km**. De paso revisá que en **Caja** salga la línea de km reales.

> ⚠️ Aviso honesto: el GPS consume batería mientras graba (normal en todas las apps de mapas). El botón ■ Terminar está a propósito bien a mano — apretalo al llegar.

Cuando los 3 candados pasen en TU teléfono, F-ID3 queda cerrada y arrancamos F-ID4 (estadísticas: zonas, horas de oro, precio piso 📊).
