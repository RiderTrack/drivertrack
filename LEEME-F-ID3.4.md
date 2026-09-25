# 💜📱 F-ID3.4 — "Que el QR sea el QR de mi Yape"

Lo que pediste: el QR de **Mi QR** ya no es uno generado — es **TU QR DE YAPE**, el de cobrar. Cuando el cliente va a pagarte: abrís tu QR, le das la pantalla y **escanea y te paga** 💜

## Qué cambió

### 1. 💜 Mi QR abre DIRECTO en tu QR de Yape

Apretás el **botón QR del header** (arriba a la derecha, desde cualquier pestaña) y lo primero que ves es:

- Tu **nombre grande** arriba
- Tu **QR DE YAPE** (la imagen que ya conocés — la misma que subís en **Ajustes → Yape**) sobre tarjeta blanca
- Abajo: **"Escanea y págame por Yape 💜 987 111 222"** con tu número de Yape
- **📷 Cambiar QR / Quitar** al toque, sin ir a Ajustes

**Una sola fuente**: la imagen que subís acá es la MISMA de Ajustes → Yape y del panel de cobro (Caja → Cobrar). La cambiás desde donde sea y cambia en todos lados.

### 2. 🔍 Pantalla COMPLETA para escanear

**Tocá el QR** → se pone en **pantalla completa con fondo blanco**: QR enorme + tu nombre + tu número de Yape bien grande en violeta. El cliente escanea re cómodo (más QR grande = más fácil de leer). Tocá en cualquier lado y volvés al modal.

### 3. 📷 ¿Todavía no subiste tu QR de Yape? Te lo pide ahí mismo

Si nunca subiste tu QR (o lo quitaste), la pestaña 💜 Yape te muestra el paso a paso:

1. Abrí tu app de **Yape**
2. Sacale una **captura a tu QR de cobro**
3. Tocá **"📷 Subir mi QR de Yape"** y elegí la captura

La imagen se **comprime en tu teléfono** (800px, liviana) y queda guardada **para siempre** — sobrevive recargas, el asesino de memoria de Android y el backup. Desde ese momento tu Mi QR **abre directo en Yape**.

### 4. 💬👤 Y los otros QR no se perdieron

El selector ahora tiene **3 pestañas**:

- **💜 Yape** — el de pagar (por defecto si ya lo subiste)
- **💬 WhatsApp** — al escanearlo le abre tu chat directo
- **👤 Contacto** — vCard que te guarda con nombre y número

Si todavía no subís el QR de Yape, abre en WhatsApp como antes (para que nunca veas una pantalla vacía).

### 5. ✏️ Editar guarda todo JUNTO

En **Editar** ahora también está la zona de **💜 Tu QR de Yape** (con preview): cambiás nombre, celular y QR **en una sola pasada** — nada se pisa ni se pierde. Y si ya tenés Yape guardado de antes (F-ID2.7), tu nombre y celular ya vienen **precargados** — cero tipeo.

### 6. 🛡️ Blindaje extra

- **Compartir** en modo Yape: manda tu número de Yape como texto (y en Android con Chrome también la **imagen** del QR).
- **Cambiar la meta** en Ajustes **NO borra tu QR de Yape** (regresión del bug arreglado en F-ID3.3, ahora verificada también para la imagen).
- Bug propio encontrado y arreglado en esta fase: tocar la pantalla completa cerraba TODO el modal (burbujeo del click) — ahora volvés al modal como corresponde.

## 📲 Cómo probar (los 3 Candados 🔒)

1. **🔒 Candado 1 — Instalá el APK nuevo** (v0.3.4): GitHub → Actions → *"Build DriverTrack APK"* → artifact **DriverTrack-APK** → instalalo ENCIMA (no desinstales). Ajustes debe decir **v0.3.4 (F-ID3.4)**.

2. **🔒 Candado 2 — Tu QR de Yape**: apretá el **botón QR del header** → si nunca subiste tu QR: pestaña 💜 Yape → **subí la captura de tu Yape** → tiene que quedar GRANDE con tu nombre arriba → **tocála** → pantalla completa blanca con tu número violeta → escaneala con OTRO celular → tiene que abrir tu Yape para pagarte. Cerrá todo, volvé a abrir → **abre directo en Yape**.

3. **🔒 Candado 3 — Todo conectado**: andá a **Caja → Cobrar** → el panel de Yape tiene que mostrar **el mismo QR** que subiste · cambialo desde **Mi QR → 📷 Cambiar QR** → el del panel también cambia · cambiá la **meta** en Ajustes → tu QR **sigue ahí** · y las pestañas 💬 WhatsApp / 👤 Contacto siguen funcionando como en F-ID3.3.

Cuando los 3 candados pasen en tu teléfono, seguimos con **F-ID4: estadísticas** (zonas, horas de oro, precio piso 📊).
