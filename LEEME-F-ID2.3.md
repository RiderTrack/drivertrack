# LEEME F-ID2.3 — "% con decimales que no se guardaban" + Modo claro/oscuro 🌗

**Fecha:** 23 set 2026 · **APK:** ~2.6 MB · **Se instala ENCIMA** de F-ID2.2 (misma firma, tus viajes y key no se tocan)

## Qué pasaba (bug del 10.89)

Era el mismo demonio que el de la key en F-ID2.2: los % de comisión vivían **solo en memoria**
hasta apretar "Guardar ajustes" (el botón verde al fondo de TODA la pantalla). Si cambiabas
de pestaña o salías de la app, el 10.89 se perdía y volvía el 10 de antes.

## Qué se arregló

| Fix | Detalle |
|-----|---------|
| **Todo se autoguarda** | Meta, % de comisión (con decimales: 10.89, 25.5…), Yape/Plin y key: cada cambio se guarda al instante en el teléfono. Se acabó el botón "Guardar ajustes" — ahora hay una nota "Todo se guarda solo ✅" |
| **Inputs con decimales** | Los campos numéricos aceptan 2 decimales explícitamente (`step 0.01`) |
| **Importar backup viejo** | Un backup de una versión anterior ya no rompe nada: los campos que falten se completan con los defaults |

## Modo claro / oscuro 🌗

- Botón **☀️/🌙 arriba a la derecha** (al lado del "Neto hoy"): un toque y cambia.
- La app **recuerda** tu elección (se guarda en el teléfono) y arranca directo en tu tema,
  sin flash oscuro al abrir.
- Instalación nueva → arranca oscura (como siempre).
- Técnica: se remapean las variables de color de Tailwind 4 bajo `html.light` — toda la app
  cambia de tema sin tocar los componentes (slate invertida + acentos oscurecidos para contraste).

## Cómo probar (1 minuto)

1. Instalá el APK encima → Ajustes → poné 10.89 en inDrive → **cambiá a Viajes y volvé**: sigue 10.89 ✅
2. Tocá el **sol ☀️** arriba a la derecha → toda la app pasa a claro → cerrá y abrí la app: sigue claro ✅
3. Tocá de nuevo → vuelve a oscuro.

## Validación

- **32/32 tests headless** (Playwright + API mockeada): decimales persistentes, autoguardado de
  meta/Yape/Plin, toggle de tema + persistencia + colores computados reales, Caja y Ajustes en claro,
  regresiones F-ID2.2 (key AQ., ping sin tope de tokens, escaneo e2e), import de backup viejo.
- Verificación visual con IA de la pantalla clara: contraste y legibilidad OK.

## Siguiente fase
**F-ID3: mapa de zonas** — cada viaje con su distrito en el mapa (marcadores, sin API paga).
Después: F-ID4 stats semanales, F-ID5 robot de WhatsApp.
