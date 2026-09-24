// ═══════════════════════════════════════════════════════════
// 🏍️ DriverTrack — Shell principal (F-ID1 → F-ID3)
// Pestañas: Viajes (form + meta + lista) · Caja · Mapa · Ajustes
// Local-first: todo en localStorage, backup JSON.
// F-ID3: la grabación GPS vive ACÁ (en el shell) para que siga
// corriendo aunque cambies de pestaña — la barra verde muestra
// los km en vivo y al terminar quedan guardados en el viaje.
// ═══════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bike, CheckCircle2, Map as MapIcon, Moon, Receipt, Settings, Sun } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { ConfigDT, Viaje } from './types';
import {
  cargarConfig,
  cargarViajes,
  fechaBonita,
  fechaHoy,
  guardarConfig,
  guardarViajes,
  marcarMetaCelebrada,
  metaYaCelebrada,
  resumenDia,
} from './storage';
import { descargarArchivo, vibrar } from './utils';
import { aplicarTema, cargarTema, guardarTema, Tema } from './theme';
import {
  borrarEstadoGPS,
  duracionMovimientoSeg,
  EstadoGPS,
  guardarEstadoGPS,
  leerEstadoGPS,
  registrarPunto,
} from './services/gps';
import ViajeForm from './components/ViajeForm';
import ViajeList from './components/ViajeList';
import MetaBar from './components/MetaBar';
import CajaView from './components/CajaView';
import MapView from './components/MapView';
import GpsBar from './components/GpsBar';
import AjustesView from './components/AjustesView';
import YapePanel from './components/YapePanel';
import Confeti from './components/Confeti';

type Tab = 'viajes' | 'caja' | 'mapa' | 'ajustes';

export default function App() {
  const [tab, setTab] = useState<Tab>('viajes');
  const [viajes, setViajes] = useState<Viaje[]>(() => cargarViajes());
  const [config, setConfig] = useState<ConfigDT>(() => cargarConfig());
  const [confeti, setConfeti] = useState(false);
  const [toast, setToast] = useState('');
  const [cobrarAbierto, setCobrarAbierto] = useState(false);
  // F-ID3: seguimiento GPS en curso (sobrevive recargas: se lee de localStorage)
  const [estadoGPS, setEstadoGPS] = useState<EstadoGPS | null>(() => leerEstadoGPS());
  const [tema, setTema] = useState<Tema>(() => {
    const t = cargarTema();
    aplicarTema(t);
    return t;
  });
  const toastTimer = useRef<number | null>(null);
  // El watchPosition crea su callback UNA vez → necesita la última
  // versión del estado sin cerrar sobre una vieja: espejo en ref.
  // ⚠️ El ref es la FUENTE DE VERDAD: cada setEstadoGPS escribe el
  // ref PRIMERO y el estado después → NO hace falta (ni se puede)
  // sincronizar al revés. Un useEffect que copiara el estado al ref
  // puede dispararse TARDE con un valor viejo de render y pisar el
  // ref hacia ATRÁS → el GPS pierde puntos (bug de la ruta corta).
  const estadoRef = useRef<EstadoGPS | null>(estadoGPS);
  const watchRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const hoy = fechaHoy();
  const resumenHoy = useMemo(() => resumenDia(viajes, hoy), [viajes, hoy]);
  const delDia = useMemo(() => viajes.filter(v => v.fecha === hoy), [viajes, hoy]);

  // Persistencia automática
  useEffect(() => {
    guardarViajes(viajes);
  }, [viajes]);

  // 🎯 Detección de meta cumplida (1 celebración por día)
  useEffect(() => {
    if (config.metaDiaria > 0 && resumenHoy.neto >= config.metaDiaria && !metaYaCelebrada()) {
      marcarMetaCelebrada();
      setConfeti(true);
      vibrar(600);
      const t = window.setTimeout(() => setConfeti(false), 4500);
      return () => window.clearTimeout(t);
    }
  }, [resumenHoy.neto, config.metaDiaria]);

  function mostrarToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }

  function alternarTema() {
    const t: Tema = tema === 'claro' ? 'oscuro' : 'claro';
    setTema(t);
    guardarTema(t);
    aplicarTema(t);
    vibrar(40);
  }

  function agregarViaje(v: Viaje) {
    setViajes(prev => [...prev, v]);
    vibrar(120);
  }

  // F-ID2.7: el Yape PROPIO del driver se guarda UNA vez (desde la
  // pestaña Viajes, sin ir a Ajustes) y sale en TODOS los mensajes de
  // cobro — antes lo terminaba escribiendo a mano por cada cliente
  function guardarMiYape(numero: string, titular: string) {
    const c: ConfigDT = {
      ...config,
      yape: { ...config.yape, numero: numero.trim(), titular: titular.trim() },
    };
    guardarConfig(c);
    setConfig(c);
    mostrarToast('💜 Tu Yape quedó guardado — ya sale en todos los cobros');
  }

  function eliminarViaje(id: string) {
    // F-ID3: si se borra el viaje que se estaba grabando, la
    // grabación se descarta (no hay dónde guardarla)
    if (estadoRef.current?.viajeId === id) {
      pararWatch();
      soltarWakeLock();
      borrarEstadoGPS();
      estadoRef.current = null;
      setEstadoGPS(null);
    }
    setViajes(prev => prev.filter(v => v.id !== id));
    mostrarToast('Viaje eliminado 🗑️');
  }

  // ═══ F-ID3: grabación de km GPS por viaje ═══

  /** F-ID3.2: en el APK, pide el permiso de UBICACIÓN nativo de
   * Android (diálogo del sistema, el mismo que cámara/micro).
   * Sin él, el GPS del WebView nunca entrega puntos — por eso en
   * Ajustes de la app solo aparecía el permiso de cámara. En la
   * web no hace falta (lo maneja el navegador). */
  async function pedirPermisoUbicacion(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true; // web/PWA: nada que pedir
    try {
      const res = await Geolocation.requestPermissions();
      return res.location === 'granted' || res.coarseLocation === 'granted';
    } catch {
      return false; // diálogo bloqueado o error — se informa al usuario
    }
  }

  /** Pide que la pantalla no se apague mientras graba (best effort) */
  async function pedirWakeLock() {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch {
      /* el navegador lo negó o no lo soporta: la grabación sigue igual */
    }
  }

  function soltarWakeLock() {
    try {
      wakeLockRef.current?.release();
    } catch {
      /* nada */
    }
    wakeLockRef.current = null;
  }

  function pararWatch() {
    if (watchRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    watchRef.current = null;
  }

  /** Arranca el watchPosition — el callback vive UNA vez y lee el ref */
  function iniciarWatchGPS() {
    if (watchRef.current !== null) return;
    if (!('geolocation' in navigator)) {
      mostrarToast('Tu navegador no soporta GPS 📍');
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const est = estadoRef.current;
        if (!est) return; // ya se detuvo
        const { coords } = pos;
        const { estado: nuevo, aceptado } = registrarPunto(
          est,
          coords.latitude,
          coords.longitude,
          coords.accuracy ?? 999,
        );
        if (!aceptado) return;
        guardarEstadoGPS(nuevo);
        estadoRef.current = nuevo;
        setEstadoGPS(nuevo);
      },
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          // sin permiso no hay grabación: se corta limpio sin ensuciar el viaje
          pararWatch();
          soltarWakeLock();
          borrarEstadoGPS();
          estadoRef.current = null;
          setEstadoGPS(null);
          mostrarToast(
            Capacitor.isNativePlatform()
              ? 'Activá la UBICACIÓN para grabar tus km 📍 (Ajustes del teléfono → Apps → DriverTrack → Permisos)'
              : 'Activá la UBICACIÓN para grabar tus km 📍 (permiso del navegador)',
          );
        }
        // timeouts / posición no disponible: el watch sigue vivo, no pasa nada
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
    );
  }

  /** ▶ Empieza a grabar los km de un viaje (si había otro, se cierra y guarda solo) */
  async function iniciarGPSViaje(viajeId: string) {
    if (estadoRef.current?.viajeId === viajeId) return;

    // F-ID3.2: en el APK, PRIMERO el permiso nativo de Android —
    // sin él el GPS nunca arranca (antes: solo salía el de cámara)
    const permisoOk = await pedirPermisoUbicacion();
    if (!permisoOk) {
      mostrarToast('Activá el permiso de UBICACIÓN para grabar 📍 (Ajustes → Apps → DriverTrack → Permisos)');
      return;
    }

    if (estadoRef.current) detenerGPS(true); // el anterior queda guardado

    const nuevo: EstadoGPS = { viajeId, inicioTs: Date.now(), km: 0, puntos: [] };
    guardarEstadoGPS(nuevo);
    estadoRef.current = nuevo;
    setEstadoGPS(nuevo);
    pedirWakeLock();
    iniciarWatchGPS();
    vibrar(60);
    mostrarToast('📍 Grabando los km de este viaje — manejá tranquilo');
  }

  /** ■ Termina la grabación: km + tiempo + trazado quedan EN el viaje */
  function detenerGPS(silencioso = false) {
    const est = estadoRef.current;
    if (!est) return;
    pararWatch();
    soltarWakeLock();
    borrarEstadoGPS();
    estadoRef.current = null;
    setEstadoGPS(null);

    if (est.puntos.length < 2) {
      // no se grabó nada útil (permiso recién dado, viaje cortado al toque)
      if (!silencioso) mostrarToast('No se grabó nada — probá de nuevo 📍');
      return;
    }

    const duracion = duracionMovimientoSeg(est);
    const km = +est.km.toFixed(2);
    setViajes(prev =>
      prev.map(v =>
        v.id === est.viajeId
          ? {
              ...v,
              kmGPS: +((v.kmGPS ?? 0) + km).toFixed(2), // si re-grabó el mismo viaje, se suma
              duracionSeg: (v.duracionSeg ?? 0) + duracion,
              ruta: v.ruta && v.ruta.length >= 2 ? [...v.ruta, ...est.puntos] : est.puntos,
            }
          : v,
      ),
    );
    if (!silencioso) {
      mostrarToast(`📍 Listo: ${km.toFixed(1)} km · ${Math.max(1, Math.round(duracion / 60))} min guardados`);
      vibrar(120);
    }
  }

  // ▶ RESUME: si la app se recargó (o Android la mató por memoria)
  // con una grabación en curso, al arrancar se retoma sola.
  useEffect(() => {
    const est = estadoRef.current;
    if (est?.viajeId) {
      pedirWakeLock();
      iniciarWatchGPS();
    }
    // El wake lock se suelta solo cuando la pestaña queda oculta; al
    // volver a verse se vuelve a pedir si la grabación sigue
    const alVolverVisible = () => {
      if (document.visibilityState === 'visible' && estadoRef.current) pedirWakeLock();
    };
    document.addEventListener('visibilitychange', alVolverVisible);
    return () => {
      document.removeEventListener('visibilitychange', alVolverVisible);
      pararWatch();
      soltarWakeLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportarBackup() {
    descargarArchivo(
      `drivertrack-backup-${hoy}.json`,
      JSON.stringify({ version: 1, fechaExport: new Date().toISOString(), viajes, config }, null, 2),
    );
    mostrarToast('Backup exportado 💾');
  }

  function importarBackup(texto: string) {
    try {
      const data = JSON.parse(texto);
      if (Array.isArray(data.viajes)) setViajes(data.viajes);
      if (data.config) {
        guardarConfig(data.config);
        setConfig(data.config);
      }
      mostrarToast('Backup restaurado ✅');
    } catch {
      mostrarToast('Archivo inválido ❌');
    }
  }

  function borrarTodo() {
    setViajes([]);
    mostrarToast('Se borraron todos los viajes');
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-950">
      <Confeti visible={confeti} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700">
              <Bike size={18} className="text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-black leading-none text-slate-50">DriverTrack</h1>
              <p className="text-[10px] capitalize text-slate-400">{fechaBonita(hoy)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 🌗 F-ID2.3: modo claro / oscuro */}
            <button
              onClick={alternarTema}
              aria-label={tema === 'claro' ? 'Activar modo oscuro' : 'Activar modo claro'}
              data-testid="boton-tema"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition-transform active:scale-90"
            >
              {tema === 'claro' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-right">
              <p className="text-[9px] font-medium uppercase tracking-wide text-emerald-500/80">Neto hoy</p>
              <p className="text-sm font-black leading-none text-emerald-400">S/ {resumenHoy.neto.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 space-y-3 px-4 py-4 pb-24">
        {tab === 'viajes' && (
          <>
            <MetaBar neto={resumenHoy.neto} meta={config.metaDiaria} />
            <ViajeForm
              config={config}
              onAgregar={agregarViaje}
              onGuardarMiYape={guardarMiYape}
              onNecesitaKey={() => {
                setTab('ajustes');
                mostrarToast('Pegá tu key de IA en 🤖 Escáner — Gemini gratis, 1 minuto');
              }}
            />
            <ViajeList
              viajes={delDia}
              onEliminar={eliminarViaje}
              titulo="de hoy"
              config={config}
              viajeGPSActivo={estadoGPS?.viajeId ?? null}
              onIniciarGPS={iniciarGPSViaje}
              onDetenerGPS={() => detenerGPS()}
            />
          </>
        )}

        {tab === 'caja' && (
          <CajaView
            viajes={viajes}
            config={config}
            onEliminar={eliminarViaje}
            onCobrar={monto => {
              if (monto <= 0) return mostrarToast('Hoy no hay neto que cobrar todavía');
              setCobrarAbierto(true);
            }}
            onToast={mostrarToast}
            viajeGPSActivo={estadoGPS?.viajeId ?? null}
            onIniciarGPS={iniciarGPSViaje}
            onDetenerGPS={() => detenerGPS()}
          />
        )}

        {tab === 'mapa' && <MapView viajes={viajes} estadoGPS={estadoGPS} />}

        {tab === 'ajustes' && (
          <AjustesView
            config={config}
            onGuardar={setConfig}
            onExportarBackup={exportarBackup}
            onImportarBackup={importarBackup}
            onBorrarTodo={borrarTodo}
            onToast={mostrarToast}
          />
        )}
      </main>

      {/* F-ID3: barra de grabación GPS en vivo (encima de la nav, en cualquier pestaña) */}
      {estadoGPS && (
        <GpsBar
          estado={estadoGPS}
          cliente={viajes.find(v => v.id === estadoGPS.viajeId)?.cliente ?? ''}
          onDetener={() => detenerGPS()}
        />
      )}

      {/* Panel de cobro Yape */}
      {cobrarAbierto && (
        <YapePanel
          billetera={config.yape}
          tipo="yape"
          montoInicial={resumenHoy.neto}
          onCerrar={() => setCobrarAbierto(false)}
          onToast={mostrarToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="anim-pop fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 shadow-xl">
          {toast}
        </div>
      )}

      {/* Nav inferior */}
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="grid grid-cols-4">
          {(
            [
              { id: 'viajes' as Tab, nombre: 'Viajes', icon: Bike },
              { id: 'caja' as Tab, nombre: 'Caja', icon: Receipt },
              { id: 'mapa' as Tab, nombre: 'Mapa', icon: MapIcon },
              { id: 'ajustes' as Tab, nombre: 'Ajustes', icon: Settings },
            ]
          ).map(t => {
            const Icon = t.icon;
            const activo = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-0.5 py-3 transition-colors ${
                  activo ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <Icon size={20} strokeWidth={activo ? 2.4 : 2} />
                <span className="text-[10px] font-bold">{t.nombre}</span>
                {activo && <CheckCircle2 size={0} />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
