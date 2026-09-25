# 🧭📱 F-ID3.3 — Viajá desde la app (Waze / Google Maps) + tu QR para los clientes

Dos cosas nuevas que pediste: **no solo contar los km — también poder viajar desde DriverTrack**, y **tu QR con el nombre** para cuando el cliente te pide el número.

## Qué cambió

### 1. 🧭 Navegar a la entrega (Waze o Google Maps)

La app ahora te **LLEVA** hasta el cliente, no solo cuenta los kilómetros:

- **En el formulario**: en cuanto hay dirección (escaneada, escrita o con pin de 📍 Ubicar) aparece el botón **"🧭 Navegar a la entrega"**.
- **En cada viaje de la lista**: botón 🧭 (brújula) al lado del botón GPS.

Al apretarlo:

- **Si es la primera vez**: te pregunta **¿Con qué app viajás?** → **Google Maps** (abre en **modo moto** 🛵) o **Waze** (arranca el viaje directo). Con el check **"Siempre usar esta app"** marcado, la próxima abre DIRECTO sin preguntar.
- **Cambiás de opinión**: Ajustes → sección **🧭 Navegación a la entrega** → Preguntar / Google / Waze.

**El detalle inteligente**:
- Si marcaste la entrega con **📍 Ubicar** (el pin), navega al **punto exacto** — perfecto para pueblos jóvenes donde la dirección de texto no existe.
- Si solo hay dirección escrita, la busca (funciona igual con lo que deja el escáner de pedidos).

**El flujo completo de ahora en más**: escaneás el pedido → 🧭 Navegar → viajás con Waze/Google (y si querés, apretás 📍 antes de salir para grabar los km reales) → Cobrar. Todo desde la app.

### 2. 📱 Mi QR — "tomá, este es mi QR"

Cuando el cliente te pide tu número, en vez de dictarlo: apretás el **botón de QR en el header** (arriba a la derecha, al lado del 🌗 — funciona desde CUALQUIER pestaña) y le mostrás la pantalla con:

- Tu **nombre grande** arriba
- Tu **número** abajo del nombre
- Tu **QR bien grande** sobre fondo blanco (fácil de escanear)

**La primera vez** te pide tu nombre y tu celular — se guarda **UNA sola vez** (igual que tu Yape 💜) y nunca más lo escribís. Lo podés editar con el botón **Editar**.

**Dos modos de QR** (toggle en la pantalla):
- **💬 WhatsApp**: al escanearlo, al cliente **le abre tu chat directo** — te escribe al toque.
- **👤 Contacto**: al escanearlo, te **guarda en sus contactos con tu nombre y número** (vCard) — "con el nombre y todo", como pediste.

Extras:
- **📤 Compartir**: manda tu contacto como mensaje (en el APK abre la hoja de compartir de Android — podés mandarlo por WhatsApp a tus clientes frecuentes).
- El QR se **genera en tu teléfono** (librería qrcode): funciona sin internet, al instante.

### 3. 🛡️ Arreglo invisible: tu QR no se borra nunca

Encontré y arreglé un bug de la F-ID3.2 **antes** de que te pase: si guardabas tu QR y después cambiabas cualquier cosa en Ajustes (la meta, por ejemplo), el config se re-armaba SIN tus datos del QR y se perdían. Ahora Ajustes conserva todo lo que no edita (tu QR incluido). También los backups viejos se normalizan al importar (nunca crashea).

## 📲 Cómo probar (los 3 Candados 🔒)

1. **🔒 Candado 1 — Instalá el APK nuevo** (v0.3.3): GitHub → Actions → *"Build DriverTrack APK"* → artifact **DriverTrack-APK** → instalalo ENCIMA. Ajustes debe decir **v0.3.3 (F-ID3.3)**. Tus datos siguen (no desinstales).

2. **🔒 Candado 2 — Navegar**: escaneá o escribí una dirección → tiene que aparecer el botón **🧭 Navegar a la entrega** → apretalo → elegí **Waze** (o Google) con "siempre" marcado → tiene que abrir Waze/Google Maps **con el viaje cargado** hacia la dirección. Volvé a DriverTrack, apretá 🧭 en OTRO viaje de la lista → ahora abre DIRECTO sin preguntar. Probá también con un viaje que tenga pin 📍 (Ubicar) → navega al punto exacto.

3. **🔒 Candado 3 — Mi QR**: apretá el **botón QR del header** → cargá tu nombre y celular → guardá → tenés que ver **tu QR con tu nombre arriba** → probá escanearlo con OTRO celular (cámara normal): en modo 💬 WhatsApp tiene que abrir tu chat, en modo 👤 Contacto tiene que ofrecerte guardarte con tu nombre. Cerrá, cambiá la meta en Ajustes, volvé a abrir tu QR → **sigue estando** (el bug arreglado).

Cuando los 3 candados pasen en tu teléfono, seguimos con **F-ID4: estadísticas** (zonas, horas de oro, precio piso 📊).
