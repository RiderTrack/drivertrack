# LEEME — F-ID2.8: mensaje unificado 💬

## Qué cambió

**Tu pedido:** *"En la parte de abajo donde aparece el cliente también hay un botoncito de WhatsApp — cuando lo aprieto solo sale el monto, quisiera que aparezca el mismo mensaje que está arriba."*

**La causa:** el botoncito 💬 de la lista de abajo tenía una copia VIEJA del mensaje (de la F-ID2.5: saludo + monto + dirección solamente). El botón **Cobrar** de arriba usaba el mensaje nuevo ordenado por bloques (con tu Yape). O sea: dos botones, dos mensajes distintos.

**El fix:** ahora existe UNA sola función compartida (`armarMensajeCobro` en `utils.ts`) y los DOS botones mandan exactamente el mismo mensaje:

```
Hola Mk! 👋

🛵 Monto a pagar por tu pedido: *S/ 16.00*
📍 Entrega en: C.1 Barrio XV Popular de Intereses Social Proyecto

💜 Puedes pagarme por Yape:
📱 *987 111 222* (Rudy)
💵 O en efectivo al recibir

¡Gracias! 💚
```

- Funciona en la lista de **Viajes** (la de abajo) Y en la lista de **Caja** (por día).
- Respeta tu Yape/Plin guardados (F-ID2.7) y si no hay ninguno ofrece efectivo.
- El yape del PEDIDO (el del cliente) nunca va al mensaje — solo el tuyo de cobro.
- Mismo celular normalizado: `980811297` → `wa.me/51980811297`.

## Cómo probarlo (3 Candados 🔒)

1. 🔒 Instalá el APK nuevo (Actions → **Build DriverTrack APK** → artifacts). Se instala encima sin perder tus viajes ni tu Yape guardado.
2. 🔒 Andá a **Viajes**: abajo, en un cliente que tenga celular, apretá el botoncito **💬 verde** → tiene que abrir WhatsApp con el mensaje COMPLETO (nombre, monto en negrita, dirección, tu Yape, gracias) — igualito al de la vista previa de arriba.
3. 🔒 Andá a **Caja** → elegí un día con viajes → el botoncito 💬 de ahí también manda el mensaje completo.

## Validación

- tsc 0 errores · vite build OK (296 KB)
- 24 tests nuevos (F-ID2.8) + 123 de regresión (F-ID2.5/2.6/2.7) = **147/147 ✅**
  - Incluye: mensaje byte-a-byte idéntico entre el Cobrar de arriba y el 💬 de la lista, sin celular no aparece el botón, sin Yape ofrece efectivo, con Yape+Plin ofrece ambos, lista de Caja también unificada.
