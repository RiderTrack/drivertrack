# 🏍️ DriverTrack

**Gestión para el rider independiente** — viajes multi-app (inDrive, Rappi, PedidosYa, directo), cálculo de comisiones y **neto real**, meta del día con celebración, caja diaria y cobros por Yape/Plin con QR.

App hermana de [RiderTrack V2](https://github.com/RiderTrack/ridertrack-v2) — misma arquitectura (React 19 + Vite + Tailwind 4 + Capacitor 6), enfocada 100% en el rider que trabaja por su cuenta.

## ✨ Funciones

- **➕ Viaje rápido**: elegís plataforma, ponés la tarifa → la app calcula EN VIVO la comisión y **lo que te queda neto**
- **🎯 Meta del día**: "S/ 100 y me voy a casa" — barra de progreso + confeti 🎉 + vibración cuando llegás
- **💰 Caja**: resumen por día (bruto / comisiones / neto), navegación por fecha, exportar CSV, compartir resumen por WhatsApp
- **💜 Cobrar con Yape/Plin**: panel con tu QR + número + monto, listo para mandar al cliente
- **📷 Escanear pedido (F-ID2 → F-ID2.5)**: foto o captura del pedido → la IA llena el viaje sola: cliente, zona, tarifa, **dirección y celular con campos propios**. Doble key: **Gemini gratis + token de Claude de respaldo** — si Gemini se queda sin créditos, Claude lo rescata solo. Errores traducidos al español claro
- **💬 Cobrar por WhatsApp (F-ID2.5)**: con el celular del cliente, el botón **Cobrar** abre su chat con el mensaje de pago listo (estilo QR de RiderTrack): saludo, monto a pagar, dirección y tu Yape/Plin — también desde cada viaje guardado
- **🌗 Modo claro/oscuro (F-ID2.3)** y **ajustes con autoguardado total** (los decimales de la comisión ya no se pierden)
- **🗄️ Backup local**: exportá/importá todos tus datos en JSON (local-first, sin cuentas)

## 📱 Instalación

Descargá la APK desde [Actions → Build DriverTrack APK → artifacts](https://github.com/RiderTrack/drivertrack/actions) (firmada y estable).

## 🗺️ Roadmap

| Fase | Qué trae | Estado |
|------|----------|--------|
| F-ID1 | Viaje + comisión + meta + caja + QR Yape | ✅ |
| F-ID2 | Foto → OCR Gemini (dirección/cliente/monto automáticos) | ✅ |
| F-ID3 | Mapa en vivo + km GPS por viaje (copy de RiderTrack) | ⏳ |
| F-ID4 | Estadísticas: zonas, horas de oro, precio piso | ⏳ |
| F-ID5 | Robot WhatsApp: mandar QR + monto al cliente automático | ⏳ |

> F-ID2.x (mejoras del escáner): 2.1 keys nuevas + Claude · 2.2 autoguardado key · 2.3 decimales + tema · 2.4 galería + errores técnicos · **2.5 doble key con respaldo + WhatsApp de cobro**

## 🧱 Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS 4 + Lucide
- Capacitor 6 → APK Android firmada (keystore estable en Secrets)
- Datos 100% locales (localStorage) + backup JSON

## 🔧 Desarrollo

```bash
npm install
npm run dev     # http://localhost:3100
npm run build   # dist/
```
