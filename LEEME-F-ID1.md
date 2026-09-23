# LEEME — F-ID1: Nace DriverTrack 🏍️

## ¿Qué es DriverTrack?

La app del **rider independiente** — hermana de RiderTrack V2 pero 100% enfocada
en el trabajo por cuenta propia (inDrive, Rappi, PedidosYa, clientes directos).
App SEPARADA a pedido del dueño: no toca nada del trabajo de MATE Pharmacy.

## Qué incluye F-ID1

### 1. ➕ Viaje rápido (el corazón)
- Elegís la plataforma (inDrive / Rappi / PedidosYa / Directo)
- Ponés la tarifa → **cálculo EN VIVO**: "la plataforma se queda −S/ X" y
  "**TE QUEDA NETO: S/ Y**"
- El % de comisión se precarga por plataforma (configurable en Ajustes)
  y se puede cambiar en cada viaje (útil para contraofertas de inDrive)
- Cliente y zona opcionales (para las estadísticas de F-ID4)

### 2. 🎯 Meta del día
- Se configura en Ajustes (default: S/ 100 netos)
- Barra de progreso con colores: ámbar → esmeralda al llegar
- Al cumplir: **¡META CUMPLIDA! VÁMONOS A CASA 🏍️🏠** + confeti 🎉 +
  vibración (Haptics nativo en APK). Se celebra 1 vez por día.

### 3. 💰 Caja
- Resumen del día: n° viajes, bruto, comisiones, NETO (4 tarjetas)
- Navegación por días (← →)
- Exportar CSV del día (se descarga como archivo)
- Compartir resumen por WhatsApp (texto armado, listo para mandar)
- Botón "Cobrar Yape" → abre el panel de cobro con el neto del día

### 4. 💜 Cobro Yape/Plin
- Panel con: monto editable + QR (imagen que subís de tu app Yape) +
  número + titular
- Botones: copiar número / mandar por WhatsApp (link wa.me con mensaje armado)
- El QR se comprime a JPEG 800px (mismo approach de RiderTrack)

### 5. ⚙️ Ajustes
- Meta diaria + comisiones default por plataforma
- Datos Yape y Plin (número, titular, QR)
- Backup: exportar/importar JSON de TODOS los viajes + configuración
- Zona peligrosa: borrar todo (con confirmación)

## Decisiones técnicas

| Decisión | Por qué |
|----------|---------|
| **App separada** | Pedido del dueño: no arriesgar la app del trabajo |
| **Local-first** (sin Firebase) | Cero fricción: sin login, sin cuentas, abre y usa. La sincronización en la nube se evalúa después |
| **Keystore estable en Secrets** | Todas las APKs salen firmadas IGUAL → las actualizaciones futuras instalan encima sin desinstalar (se creó KEYSTORE_BASE64 en el repo) |
| **base: './' en Vite** | La build funciona en APK y en cualquier hosting/dominio sin recompilar (lección de F-WEB1 de RiderTrack) |
| **Permisos CAMERA ya incluidos** | Listo para F-ID2 (foto → OCR Gemini), sin tocar el manifest otra vez |

## Verificación realizada (3 Candados)

1. 🔒 **Candado 1**: repo nuevo `RiderTrack/drivertrack` + código desde cero
   con los patrones probados de RiderTrack (misma versión de React/Vite/Tailwind)
2. 🔒 **Candado 2**: build local verificada sin errores antes del push
3. 🔒 **Candado 3**: este LEEME + worklog del asistente + APK en CI (artifact
   `DriverTrack-APK`) — **instalar solo cuando el dueño la pruebe y confirme**

## Cómo probar

1. GitHub → Actions → "Build DriverTrack APK" → última run → artifact `DriverTrack-APK`
2. Descargar, instalar (permitir orígenes desconocidos), abrir
3. Probar: agregar un viaje de prueba → ver el cálculo → ver la meta subir
4. Configurar en Ajustes: tu meta, tu número de Yape y tu QR

## Lo que sigue (no incluido en F-ID1)

- **F-ID2**: foto de la pantalla de inDrive → Gemini extrae dirección/cliente/monto
- **F-ID3**: mapa en vivo + km GPS (copy del módulo de RiderTrack)
- **F-ID4**: estadísticas por zona, horas de oro, precio piso
- **F-ID5**: robot WhatsApp hermano de rudy-bot (mandar QR + monto al cliente)

— F-ID1, registrado también en el worklog del asistente. Trackverse 🏍️
