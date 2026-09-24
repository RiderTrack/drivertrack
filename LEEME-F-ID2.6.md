# 🏍️ DriverTrack — F-ID2.6 · Escáner v3: el NOMBRE REAL + el Yape del pedido

**Versión 0.2.6** · Fix directo de lo que pasó cuando probaste la 2.5 con la foto real del pedido.

---

## 🔍 Qué pasó (tu caso real)

Escaneaste el pedido y la IA llenó:

| Campo | Lo que puso | Lo que debía poner |
|-------|-------------|--------------------|
| Cliente | `C.1` 😅 | **Mk** (el nombre real) |
| Dirección | `Barrio Barrio XV Popular de Intereses Social Proyecto` | **C.1** Barrio XV Popular de Intereses Social Proyecto |
| Yape | *(nada)* | **Mk** · **980811297** |

**C.1 es la CALLE 1 del barrio** (así se numeran las calles en los pueblos jóvenes y proyectos de vivienda) — la IA lo confundió con el nombre del cliente. Y el nombre real, "Mk", aparecía junto al yape… y la IA lo ignoraba. Por eso el WhatsApp salió *"Hola C.1! 👋"*.

---

## 🛠️ Qué arreglé (3 capas, para que no vuelva a pasar)

1. **Prompt v3 — la IA aprendió el barrio** 🧠
   - Ahora sabe que **"C.1" es la Calle 1**, que "Mz B Lt 5" es Manzana B Lote 5, y que esos códigos van en la DIRECCIÓN, jamás en el cliente.
   - Si el único nombre de persona aparece junto al yape ("Mk yape 980811297"), **ese ES el cliente**.
   - Le metí tu pedido real como EJEMPLO dentro del prompt — la IA aprende viendo el caso concreto.
   - Le prohibí repetir palabras pegadas ("Barrio Barrio" → "Barrio").

2. **Saneamiento en el CÓDIGO (red de seguridad)** 🛡️
   - Por si la IA mete la pata igual: si en "cliente" viene un código (C.1, Casa 2, Lote 5, Cliente 3…) o un trozo de dirección (Barrio…, Av…, Urb…), **se muda solo a la dirección** y el cliente se rescata del yape.
   - Las palabras repetidas se colapsan solas.
   - Esto corre SIEMPRE, en cada escaneo, sin que toques nada.

3. **El yape del pedido con campos propios** 💜
   - Nuevo en el formulario: **"💜 Yape: nombre"** y **"💜 Yape: número"** — se llenan solos con el escaneo.
   - Se guardan con el viaje y se ven en la lista (línea 💜 morada) — así sabés **quién pagó** cuando te llegue la plata.
   - **Bonus**: si la foto no trae teléfono pero sí yape, **el celular se llena con el número del yape** (en Perú el yape ES el celular del cliente) → el botón Cobrar queda listo al toque. Es editable, como todo.

---

## ✅ Cómo probarlo (3 Candados 🔒)

1. **Escaneá la MISMA foto del pedido** (la de C.1 / Barrio XV / Mk yape) →
   🔒 Cliente = **Mk** · Dirección = **C.1 Barrio XV Popular de Intereses Social Proyecto** (sin "Barrio Barrio") · Yape = **Mk 980811297** · Celular = **980811297** solo.
2. **Apretá Cobrar** → el mensaje arranca **"Hola Mk! 👋"** (chau "Hola C.1") y abre el chat del 980811297.
3. **Guardá el viaje** → en la lista se ve la línea 💜 con el yape del pedido.

---

## 📲 Instalación

APK desde **Actions → Build DriverTrack APK → artifacts** (se instala encima sin perder nada — misma firma).

> 🧪 Validado con 34 tests nuevos del caso real + 42 de regresión = **76/76 OK**.

---

## 🗺️ Siguiente

**F-ID3: mapa de zonas** (la que sigue del roadmap) — cuando quieras.
