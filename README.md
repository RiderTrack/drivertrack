# 🏍️ DriverTrack

**Gestión para el rider independiente** — viajes multi-app (inDrive, Rappi, PedidosYa, directo), cálculo de comisiones y **neto real**, meta del día con celebración, caja diaria y cobros por Yape/Plin con QR.

App hermana de [RiderTrack V2](https://github.com/RiderTrack/ridertrack-v2) — misma arquitectura (React 19 + Vite + Tailwind 4 + Capacitor 6), enfocada 100% en el rider que trabaja por su cuenta.

## ✨ Funciones

- **➕ Viaje rápido**: elegís plataforma, ponés la tarifa → la app calcula EN VIVO la comisión y **lo que te queda neto**
- **🎯 Meta del día**: "S/ 100 y me voy a casa" — barra de progreso + confeti 🎉 + vibración cuando llegás
- **💰 Caja**: resumen por día (bruto / comisiones / neto), navegación por fecha, exportar CSV, compartir resumen por WhatsApp
- **💜 Cobrar con Yape/Plin**: panel con tu QR + número + monto, listo para mandar al cliente
- **📷 Escanear pedido (F-ID2 → F-ID2.6)**: foto o captura del pedido → la IA llena el viaje sola: cliente, zona, tarifa, **dirección y celular con campos propios** + **💜 yape del pedido (nombre y número)**. Doble key: **Gemini gratis + token de Claude de respaldo** — si Gemini se queda sin créditos, Claude lo rescata solo. Errores traducidos al español claro. La IA ya no confunde el código de la calle ("C.1") con el nombre del cliente, y si la foto trae "Mk yape 987…", Mk ES el cliente
- **💬 Cobrar por WhatsApp (F-ID2.5 → F-ID2.7)**: con el celular del cliente (se autollena con el yape si la foto no trae teléfono), el botón **Cobrar** abre su chat con el mensaje de pago **ordenado en bloques** (saludo / monto + entrega / cómo pagar / gracias) — también desde cada viaje guardado
- **💜 Tu Yape guardado 1 vez (F-ID2.7)**: tarjeta en la pestaña Viajes → guardás tu número **una sola vez** y sale solo en **todos** los mensajes de cobro (no se borra al agregar más viajes) + **📋 vista previa del mensaje siempre visible** que se actualiza en vivo, estilo chat de WhatsApp
- **📍 km GPS reales por viaje (F-ID3)**: apretás ▶ en un viaje de la lista y la app graba los **km y el tiempo REALES** mientras manejás (barra verde flotante con km en vivo + cronómetro) → al apretar ■ todo queda guardado EN ese viaje. Sobrevive recargas y el asesino de memoria de Android (resume solo), filtra el ruido del GPS (semáforo no suma metros fantasma) y si arrancás otro viaje, el anterior se guarda solo. La pantalla no se apaga mientras graba
- **🗺️ Pestaña Mapa (F-ID3)**: las rutas del día dibujadas en un mapa real (calles 🗺️ o satélite 🛰️, gratis y sin API key), cada línea del color de su app, con 🟢 arranque y 🔴 llegada — tocás una línea y ves cliente, app, monto, km y duración. Abajo: **km totales, tiempo manejando y cuánto te pagó cada km** (S/ por km, contando solo la plata de los viajes grabados). Navegación por día para revisar lo de ayer
- **🌗 Modo claro/oscuro (F-ID2.3)** y **ajustes con autoguardado total** (los decimales de la comisión ya no se pierden)
- **🗄️ Backup local**: exportá/importá todos tus datos en JSON (local-first, sin cuentas)

## 📱 Instalación

Descargá la APK desde [Actions → Build DriverTrack APK → artifacts](https://github.com/RiderTrack/drivertrack/actions) (firmada y estable).

## 🗺️ Roadmap

| Fase | Qué trae | Estado |
|------|----------|--------|
| F-ID1 | Viaje + comisión + meta + caja + QR Yape | ✅ |
| F-ID2 | Foto → OCR Gemini (dirección/cliente/monto automáticos) | ✅ |
| F-ID3 | Mapa en vivo + km GPS por viaje (copy de RiderTrack) | ✅ |
| F-ID4 | Estadísticas: zonas, horas de oro, precio piso | ⏳ |
| F-ID5 | Robot WhatsApp: mandar QR + monto al cliente automático | ⏳ |

> F-ID2.x (mejoras del escáner): 2.1 keys nuevas + Claude · 2.2 autoguardado key · 2.3 decimales + tema · 2.4 galería + errores técnicos · 2.5 doble key con respaldo + WhatsApp de cobro · 2.6 nombre real (no confunde "C.1" con la persona) + yape del pedido · 2.7 tu Yape guardado 1 vez + mensaje ordenado + vista previa en vivo · **2.8 mensaje unificado: el botón 💬 de la lista manda EXACTAMENTE el mismo mensaje que el Cobrar de arriba**
>
> **F-ID3** 📍🗺️: grabación GPS por viaje (watchPosition + haversine con filtros anti-ruido: precisión >40 m se ignora, jitter <8 m no suma, saltos >5 km son glitches) + resume automático tras recarga + wake lock (la pantalla no se apaga) + mapa Leaflet con tiles OSM/Esri + S/ por km honesto (solo neto de viajes grabados)

## 🧱 Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS 4 + Lucide + Leaflet (mapa)
- Capacitor 6 → APK Android firmada (keystore estable en Secrets)
- Datos 100% locales (localStorage) + backup JSON

## 🔧 Desarrollo

```bash
npm install
npm run dev     # http://localhost:3100
npm run build   # dist/
```
