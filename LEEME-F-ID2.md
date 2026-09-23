# LEEME — F-ID2: Escáner de dirección con IA 📷🤖

## ¿Qué trae F-ID2?

El feature estrella pedido desde el día 1: **le tomás una foto al pedido y la app
llena el viaje sola** — estilo Circuit. Funciona con capturas de pantalla de
inDrive/Rappi/PedidosYa, chats de WhatsApp, notas escritas a mano y stickers
de paquete.

## El flujo (3 toques)

1. Tocás **📷 Escanear dirección** → se abre la cámara
2. Le sacás foto al pedido (la captura, el chat o la nota)
3. La IA lee y llena: **cliente, zona, tarifa, dirección completa,
   referencia y teléfono** → vos solo revisás y tocás **Agregar viaje**

Si la foto trae la tarifa, el cálculo de comisión/neto se hace solo también.
La foto queda en miniatura de guía hasta que guardás el viaje (para chequear
la dirección), y la lista de viajes ahora muestra la dirección 📍 bajo cada viaje.

## Configurar la key de Gemini (UNA sola vez, gratis)

El escáner usa la IA **Gemini** de Google. Necesitás una key gratuita:

1. Entrá a **aistudio.google.com/apikey** con tu cuenta Google
2. Tocá **"Crear clave de API"** → copiala (empieza con `AIza…`)
3. En DriverTrack: **Ajustes → 🤖 Escáner de direcciones** → pegala →
   tocá **"Probar key"** (dice si funciona y con qué modelo) → **Guardar ajustes**

Listo: el botón 📷 ya escanea de verdad. Si intentás escanear sin key, la app
te manda directo a Ajustes con las instrucciones.

- **Gratis**: el plan libre de Gemini alcanza de sobra para escanear todo el día
- **Privado**: la key vive SOLO en tu teléfono (localStorage), igual que tus
  viajes. No pasa por ningún servidor nuestro — la app habla directo con Google.

## Detalles inteligentes

| Detalle | Cómo funciona |
|---------|---------------|
| **Anti-invención** | El prompt le PROHÍBE inventar: lo que no está en la foto viene vacío, el texto se copia tal cual (sin corregir ortografía) |
| **Cadena de modelos** | Prueba `gemini-2.5-flash` y si tu cuenta no lo tiene cae solo a `gemini-2.0-flash` |
| **Errores en cristiano** | Key inválida / key sin Gemini / sin internet / límite de momento / foto ilegible — cada uno con su mensaje claro, nada de códigos raros |
| **Foto de guía** | Si el escaneo falla, la foto queda en pantalla para escribir a mano mirándola |
| **Resolución OCR** | La foto se comprime a 1400px/calidad alta para que la IA lea texto fino y manuscrito (distinto al compresor de QR de 800px) |
| **Probar key** | Auto-diagnóstico real en Ajustes: hace una mini llamada y te dice exactamente qué anda mal |

## Cambios técnicos (F-ID2)

- **NUEVO** `src/services/geminiOcr.ts` — llamada a la API de Gemini con
  salida JSON estructurada (`responseSchema`), timeout 25s, mapeo de errores
  a mensajes amigables, `escanearDireccion()` + `probarKeyGemini()`
- `ViajeForm.tsx` — panel de escaneo con cámara (`capture="environment"`),
  auto-llenado selectivo (solo sobreescribe lo que la foto trajo), foto de
  guía, campo de notas/dirección nuevo
- `AjustesView.tsx` — sección 🤖 con key enmascarada + Probar + guía 3 pasos
- `App.tsx` — sin key → te manda a Ajustes con toast
- `ViajeList.tsx` — muestra 📍 dirección (primera línea) bajo cada viaje
- `types.ts` / `storage.ts` — `ConfigDT.geminiKey` (default vacío, migración
  automática: configs viejas siguen funcionando)
- `utils.ts` — `comprimirImagenParaOCR()` (1400px/0.85) además del de QR

**Validación**: tsc 0 errores · build 2.3s · 30/30 tests headless en 4
escenarios (sin key, happy path con validación del request exacto a la API,
error 403, probar key ok/inválida) · verificación visual de pantallas.

## Instalación

La APK nueva se instala **ENCIMA** de la F-ID1 (keystore estable, no hay que
desinstalar nada): [Actions → Build DriverTrack APK → artifacts](https://github.com/RiderTrack/drivertrack/actions)

Tus viajes y ajustes de F-ID1 siguen intactos — solo aparece el botón 📷 nuevo
y la sección 🤖 en Ajustes.

## Probarlo (2 minutos)

1. Instalá la APK nueva
2. Ajustes → 🤖 → pegá tu key → Probar key → guardar
3. Andá a Viajes → 📷 → sacale foto a cualquier chat de pedido o captura
   de inDrive → mirá cómo se llena todo solo
4. Si algo raro: mandame captura de la pantalla del escaneo
