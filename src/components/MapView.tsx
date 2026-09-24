// ═══════════════════════════════════════════════════════════
// 🗺️ DriverTrack — Mapa del día (F-ID3 → F-ID3.1)
// Dibuja las RUTAS GPS grabadas con el botón 📍 de la lista:
// cada viaje es una línea del color de su origen, con banderín 🏁
// de arranque (verde) y llegada (rojo). Abajo, los números que
// importan: km totales del día y cuánto te pagó cada km.
// Leaflet + tiles gratuitos — sin API key, sin costo.
//
// F-ID3.1 — MISMO LOOK que RiderTrack v2:
//   • tiles ESRI Dark Gray (mapa oscuro elegante) por defecto,
//     con capa de NOMBRES encima (esri separa fondo y labels)
//   • ciclo 🎨 Oscuro → Claro → Satélite (botón con el nombre
//     del estilo actual, como el de RiderTrack)
//   • rutas PUNTEADAS con animación de flujo (los guiones
//     caminan a lo largo de la ruta)
//   • banderines círculo con borde blanco + tooltip oscuro
//   • popups/tooltip/zoom/fondo oscuros (chroma del mapa)
//   • leyenda flotante DENTRO del mapa con blur
// ═══════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { nombreOrigen, OrigenViaje, Viaje } from '../types';
import { fechaBonita, fechaHoy } from '../storage';
import { fmtSoles } from '../utils';
import { formatearDuracion } from '../services/gps';

interface Props {
  viajes: Viaje[]; // TODOS los viajes (acá se filtra por día)
}

type EstiloMapa = 'oscuro' | 'claro' | 'satelite';

const K_ESTILO = 'dt_estilo_mapa';
const ORDEN_ESTILOS: EstiloMapa[] = ['oscuro', 'claro', 'satelite'];

// Color de línea por origen (mismo código de colores del resto de la app)
const COLOR_ORIGEN: Record<OrigenViaje, string> = {
  indrive: '#10b981',   // emerald
  rappi: '#f97316',     // orange
  pedidosya: '#ef4444', // red
  directo: '#38bdf8',   // sky
};

// ── Tiles (los mismos de RiderTrack v2) ─────────────────────
// ESRI separa el FONDO de los NOMBRES en el tema gray: la capa
// refUrl va encima o el mapa queda sin nombres de calles.
// maxNativeZoom 16: ESRI gray no tiene zoom 17+ → Leaflet
// reescala el 16 en vez de mostrar vacío.
const TILES: Record<EstiloMapa, { url: string; refUrl?: string; atribucion: string }> = {
  oscuro: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    refUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    atribucion: 'Esri',
  },
  claro: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    refUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    atribucion: 'Esri',
  },
  satelite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    atribucion: 'Esri, Maxar',
  },
};

function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(y, m - 1, d + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function leerEstilo(): EstiloMapa {
  try {
    const v = localStorage.getItem(K_ESTILO);
    if (v === 'satelite') return 'satelite';
    // 'calles' (F-ID3) o basura → el nuevo default de RiderTrack
    if (v === 'claro') return 'claro';
  } catch {
    /* nada */
  }
  return 'oscuro';
}

/** Escapa texto para los popups HTML (nombres de clientes, etc.) */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Banderín 🏁 estilo RiderTrack: círculo con borde blanco + icono */
function iconoBanderin(colorFondo: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html:
      `<div style="width:32px;height:32px;border-radius:50%;background:${colorFondo};border:3px solid #fff;` +
      `box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center">` +
      `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>` +
      `<line x1="4" y1="22" x2="4" y2="15"></line>` +
      `</svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function MapView({ viajes }: Props) {
  const [fecha, setFecha] = useState(fechaHoy());
  const [estilo, setEstilo] = useState<EstiloMapa>(leerEstilo);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const capaTilesRef = useRef<L.LayerGroup | null>(null);
  const capaRutasRef = useRef<L.LayerGroup | null>(null);

  const delDia = useMemo(() => viajes.filter(v => v.fecha === fecha), [viajes, fecha]);
  const conRuta = useMemo(() => delDia.filter(v => v.ruta && v.ruta.length >= 2), [delDia]);
  const sinGPS = useMemo(() => delDia.filter(v => !v.ruta || v.ruta.length < 2), [delDia]);

  const kmTotal = delDia.reduce((s, v) => s + (v.kmGPS ?? 0), 0);
  const segTotal = delDia.reduce((s, v) => s + (v.duracionSeg ?? 0), 0);
  // S/ por km HONESTO: solo la plata de los viajes que SÍ se
  // grabaron (si se mezclara el neto de viajes sin GPS, el "por km"
  // saldría inflado y no significaría nada)
  const netoGrabado = conRuta.reduce((s, v) => s + v.neto, 0);
  const solesPorKm = kmTotal > 0 ? netoGrabado / kmTotal : 0;
  const esHoy = fecha === fechaHoy();

  // ── Crear el mapa UNA vez y redibujar rutas cuando cambia el día ──
  useEffect(() => {
    if (!contenedorRef.current) return;
    if (!mapaRef.current) {
      mapaRef.current = L.map(contenedorRef.current, {
        zoomControl: false,          // móvil: se hace zoom con los dedos
        attributionControl: false,   // la atribución va como texto chiquito abajo
        maxZoom: 19,
      }).setView([-12.046, -77.043], 11); // Lima por defecto hasta que haya rutas
      L.control.zoom({ position: 'bottomright' }).addTo(mapaRef.current);
      capaRutasRef.current = L.layerGroup().addTo(mapaRef.current);
    }
    const mapa = mapaRef.current;

    // Tiles según el estilo elegido (base + capa de nombres si hay)
    capaTilesRef.current?.remove();
    const t = TILES[estilo];
    const grupo = L.layerGroup();
    L.tileLayer(t.url, { maxZoom: 19, maxNativeZoom: 16, attribution: t.atribucion }).addTo(grupo);
    if (t.refUrl) {
      L.tileLayer(t.refUrl, { maxZoom: 19, maxNativeZoom: 16 }).addTo(grupo);
    }
    grupo.addTo(mapa);
    capaTilesRef.current = grupo;

    try {
      localStorage.setItem(K_ESTILO, estilo);
    } catch {
      /* nada */
    }

    // (Re)dibujar las rutas del día
    const capa = capaRutasRef.current!;
    capa.clearLayers();
    const bounds = L.latLngBounds([]);

    for (const v of conRuta) {
      const puntos = v.ruta!.map(p => [p.lat, p.lng] as [number, number]);
      const color = COLOR_ORIGEN[v.origen] ?? '#38bdf8';

      // Línea punteada ANIMADA (los guiones fluyen a lo largo de
      // la ruta — mismo look que el mapa de RiderTrack v2)
      L.polyline(puntos, {
        color,
        weight: 3.5,
        dashArray: '6 9',
        opacity: 0.9,
        className: 'dtmap-ruta',
      })
        .bindPopup(
          `<div style="font-weight:800;font-size:13px;margin-bottom:2px">${esc(v.cliente || 'Cliente')}</div>` +
            `<div style="font-size:11px;color:#94a3b8">${esc(nombreOrigen(v.origen))} · ${fmtSoles(v.tarifa)}</div>` +
            `<div style="font-size:11px;color:#94a3b8">📍 ${(v.kmGPS ?? 0).toFixed(1)} km · ${formatearDuracion(v.duracionSeg ?? 0)}</div>`,
          { className: 'dtmap-popup' },
        )
        .addTo(capa);

      // 🏁 Banderines de arranque y llegada
      L.marker(puntos[0], { icon: iconoBanderin('#10b981'), zIndexOffset: 900 })
        .bindTooltip(`🏁 Arranque · ${v.cliente || 'Cliente'}`, {
          className: 'dtmap-tooltip',
          direction: 'top',
          offset: [0, -16],
        })
        .addTo(capa);
      L.marker(puntos[puntos.length - 1], { icon: iconoBanderin('#f43f5e'), zIndexOffset: 900 })
        .bindTooltip(`🏁 Llegada · ${v.cliente || 'Cliente'}`, {
          className: 'dtmap-tooltip',
          direction: 'top',
          offset: [0, -16],
        })
        .addTo(capa);

      bounds.extend(puntos);
    }

    if (bounds.isValid()) mapa.fitBounds(bounds.pad(0.15));
    setTimeout(() => mapa.invalidateSize(), 60); // el div aparece después del mount
  }, [conRuta, estilo]);

  // Destruir el mapa al desmontar (cambiar de pestaña desmonta el componente)
  useEffect(() => {
    return () => {
      mapaRef.current?.remove();
      mapaRef.current = null;
    };
  }, []);

  const nombreEstilo = estilo === 'oscuro' ? 'Oscuro' : estilo === 'claro' ? 'Claro' : 'Satélite';

  return (
    <div className="space-y-3" data-testid="mapa-view">
      {/* Estilos del mapa (chroma oscuro estilo RiderTrack) + animaciones */}
      <style>{`
        @keyframes dtmapFlujo { to { stroke-dashoffset: -300; } }
        .dtmap-ruta { animation: dtmapFlujo 18s linear infinite; }
        .dtmap-popup .leaflet-popup-content-wrapper { background: #1e293b; color: #f1f5f9; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 8px 24px rgba(0,0,0,.5); }
        .dtmap-popup .leaflet-popup-tip { background: #1e293b; border: 1px solid #334155; }
        .dtmap-popup .leaflet-popup-content { margin: 12px 14px; font-size: 12px; line-height: 1.5; }
        .dtmap-tooltip.leaflet-tooltip { background: #1e293b; color: #f1f5f9; border: 1px solid #334155; font-size: 11px; font-weight: 700; }
        .dtmap-tooltip.leaflet-tooltip::before { border-top-color: #1e293b; }
        .leaflet-container { background: #0f172a; font-family: inherit; }
        .leaflet-bar a { background: #1e293b; color: #e2e8f0; border-color: #334155; }
        .leaflet-bar a:hover { background: #334155; }
      `}</style>

      {/* Navegador de fecha */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-800/60 p-2">
        <button
          onClick={() => setFecha(sumarDias(fecha, -1))}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-700"
          aria-label="Día anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold capitalize text-slate-100">{fechaBonita(fecha)}</p>
          {!esHoy && (
            <button onClick={() => setFecha(fechaHoy())} className="text-[11px] text-emerald-400 underline">
              ir a hoy
            </button>
          )}
        </div>
        <button
          onClick={() => setFecha(sumarDias(fecha, 1))}
          disabled={esHoy}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-700 disabled:opacity-30"
          aria-label="Día siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Resumen del día */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-2.5 text-center">
          <p className="text-sm font-black text-sky-300 tabular-nums" data-testid="mapa-km-total">
            {kmTotal.toFixed(1)} km
          </p>
          <p className="text-[10px] text-sky-500/80">km reales GPS</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-2.5 text-center">
          <p className="text-sm font-black text-slate-200 tabular-nums">{formatearDuracion(segTotal)}</p>
          <p className="text-[10px] text-slate-400">manejando</p>
        </div>
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-center">
          <p className="text-sm font-black text-emerald-400 tabular-nums" data-testid="mapa-por-km">
            {kmTotal > 0 ? `S/ ${solesPorKm.toFixed(2)}` : '—'}
          </p>
          <p className="text-[10px] text-emerald-500/80">por km grabado</p>
        </div>
      </div>

      {/* El mapa — aislado (isolate) para que sus capas no se metan
          con la navegación de abajo, como en RiderTrack */}
      <div className="relative isolate overflow-hidden rounded-2xl border border-slate-700 shadow-xl">
        <div ref={contenedorRef} className="h-[340px] w-full" data-testid="mapa-hoja" />

        {/* Botón 🎨 estilo: Oscuro → Claro → Satélite (muestra el actual) */}
        <button
          onClick={() =>
            setEstilo(e => ORDEN_ESTILOS[(ORDEN_ESTILOS.indexOf(e) + 1) % ORDEN_ESTILOS.length])
          }
          className="absolute right-2 top-2 z-[500] flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-900/90 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 shadow"
          title="Cambiar el estilo del mapa (oscuro / claro / satélite)"
          data-testid="boton-estilo-mapa"
        >
          <Palette size={12} /> {nombreEstilo}
        </button>

        {/* Leyenda flotante DENTRO del mapa (estilo RiderTrack) */}
        {conRuta.length > 0 && (
          <div
            className="absolute left-2 top-2 z-[500] flex flex-col gap-1 rounded-xl border border-slate-700 bg-slate-900/80 px-2.5 py-2 text-[10px] font-bold text-slate-300 backdrop-blur-md"
            data-testid="mapa-leyenda"
          >
            {Object.entries(COLOR_ORIGEN).map(([o, color]) => {
              const hay = delDia.some(v => v.origen === o && v.ruta && v.ruta.length >= 2);
              if (!hay) return null;
              return (
                <span key={o} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-white/60"
                    style={{ background: color }}
                  />
                  {nombreOrigen(o as OrigenViaje)}
                </span>
              );
            })}
            <span className="mt-0.5 flex items-center gap-1.5 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full border border-white/60 bg-emerald-500" /> arranque
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full border border-white/60 bg-rose-500" /> llegada
            </span>
          </div>
        )}

        <p className="pointer-events-none absolute bottom-1 left-2 z-[500] rounded bg-slate-950/60 px-1.5 text-[8px] text-slate-300">
          {TILES[estilo].atribucion}
        </p>
      </div>

      {/* Estado vacío */}
      {conRuta.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 p-6 text-center"
          data-testid="mapa-vacio"
        >
          <p className="text-sm text-slate-400">
            {sinGPS.length === 0
              ? 'Todavía no hay viajes este día'
              : 'Todavía no grabaste rutas este día'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {sinGPS.length > 0 &&
              `Apretá el botón 📍 azul de un viaje en la lista y tus km aparecen acá dibujados`}
          </p>
        </div>
      ) : (
        sinGPS.length > 0 && (
          <p
            className="truncate px-1 text-[10px] text-slate-500"
            title={sinGPS.map(v => v.cliente || 'cliente').join(', ')}
            data-testid="mapa-sin-gps"
          >
            🚫 sin GPS ({sinGPS.length}): {sinGPS.map(v => v.cliente || 'cliente').join(', ')}
          </p>
        )
      )}
    </div>
  );
}
