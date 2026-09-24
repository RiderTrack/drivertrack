# 🏍️ DriverTrack — F-ID2.7 · Tu Yape guardado 1 vez + mensaje ordenado

**Versión 0.2.7** · Fix directo de tus 3 pedidos después de probar la 2.6 en la calle.

---

## 🔍 Qué pasó (tu caso real)

1. **"Que el número de yape se grabe, para no estar escribiendo a cada cliente mi número de yape"**
   Tu Yape de cobro vivía escondido en *Ajustes*, así que terminabas escribiéndolo a mano en cada cliente — y encima en el campo equivocado (el de la 2.6 es el yape **del pedido**, el con el que pagó tu cliente).

2. **"Cuando pongo agregar más viajes, el mensaje del número de yape desaparece"**
   Al apretar **Agregar viaje** el formulario se limpia para el próximo cliente (correcto), pero como tu número vivía ahí adentro, se iba con él. El mensaje de cobro quedaba sin tu Yape.

3. **"El mensaje podemos ponerle más ordenado"**
   El mensaje salía todo pegado en 3-4 líneas largas.

---

## 🛠️ Qué arreglé

1. **💜 Tu Yape se guarda UNA vez — y nunca más se escribe**
   - Nueva tarjeta **"💜 Tu Yape para cobrar"** en la pestaña Viajes, justo debajo del celular del cliente (no hace falta ir a Ajustes).
   - Lo guardás 1 vez → queda en el teléfono → **sale solo en el mensaje de cobro de TODOS tus clientes**.
   - Barrita morada siempre visible: *"💜 Tu Yape: 987… — va en todos los cobros"*, con botón **cambiar** por si mudás de número.

2. **📋 El mensaje ya NO desaparece — vista previa SIEMPRE visible**
   - Nuevo panel **"💬 Así le va a llegar a tu cliente"** con el mensaje armado **en vivo**, estilo chat de WhatsApp (con negritas incluidas).
   - Se actualiza mientras escribís/escaneás y **sobrevive al apretar Agregar viaje**: tu Yape sigue ahí, listo para el próximo cliente. Lo que se limpia es solo lo del cliente anterior.
   - Se ve la diferencia entre **tu Yape** (va al mensaje) y el **yape del pedido** (se guarda con el viaje para saber quién pagó) — ahora con etiquetas claras: *"💜 Yape del pedido"*.

3. **✨ El mensaje, ordenado en bloques**

   Así queda ahora (tal cual, con negritas de WhatsApp):

   > Hola Mk! 👋
   >
   > 🛵 Monto a pagar por tu pedido: **S/ 16.00**
   > 📍 Entrega en: C.1 Barrio XV Popular de Intereses Social Proyecto
   >
   > 💜 Puedes pagarme por Yape:
   > 📱 **987 111 222** (Rudy)
   > 💵 O en efectivo al recibir
   >
   > ¡Gracias! 💚

   - Saludo → pedido (monto + entrega) → cómo pagar (tu Yape en negrita) → gracias, separado con líneas vacías.
   - Si cargás también Plin en Ajustes, entra solo como alternativa ("🔷 O por Plin: …").
   - Sin Yape ni Plin cargados: ofrece efectivo nomás.

---

## ✅ Cómo probarlo (3 Candados 🔒)

1. **Primer viaje del día** → abajo del celular del cliente te va a aparecer la tarjeta 💜 → poné tu número (y tu nombre si querés) → **Guardar mi Yape** → la tarjeta se convierte en la barrita morada "va en todos los cobros".
2. **Apretá Cobrar** → el mensaje sale ordenado por bloques y **con tu Yape en negrita** — lo vas viendo ANTES de mandarlo en la vista previa 💬 (se actualiza en vivo).
3. **Agregá OTRO viaje** (escaneá otro pedido) → la barrita 💜 y la vista previa **siguen ahí** con tu Yape → Cobrar → el 2do mensaje también lo trae. 🔒

---

## 📲 Instalación

APK desde **Actions → Build DriverTrack APK → artifacts** (se instala encima sin perder nada — misma firma). Tu Yape guardado y tus viajes quedan intactos.

> 🧪 Validado con 47 tests nuevos (los 3 casos tuyos + regresiones) + 34 de la 2.6 + 42 de la 2.5 = **123/123 OK**.

---

## 🗺️ Siguiente

**F-ID3: mapa de zonas** (la que sigue del roadmap) — cuando quieras.
