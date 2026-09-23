// ═══════════════════════════════════════════════════════════
// 🏍️ DriverTrack — Shell principal (F-ID1)
// Pestañas: Viajes (form + meta + lista) · Caja · Ajustes
// Local-first: todo en localStorage, backup JSON.
// ═══════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bike, CheckCircle2, Receipt, Settings } from 'lucide-react';
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
import ViajeForm from './components/ViajeForm';
import ViajeList from './components/ViajeList';
import MetaBar from './components/MetaBar';
import CajaView from './components/CajaView';
import AjustesView from './components/AjustesView';
import YapePanel from './components/YapePanel';
import Confeti from './components/Confeti';

type Tab = 'viajes' | 'caja' | 'ajustes';

export default function App() {
  const [tab, setTab] = useState<Tab>('viajes');
  const [viajes, setViajes] = useState<Viaje[]>(() => cargarViajes());
  const [config, setConfig] = useState<ConfigDT>(() => cargarConfig());
  const [confeti, setConfeti] = useState(false);
  const [toast, setToast] = useState('');
  const [cobrarAbierto, setCobrarAbierto] = useState(false);
  const toastTimer = useRef<number | null>(null);

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

  function agregarViaje(v: Viaje) {
    setViajes(prev => [...prev, v]);
    vibrar(120);
  }

  function eliminarViaje(id: string) {
    setViajes(prev => prev.filter(v => v.id !== id));
    mostrarToast('Viaje eliminado 🗑️');
  }

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700">
              <Bike size={18} className="text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-black leading-none text-slate-50">DriverTrack</h1>
              <p className="text-[10px] capitalize text-slate-400">{fechaBonita(hoy)}</p>
            </div>
          </div>
          <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-right">
            <p className="text-[9px] font-medium uppercase tracking-wide text-emerald-500/80">Neto hoy</p>
            <p className="text-sm font-black leading-none text-emerald-400">S/ {resumenHoy.neto.toFixed(2)}</p>
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
              onNecesitaKey={() => {
                setTab('ajustes');
                mostrarToast('Pegá tu key de Gemini en 🤖 Escáner — gratis, 1 minuto');
              }}
            />
            <ViajeList viajes={delDia} onEliminar={eliminarViaje} titulo="de hoy" />
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
          />
        )}

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
        <div className="grid grid-cols-3">
          {(
            [
              { id: 'viajes' as Tab, nombre: 'Viajes', icon: Bike },
              { id: 'caja' as Tab, nombre: 'Caja', icon: Receipt },
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
