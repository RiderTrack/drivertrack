# LEEME — F-ID4: 📊 Estadísticas (zonas de oro · horas de oro · precio piso)

Hermano, ya está la **fase F-ID4**. Nueva pestaña **Stats** en la barra de abajo (5ª solapa, entre Mapa y Ajustes).

## Qué trae

### 🏆 Zonas de oro — ¿DÓNDE ganás más?
- Barras horizontales con la plata neta por zona, ordenadas de mejor a peor.
- La mejor zona tiene **corona dorada 👑** y su barra es dorada; el chip de arriba te dice cuánto te deja **de promedio por viaje** en esa zona.
- Junta solo las variantes de escritura: "Surco", "surco." y "SURCO" son **UNA sola zona** (no te rompe las estadísticas el escáner).
- Los viajes sin zona van al fondo como "(sin zona)" — no te roban la corona.

### ⏰ Horas de oro — ¿CUÁNDO ganás más?
- Gráfico de **24 barras** (una por hora del día). Tus **3 mejores horas** quedan pintadas en DORADO.
- Abajo te dice cuál es tu hora de oro y **qué % de tu plata** sale de ahí — así sabés a qué hora conviene estar en la calle.

### 💰 Precio piso — ¿CUÁNTO cobrar?
- Calculado con tu **S/ por km REAL**: solo la plata de los viajes que grabaste con 📍 GPS, dividida entre sus km reales (honesto, no inflado).
- Poné **cuántos km es el viaje** → te dice **"No lo tomes por menos de S/ X"**, redondeado hacia arriba a S/ 0.50 para que lo cobres fácil en la calle.
- Si en el período que estás mirando no grabaste km, usa **toda tu historia** (y te lo avisa). Si nunca grabaste con GPS, te lo pide amablemente y te muestra tu promedio por viaje de mientras.

### De regalo
- **KPIs del período**: neto, viajes, **días trabajados** y **S/ por día** + línea de km reales con S/ por km y **S/ por hora** moviéndote.
- **📈 Cómo venís**: curva suave de tu plata por día (llena los días sin trabajar para no mentirte).
- **📅 Últimos 7 días vs semana anterior**: ▲ vas mejor / ▲ peor / igual — fijo, no depende del período elegido.
- **🏆 Tus récords**: el día con más plata y el día con más viajes **de toda tu historia** (aunque estés viendo "Hoy").
- Períodos: **Hoy / 7 días / 30 días / Todo** (en "Todo" la curva muestra los últimos 30 días para que no quede aplastada).
- Gráficos hechos a mano (divs + un SVG): **cero librerías nuevas**, la app sigue liviana y funciona sin internet.

## 🔒 Los 3 Candados (probalos en tu teléfono)

1. **📱 Instalá el APK v0.3.5** (Actions → Build DriverTrack APK → artifacts → DriverTrack-APK) sobre el que ya tenés — tus viajes, QR de Yape y todo lo demás quedan intactos. En la barra de abajo ahora hay 5 pestañas; entrá a **Stats**.

2. **🏆 Zonas + ⏰ horas**: mirá la sección "Zonas de oro" → tu mejor zona tiene corona dorada y la barra dorada. Bajá a "Horas de oro" → tus 3 mejores horas están en dorado y abajo dice qué % de tu plata sale de ahí. Cambiá el chip a "Todo" y verificá que los números cambian (entra lo viejo). Tocá una barra y mantené el dedo para ver cuánta plata dejó esa hora.

3. **💰 Precio piso**: en "Tu precio piso" fijate tu S/ por km real (con los viajes que grabaste con 📍). Poné "8" en "¿Cuántos km es el viaje?" → te dice el mínimo que conviene aceptar. Si estás viendo "Hoy" y hoy no grabaste km, te dice que está usando toda tu historia.

## Notas técnicas

- `src/services/stats.ts`: motor de agregación PURO (zonas con normalización, 24 baldes de hora, serie continua de días, métricas honestas, precio piso con redondeo a 0.50, comparativa semanal, récords) — sin React, fácil de testear.
- `src/components/EstadisticasView.tsx`: la vista (chips de período + KPIs + curva SVG + comparativa + zonas + horas + piso + récords).
- Regla de honestidad heredada de Caja: el S/ por km **solo** mezcla la plata de viajes con kmGPS > 0.
- Tests: **60 nuevos** (test_fid4_headless.mjs) + **173 de regresión** (F-ID3 44 · F-ID3.2 36 · F-ID3.3 52 · F-ID3.4 41, con la aserción de versión actualizada a 0.3.5) = **233/233 ✅**.
- Versiones: package.json 0.3.3 → **0.3.5** (alineado con el badge de Ajustes).
