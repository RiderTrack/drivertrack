# LEEME F-ID2.2 — Hotfix: "se borra la key" + "no hay foto para escanear"

**Fecha:** 23 set 2026 · **APK:** ~2.6 MB · **Se instala ENCIMA** de F-ID2/F-ID2.1 (misma firma, tus datos no se tocan)

## Qué pasaba (los 2 bugs que reportaste)

### Bug 1 — "Pego la key y se borra"
La key que pegabas en Ajustes **vivía solo en la memoria** hasta que aprietes el botón
"Guardar ajustes" (verde, al fondo de TODA la página de ajustes). Si cambiabas de pestaña
(Viajes ↔ Ajustes), o Android reiniciaba la app al volver de AI Studio… la key desaparecía
y había que copiarla y pegarla otra vez. El botón "Probar key" tampoco guardaba.

### Bug 2 — "Pongo Probar y me dice que no hay foto para escanear"
El botón "Probar key" mandaba un ping diminuto a Gemini con un tope de **10 tokens**.
Los modelos nuevos (Gemini 3.x) **piensan antes de responder** y se gastaban esos 10
tokens pensando → respondían **vacío** → la app lo traducía como
"No pude leer nada en la foto 🤔"… en un botón donde nunca hubo foto. Confusión total.

## Qué se arregló

| Fix | Dónde |
|-----|-------|
| La key se **autoguarda al pegarla** (cada letra, a localStorage). Cambiar de pestaña, reiniciar el teléfono, lo que sea: ya no se pierde | `AjustesView.tsx` |
| "Probar key" **también guarda** la key antes de probar | `AjustesView.tsx` |
| Ping **sin tope de tokens** → los modelos pensantes responden normal | `escanerIA.ts` |
| Los **"pensamientos"** de los modelos 3.x (`thought: true`) **se filtran** para no contaminar el JSON del escaneo | `escanerIA.ts` |
| Si un modelo responde 200 pero vacío en el ping → ahora se reporta como **"la key funciona"** (porque es verdad) | `escanerIA.ts` |

## Cómo probar que quedó arreglado (1 minuto)

1. Instalá el APK nuevo **encima** del que tenés.
2. Ajustes → pegá tu key `AQ.…` → **cambiá a Viajes y volvé a Ajustes** → la key sigue ahí ✅
3. Aprieta **"Probar key"** → tiene que decir `Key Gemini funcionando ✅ … · quedó guardada ✅`
4. Andá a Viajes → **Escanear dirección** → foto del pedido → el formulario se llena solo.

## Notas técnicas

- Auth por header `x-goog-api-key` (funciona con keys `AIza…` y `AQ.…`).
- Formatos aceptados: `AIza…` (clásica), `AQ.…` (nueva de Google) y `sk-ant-…` (Claude, de pago).
- Tests headless: **26/26** (autoguardado, sobrevivir cambio de pestaña y reload, ping con
  modelo pensante, modelo mudo, 403, formato inválido, escaneo de punta a punta con
  thoughts-trampa, Claude, flujo sin key).
- Verificado con la key real del usuario: la API responde, pero **el servidor de este
  chat está en región bloqueada por Google** — por eso las pruebas acá van con mock y en
  tu teléfono van de verdad.

## Próxima fase (F-ID3)
Mapa con la zona de cada viaje (marcadores por distrito, sin API paga). Después: F-ID4 stats semanales, F-ID5 robot de WhatsApp.
