# 🔧 F-ID3.2 — Los 5 ajustes que pediste tras probar en tu teléfono

## Qué cambió

### 1. 🔐 Permisos de UBICACIÓN en el APK

**El problema**: al ir a darle permiso a la app, solo aparecía el de cámara — el GPS no podía funcionar nunca porque el APK no declaraba el permiso de ubicación.

**Ahora**: el APK trae los permisos `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` declarados, y la **primera vez que apretás 📍 para grabar** sale el **diálogo nativo de Android** pidiendo "Permitir DriverTrack a acceder a la ubicación de este dispositivo" (igual que cámara). Aceptás una vez y listo. En Ajustes del teléfono → Apps → DriverTrack → Permisos ahora vas a ver **Ubicación** junto a Cámara.

### 2. 📞 Llamar directo

- En la **lista de viajes**: botón 📞 celeste al lado del 💬 de WhatsApp → abre el **marcador** con el número del cliente (con +51).
- En el **formulario**: botón 📞 al lado del botón Cobrar (se activa cuando escribís el celular).

### 3. 🧲 La dirección escaneada YA NO desaparece

**El problema**: escaneabas un pedido, pasabas a la pestaña Mapa (o se te cerraba la app) y al volver el formulario estaba VACÍO.

**Ahora**: todo lo que hayas escrito o escaneado (dirección, cliente, tarifa, celular, yape, notas, coordenadas) queda **guardado como borrador** y reaparece solo:
- al cambiar de pestaña y volver
- al recargar la app
- incluso si Android mata la app por memoria

El borrador se limpia **solo cuando agregás el viaje** (que es cuando ya no lo necesitás).

### 4. 📍 Ubicar por coordenadas (como RiderTrack v2)

Al lado del campo de dirección hay un botón **"Ubicar"** → abre un mini-mapa con el mismo look oscuro de la app:
- **Arrastrás el pin** hasta la casa del cliente
- O **tocás el mapa** y el pin se mueve ahí
- O apretás **"📌 Usar mi ubicación actual"** (GPS) — útil cuando estás EN la puerta
- O escribís las **coordenadas a mano** (latitud/longitud)

Al confirmar, el viaje queda con su **pin 📍 de entrega** que se dibuja en la pestaña Mapa — para siempre. Perfecto para pueblos jóvenes y casas sin número donde la dirección de texto no alcanza.

### 5. 🛵 Seguimiento de ruta en vivo

Mientras grabás un viaje con 📍, abrí la pestaña **Mapa**:
- Tu recorrido se va **dibujando EN VIVO** (línea sólida del color de la app del viaje)
- El **motito** muestra tu posición actual (con animación pulsante)
- Botón **"Seguirme"**: la cámara te persigue mientras manejás (como Circuit / RiderTrack). Si querés mirar otra cosa, arrastrás el mapa y el seguimiento se apaga solo. Lo volvés a prender cuando quieras.
- Al apretar ■ Terminar, la línea viva pasa a ser **ruta guardada** (punteada animada con banderines 🏁).

## 📲 Cómo probar (los 3 Candados 🔒)

1. **🔒 Candado 1 — Instalá el APK nuevo** (v0.3.2): GitHub → Actions → *"Build DriverTrack APK"* → artifact **DriverTrack-APK** → instalalo ENCIMA. Ajustes debe decir **v0.3.2 (F-ID3.2)**. DESINSTALAR NO hace falta — tus datos siguen.

2. **🔒 Candado 2 — Permiso + grabación + seguimiento**: apretá 📍 en un viaje → tiene que salir el **diálogo de Android pidiendo Ubicación** (¡nuevo!) → aceptá → manejá → pasá a la pestaña **Mapa** mientras grabás → tu línea se dibuja en vivo + el motito → apretá **Seguirme** y verificá que la cámara te sigue → arrastrá el mapa y verificá que se suelta.

3. **🔒 Candado 3 — Borrador + ubicar + llamar**: (a) escaneá (o escribí) una dirección → pasá a Mapa y volvé → la dirección TIENE que seguir ahí; (b) botón **Ubicar** junto a la dirección → mové el pin o apretá 📌 mi ubicación → confirmá → el viaje se guarda con pin en el Mapa; (c) botón 📞 en un viaje de la lista → abre el marcador para llamar al cliente.

> Extra para verificar: Ajustes del teléfono → Apps → DriverTrack → Permisos → tiene que aparecer **Ubicación** (antes solo cámara).

Cuando los 3 candados pasen en tu teléfono, seguimos con **F-ID4: estadísticas** (zonas, horas de oro, precio piso 📊).
