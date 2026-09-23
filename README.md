# 🏍️ DriverTrack

**Gestión para el rider independiente** — viajes multi-app (inDrive, Rappi, PedidosYa, directo), cálculo de comisiones y **neto real**, meta del día con celebración, caja diaria y cobros por Yape/Plin con QR.

App hermana de [RiderTrack V2](https://github.com/RiderTrack/ridertrack-v2) — misma arquitectura (React 19 + Vite + Tailwind 4 + Capacitor 6), enfocada 100% en el rider que trabaja por su cuenta.

## ✨ Funciones (F-ID1)

- **➕ Viaje rápido**: elegís plataforma, ponés la tarifa → la app calcula EN VIVO la comisión y **lo que te queda neto**
- **🎯 Meta del día**: "S/ 100 y me voy a casa" — barra de progreso + confeti 🎉 + vibración cuando llegás
- **💰 Caja**: resumen por día (bruto / comisiones / neto), navegación por fecha, exportar CSV, compartir resumen por WhatsApp
- **💜 Cobrar con Yape/Plin**: panel con tu QR + número + monto, listo para mandar al cliente
- **🗄️ Backup local**: exportá/importá todos tus datos en JSON (local-first, sin cuentas)

## 📱 Instalación

Descargá la APK desde [Actions → Build DriverTrack APK → artifacts](https://github.com/RiderTrack/drivertrack/actions) (firmada y estable).

## 🗺️ Roadmap

| Fase | Qué trae | Estado |
|------|----------|--------|
| F-ID1 | Viaje + comisión + meta + caja + QR Yape | ✅ |
| F-ID2 | Foto → OCR Gemini (dirección/cliente/monto automáticos) | ⏳ |
| F-ID3 | Mapa en vivo + km GPS por viaje (copy de RiderTrack) | ⏳ |
| F-ID4 | Estadísticas: zonas, horas de oro, precio piso | ⏳ |
| F-ID5 | Robot WhatsApp: mandar QR + monto al cliente automático | ⏳ |

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
