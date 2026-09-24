// ═══════════════════════════════════════════════════════════
// 🗺️ DriverTrack — Mapa del día (F-ID3)
// Dibuja las RUTAS GPS grabadas con el botón 📍 de la lista:
// cada viaje es una línea del color de su origen, con marca de
// arranque 🟢 y llegada 🔴. Abajo, los números que importan:
// km totales del día y cuánto te pagó cada km (S/ por km).
// Leaflet + tiles gratuitos (OSM calles / Esri satélite) — sin
// API key, sin costo, igual que el mapa de RiderTrack v2.
// ═══════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { nombreOrigen, OrigenViaje, Viaje } from '../types';
import { fechaBonita, fechaHoy, resumenDia } from '../storage';
import { fmtSoles } from '../utils';
import { formatearDuracion } from '../services/gps';

interface Props {
  viajes: Viaje[]; // TODOS los viajes (acá se filtra por día)
}

type EstiloMapa = 'calles' | 'satelite';

const K_ESTILO = 'dt_estilo_mapa';

// Color de línea por origen (mismo código de colores del resto de la app)
const COLOR_ORIGEN: Record<OrigenViaje, string> = {
  indrive: '#10b981',   // emerald
  rappi: '#f97316',     // orange
  pedidosya: '#ef4444', // red
  directo: '#38bdf8',   // sky
};

const TILES: Record<EstiloMapa, { url: string; atribucion: string }> = {
  calles: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    atribucion: '&copy; OpenStreetMap',
  },
  satelite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    atribucion: 'Esri, Maxar, Earthstar Geographics',
  },
};

function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(y, m - 1, d + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function leerEstilo(): EstiloMapa {
  try {
    return localStorage.getItem(K_ESTILO) === 'satelite' ? 'satelite' : 'calles';
  } catch {
    return 'calles';
  }
}

export default function MapView({ viajes }: Props) {
  const [fecha, setFecha] = useState(fechaHoy());
  const [estilo, setEstilo] = useState<EstiloMapa>(leerEstilo);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const capaTilesRef = useRef<L.TileLayer | null>(null);
  const capaRutasRef = useRef<L.LayerGroup | null>(null);

  const delDia = useMemo(() => viajes.filter(v => v.fecha === fecha), [viajes, fecha]);
  const conRuta = useMemo(() => delDia.filter(v => v.ruta && v.ruta.length >= 2), [delDia]);
  const sinGPS = useMemo(() => delDia.filter(v => !v.ruta || v.ruta.length < 2), [delDia]);
  const resumen = useMemo(() => resumenDia(viajes, fecha), [viajes, fecha]);

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
      }).setView([-12.046, -77.043], 11); // Lima por defecto hasta que haya rutas
      L.control.zoom({ position: 'bottomright' }).addTo(mapaRef.current);
      capaRutasRef.current = L.layerGroup().addTo(mapaRef.current);
    }
    const mapa = mapaRef.current;

    // Tiles según el estilo elegido
    capaTilesRef.current?.remove();
    capaTilesRef.current = L.tileLayer(TILES[estilo].url, {
      maxZoom: 19,
      attribution: TILES[estilo].atribucion,
    }).addTo(mapa);

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

      L.polyline(puntos, { color, weight: 4, opacity: 0.85 })
        .bindPopup(
          `<b>${v.cliente || 'Cliente'}</b><br>${nombreOrigen(v.origen)} · ${fmtSoles(v.tarifa)}` +
            `<br>📍 ${(v.kmGPS ?? 0).toFixed(1)} km · ${formatearDuracion(v.duracionSeg ?? 0)}`,
        )
        .addTo(capa);

      // 🟢 arranque y 🔴 llegada
      L.circleMarker(puntos[0], { radius: 6, color: '#10b981', fillOpacity: 1, fillColor: '#10b981' })
        .bindPopup(`<b>Arranque</b><br>${v.cliente || 'Cliente'}`)
        .addTo(capa);
      L.circleMarker(puntos[puntos.length - 1], {
        radius: 6,
        color: '#f43f5e',
        fillOpacity: 1,
        fillColor: '#f43f5e',
      })
        .bindPopup(`<b>Llegada</b><br>${v.cliente || 'Cliente'}`)
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

  return (
    <div className="space-y-3" data-testid="mapa-view">
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

      {/* El mapa */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700">
        <div ref={contenedorRef} className="h-72 w-full" data-testid="mapa-hoja" />
        <button
          onClick={() => setEstilo(e => (e === 'calles' ? 'satelite' : 'calles'))}
          className="absolute right-2 top-2 z-[500] flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-900/90 px-2 py-1.5 text-[10px] font-bold text-slate-200 shadow"
          aria-label="Cambiar calles / satélite"
          data-testid="boton-estilo-mapa"
        >
          <Layers size={12} /> {estilo === 'calles' ? 'Satélite' : 'Calles'}
        </button>
        <p className="pointer-events-none absolute bottom-1 left-2 z-[500] rounded bg-slate-950/60 px-1.5 text-[8px] text-slate-300">
          {estilo === 'calles' ? '© OpenStreetMap' : 'Esri'}
        </p>
      </div>

      {/* Leyenda por origen */}
      {conRuta.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1" data-testid="mapa-leyenda">
          {Object.entries(COLOR_ORIGEN).map(([o, color]) => {
            const hay = delDia.some(v => v.origen === o && v.ruta && v.ruta.length >= 2);
            if (!hay) return null;
            return (
              <span
                key={o}
                className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {nombreOrigen(o as OrigenViaje)}
              </span>
            );
          })}
        </div>
      )}

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
