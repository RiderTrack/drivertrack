// ═══════════════════════════════════════════════════════════
// 💰 DriverTrack — Caja: resumen por día, exportar, cobrar
// ═══════════════════════════════════════════════════════════
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, MessageCircle, QrCode } from 'lucide-react';
import { ConfigDT, nombreOrigen, Viaje } from '../types';
import { fechaBonita, fechaHoy, resumenDia } from '../storage';
import { descargarArchivo, fmtSoles } from '../utils';
import ViajeList from './ViajeList';

interface Props {
  viajes: Viaje[];
  config: ConfigDT;
  onEliminar: (id: string) => void;
  onCobrar: (monto: number) => void;
  onToast: (msg: string) => void;
}

function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(y, m - 1, d + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function CajaView({ viajes, config, onEliminar, onCobrar, onToast }: Props) {
  const [fecha, setFecha] = useState(fechaHoy());
  const resumen = useMemo(() => resumenDia(viajes, fecha), [viajes, fecha]);
  const delDia = useMemo(() => viajes.filter(v => v.fecha === fecha), [viajes, fecha]);
  const esHoy = fecha === fechaHoy();

  function exportarCSV() {
    if (delDia.length === 0) return onToast('No hay viajes que exportar');
    const filas = [
      'hora,origen,cliente,zona,tarifa,comision %,comision,neto',
      ...delDia.map(v =>
        [v.hora, nombreOrigen(v.origen), `"${v.cliente}"`, `"${v.zona}"`, v.tarifa, v.comisionPct, v.comision, v.neto].join(','),
      ),
      `,,,"TOTAL",${resumen.bruto.toFixed(2)},,${resumen.comision.toFixed(2)},${resumen.neto.toFixed(2)}`,
    ].join('\n');
    descargarArchivo(`drivertrack-caja-${fecha}.csv`, filas, 'text/csv');
    onToast('CSV descargado 📄');
  }

  function compartirResumen() {
    if (delDia.length === 0) return onToast('No hay viajes para compartir');
    const porOrigen = Object.entries(resumen.porOrigen)
      .map(([o, d]) => `• ${nombreOrigen(o as never)}: ${d.n} viajes — ${fmtSoles(d.neto)} netos`)
      .join('\n');
    const texto = [
      `🏍️ *DriverTrack — ${fechaBonita(fecha)}*`,
      ``,
      `🧾 Viajes: ${resumen.n}`,
      `💵 Bruto: ${fmtSoles(resumen.bruto)}`,
      `✂️ Comisiones: −${fmtSoles(resumen.comision)}`,
      `✅ *NETO DEL DÍA: ${fmtSoles(resumen.neto)}*`,
      ``,
      porOrigen,
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  }

  return (
    <div className="space-y-3">
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

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-2.5 text-center">
          <p className="text-lg font-black text-slate-100">{resumen.n}</p>
          <p className="text-[10px] text-slate-400">viajes</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-2.5 text-center">
          <p className="text-sm font-black text-slate-200">{fmtSoles(resumen.bruto)}</p>
          <p className="text-[10px] text-slate-400">bruto</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-2.5 text-center">
          <p className="text-sm font-black text-red-400">−{fmtSoles(resumen.comision)}</p>
          <p className="text-[10px] text-slate-400">comisión</p>
        </div>
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-center">
          <p className="text-sm font-black text-emerald-400">{fmtSoles(resumen.neto)}</p>
          <p className="text-[10px] text-emerald-500/80">neto</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onCobrar(resumen.neto)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-500/15 py-2.5 text-xs font-bold text-violet-300"
        >
          <QrCode size={14} /> Cobrar Yape
        </button>
        <button
          onClick={compartirResumen}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-300"
        >
          <MessageCircle size={14} /> Resumen
        </button>
        <button
          onClick={exportarCSV}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-500/15 py-2.5 text-xs font-bold text-sky-300"
        >
          <Download size={14} /> CSV
        </button>
      </div>

      {/* Lista del día */}
      <ViajeList
        viajes={delDia}
        onEliminar={onEliminar}
        titulo={`del ${fechaBonita(fecha)}`}
        config={config}
      />
    </div>
  );
}
