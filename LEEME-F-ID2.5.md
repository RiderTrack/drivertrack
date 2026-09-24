# 🏍️ DriverTrack F-ID2.5 — Escáner a prueba de fallas + cobro por WhatsApp

**Versión 0.2.5** · Esta actualización ataca los 2 problemas que reportaste al probar la 2.4, más el pedido del botón de WhatsApp.

---

## 🔴 Qué estaba pasando con tu escáner

Cuando escaneabas con tu key de Gemini, la API respondía esto (en inglés, medio escondido en el mensaje de error):

> `Your prepayment credits are depleted. Please go to AI Studio...`

Traducción: **tu key de Gemini se quedó sin créditos prepago**. No era un bug de la app ni de la foto — la key estaba muerta. Con tu token de Claude sí funcionaba porque esa cuenta sí tiene saldo. Por eso el "Probar" decía OK con Claude y el escaneo con Gemini fallaba siempre.

## ✅ Qué se arregló / agregó

### 1. Doble key: Gemini + Claude, con respaldo AUTOMÁTICO
- En **Ajustes → Escáner** ahora hay **dos campos separados**: 🟢 Gemini (gratis) y 🔵 Claude (tu `sk-ant-…`, opcional).
- **El escáner prueba Gemini primero** (es la gratis). Si Gemini falla con un error de cuenta — sin créditos, límite, región — **cae solo a Claude y el escaneo sale igual**. Ni te enterás.
- Si solo tenés una key configurada, funciona como siempre.
- **Migración automática**: si tu token de Claude estaba pegado en el campo de Gemini, se muda solo a su campo la primera vez que abrís la app.

### 2. Errores en español claro (nada de mamarrachos en inglés)
- El error de créditos ahora dice: *"Tu key de Gemini se quedó SIN CRÉDITOS 💳 — crea una nueva gratis en aistudio.google.com/apikey o recargá en ai.studio → Billing..."*
- El detalle técnico sigue abajo en chiquito (por si hay que diagnosticar), pero el título te dice QUÉ hacer.
- **"Probar keys"** ahora prueba las dos y te reporta una por una: `✅ Gemini OK (modelo) · ✅ Claude OK (modelo)`.

### 3. Escáner v2: dirección y celular con campos PROPIOS
- Antes la dirección y el teléfono caían aplastados dentro de "Notas". Ahora:
  - **📍 Dirección de entrega** → su propio campo
  - **📱 Celular del cliente** → su propio campo
- El prompt de la IA ahora insiste en buscar el teléfono (suele venir como "contacto" en inDrive/Rappi).
- Tus viajes viejos siguen cargando normal (los campos nuevos aparecen vacíos).

### 4. 💬 Botón COBRAR: WhatsApp directo al cliente
En el formulario, al lado del celular, aparece el botón verde **Cobrar**. Lo apretás y se abre el chat de WhatsApp del cliente con el mensaje **listo para enviar** (estilo el QR de RiderTrack v2):

```
Hola Maria Fernandez Lopez! 👋
🛵 Este es el monto que tienes que pagar por tu pedido: *S/ 8.50*
📍 Entrega en: Av. La Marina 2450, dpto 302
💜 Puedes pagarme por Yape al 987 111 222 (Rudy) o en efectivo al recibir
¡Gracias! 💚
```

- Usa tu **tarifa** (lo que paga el cliente), tu **dirección** y tu **Yape/Plin de Ajustes**.
- El celular se normaliza solo (`987 654 321` → `wa.me/51987654321`).
- **No envía solo** — abre el chat con el texto cargado para que lo revises y recién ahí apretes enviar.
- También hay un botón 💬 por cada viaje guardado en la lista (si tiene celular).

---

## 📲 Cómo instalar

1. Andá a **Actions → Build DriverTrack APK** (te paso el link del build de esta versión).
2. Bajá el artifact **DriverTrack-APK** (zip).
3. Descomprimilo e instalalo **encima** de la versión que tenés (es la misma firma, no pierdes NADA: viajes, ajustes, keys, todo queda).
4. Si Android te pregunta, dale "Instalar de todos modos" — la APK está firmada igual que las anteriores.

## 🧪 Cómo probar (2 minutos)

1. **Ajustes → Escáner**: pegá tu key de Gemini Y tu token de Claude en sus campos → **Probar keys** → tenés que ver los dos ✅ (o el ❌ de Gemini con el mensaje de créditos en español).
2. **Viajes → 🖼️ Galería** → elegí una captura → el viaje se llena solo: cliente, zona, tarifa, **dirección y celular en sus campos**.
3. Poné o verificá el celular → apretá **Cobrar** → se abre WhatsApp con el mensaje listo → mandalo.
4. Guardá el viaje → en la lista te aparece el botón 💬 para volver a mandarle el mensaje cuando quieras.

## 🔧 Detalles técnicos (por si te interesa)

- **Fallback inteligente**: si el error es de la cuenta (créditos/quota/región/key) y hay otra proveedora, se reintenta con la otra. Si la foto no se pudo leer, TAMBIÉN se pide una segunda opinión de la otra IA.
- Los errores de red ("se cortó la conexión") no gastan el respaldo — si no hay red, no hay escaneo.
- Se mantienen todos los fixes anteriores: galería, thoughts de los modelos 3.x, cadena de modelos, timeout 45s, autoguardado de ajustes, decimales de comisión, modo claro/oscuro.
- Validado: `tsc` 0 errores, build OK, **42/42 tests headless** (con mocks — el servidor de este chat sigue en región bloqueada por Google, tu teléfono en Lima sí responde).

## 🗺️ Siguiente

- **F-ID3: mapa de zonas** (copy del mapa en vivo de RiderTrack).
- Después: F-ID4 estadísticas y F-ID5 robot WhatsApp.
