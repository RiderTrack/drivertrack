# LEEME — F-ID5: 🤖 Robot WhatsApp (cobro automático con tu QR)

Hermano, ya está la **fase F-ID5** — la que cierra el ciclo: **la app le cobra al cliente por vos**.
Apretás un botón y el cliente recibe en su WhatsApp el mensaje de pago **con la foto de tu QR de Yape adentro** — sin abrir WhatsApp, sin copiar nada, sin apretar "enviar".

```
Antes:  Cobrar → se abre WhatsApp → revisás el mensaje → apretás enviar
Ahora:  🤖 Cobrar → el cliente ya lo tiene (con tu QR) → listo 💜
```

## ⚠️ IMPORTANTE — esta fase tiene DOS partes

Esta vez no alcanza con actualizar el APK: **tu rudy-bot (Termux) también necesita un parchecito**
— es el que manda el mensaje de verdad. Sin el parche, la app funciona igual pero cae al
WhatsApp manual de siempre (nunca te quedás sin cobrar).

### Parte 1 — El APK (como siempre)
Instalá la **v0.4.0** (Actions → Build DriverTrack APK → artifacts → **DriverTrack-APK**) sobre
la que ya tenés. Tus viajes, QR, meta, todo intacto.

### Parte 2 — El parche del robot (2 minutos, UNA sola vez)
1. Pasá a Termux los archivos **`puente_drivertrack.js`** y **`instalar_f5.js`** (del zip
   `robot-drivertrack-fid5.zip`) a la carpeta del bot: `~/bot-whatsapp/`
2. `cd ~/bot-whatsapp && node instalar_f5.js && pm2 restart rudy-bot`
3. En los logs tiene que aparecer: `🌉 [DriverTrack] Puente listo en http://127.0.0.1:3001`

El instalador hace respaldo solo (`index.js.backup-fid5`), verifica todo y si algo no cierra
**no rompe nada** (te avisa). Podés volver atrás con `cp index.js.backup-fid5 index.js`.

## Cómo se usa en la app

1. **Ajustes → 🤖 Robot WhatsApp** → prendé el interruptor → tocá **"Probar conexión"** →
   tiene que decir **🟢 Robot en línea**. (Si dice 🔴, el bot no está corriendo: `pm2 start rudy-bot`.)
2. Cargá un viaje con el celular del cliente (a mano o escaneado — el escáner ya lo saca de la foto).
3. Apretá **🤖 Cobrar** (queda violeta cuando el robot está activo). Listo: toast verde
   **"✓ Cobro enviado con tu QR 💜"** y el cliente ya tiene el mensaje con la imagen.
4. También anda desde el botoncito de cada viaje de la lista (Viajes y Caja).

**Si el robot no responde** (Termux apagado, bot reiniciando, sin parche): la app te avisa con un
toast y **abre WhatsApp como siempre** — el cobro nunca se traba. El 💬 de siempre vuelve solito
cuando apagás el robot en Ajustes.

## Detalles finos

- **El mensaje es el mismo de siempre** (saludo con nombre, monto en negrita, entrega, tu Yape,
  gracias) — ahora llega **como epígrafe de la imagen de tu QR**. El cliente lo ve y te escanea.
- Sin QR de Yape subido → manda el mensaje de texto solo (igual automático).
- **Seguridad**: el puente escucha SOLO en `127.0.0.1` (tu propio teléfono — nadie de la red puede
  mandar mensajes con tu WhatsApp) y pide un **token** que ya viene parejo en ambos lados
  (`rudy-drivertrack`). Si querés cambiarlo: está en las primeras líneas de `puente_drivertrack.js`
  y en Ajustes → 🤖 Robot → Avanzado.
- El APK ahora permite HTTP "en claro" **únicamente** hacia `127.0.0.1`/`localhost`
  (network security config) — el resto del tráfico sigue exigiendo HTTPS.
- El bot procesa y responde al toque: el botón queda en "Mandando…" con spinner hasta que
  WhatsApp confirma el envío (segundos).

## 🔒 Los 3 Candados (probalos en tu teléfono)

1. **🟢 Conexión**: instalá APK v0.4.0 + parche del robot → Ajustes → 🤖 Robot → prendé y
   "Probar conexión" → **🟢 Robot en línea — listo para cobrar**. (Con el bot apagado tiene que
   decir 🔴.)

2. **🤖 Cobro real**: cargá un viaje con el celular de ALGUIEN DE TU CONFIANZA (tu otro celular,
   un familiar) → 🤖 Cobrar → toast verde "✓ Cobro enviado con tu QR" → revisá ese WhatsApp:
   tiene que estar el mensaje **con la imagen de tu QR de Yape** y el monto. Fijate que llega de
   TU número (el bot usa tu WhatsApp).

3. **🛟 Fallback + apagado**: en Termux pará el bot (`pm2 stop rudy-bot`) → 🤖 Cobrar en la app →
   aviso "El robot no responde" + se abre WhatsApp con el mensaje listo (como siempre). Prendé el
   bot de nuevo (`pm2 start rudy-bot`). Después apagá el robot en Ajustes → el botón vuelve a ser
   el 💬 verde de toda la vida.

## Notas técnicas

- **App**: `services/robot.ts` (ping + envío con AbortController y timeouts) · flujo de cobro
  compartido en `App.tsx` (robot → fallback wa.me, un solo camino para formulario y listas) ·
  sección 🤖 en AjustesView · `ConfigDT` + `robotActivo/robotUrl/robotToken` con defaults y
  normalización (backups viejos no rompen) · botones violeta 🤖 cuando el robot está activo
  (mismo testid `boton-whatsapp` / `boton-whatsapp-lista`).
- **Robot**: `puente_drivertrack.js` — server HTTP en `127.0.0.1:3001` DENTRO del proceso rudy-bot
  (acceso directo al sock de Baileys → envío inmediato, sin cola de 6s). CORS para el WebView
  (https://localhost → http://127.0.0.1), token, normalización de celular igual que la app
  (9 dígitos → 51…), JID vía `resolverJid` de campanas_bot.js con fallback. Se re-engancha solo en
  cada reconexión de WhatsApp (referencia fresca, server creado 1 sola vez).
- **APK**: `network_security_config.xml` (cleartext SOLO 127.0.0.1/localhost) +
  `android:networkSecurityConfig` en el manifest + `allowMixedContent: true` (el WebView sirve la
  app por https://localhost).
- **Por qué no Firestore**: probé escribir directo en la cola `acciones_bot` del bot (probe real
  contra el proyecto ridertrack-93c8a): el auth anónimo está habilitado pero las reglas dan
  `PERMISSION_DENIED` → habría que sumar Google Sign-In nativo + registrar el SHA-1 del keystore
  del APK en la consola de Firebase. El puente localhost lo evita todo: cero cuentas, cero nube,
  respuesta instantánea, y el número del cliente nunca sale del teléfono.
- **Tests**: smoke del puente **25/25** (mock del sock: ping, CORS/preflight, imagen+caption,
  token 401, teléfono corto, sin WhatsApp, bot reconectando, no duplica server) + instalador
  probado contra las 2 versiones de index.js (original y fase 3.31, con idempotencia) ·
  **45 nuevos** (test_fid5_headless.mjs, mock de fetch) + **233 de regresión** (versión → 0.4.0)
  = **278/278 ✅** · capturas VLM 6/6.
- Versión: package.json 0.3.5 → **0.4.0** (badge de Ajustes sincronizado).
