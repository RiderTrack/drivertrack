// ═══════════════════════════════════════════════════════════
// ➕ DriverTrack — Formulario de viaje rápido (el corazón de F-ID1)
// Tarifa + % comisión → cálculo EN VIVO de lo que te queda.
// ═══════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { ConfigDT, OrigenViaje, ORIGENES, Viaje } from '../types';
import { fechaHoy, horaAhora } from '../storage';
import { fmtSoles } from '../utils';

interface Props {
  config: ConfigDT;
  onAgregar: (v: Viaje) => void;
}

export default function ViajeForm({ config, onAgregar }: Props) {
  const [origen, setOrigen] = useState<OrigenViaje>('indrive');
  const [tarifa, setTarifa] = useState('');
  const [comisionPct, setComisionPct] = useState<string>(String(config.comisiones.indrive));
  const [cliente, setCliente] = useState('');
  const [zona, setZona] = useState('');
  const [error, setError] = useState('');

  // Al cambiar de origen, precarga el % default de esa plataforma
  useEffect(() => {
    setComisionPct(String(config.comisiones[origen] ?? 0));
  }, [origen, config.comisiones]);

  const { comision, neto } = useMemo(() => {
    const t = parseFloat(tarifa) || 0;
    const p = parseFloat(comisionPct) || 0;
    const c = +(t * (p / 100)).toFixed(2);
    return { comision: c, neto: +(t - c).toFixed(2) };
  }, [tarifa, comisionPct]);

  const puedeEnviar = parseFloat(tarifa) > 0;

  function enviar() {
    if (!puedeEnviar) {
      setError('Poné la tarifa del viaje');
      return;
    }
    setError('');
    const t = parseFloat(tarifa);
    const p = parseFloat(comisionPct) || 0;
    const c = +(t * (p / 100)).toFixed(2);
    onAgregar({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fecha: fechaHoy(),
      hora: horaAhora(),
      origen,
      cliente: cliente.trim(),
      zona: zona.trim(),
      tarifa: t,
      comisionPct: p,
      comision: c,
      neto: +(t - c).toFixed(2),
      notas: '',
    });
    setTarifa('');
    setCliente('');
    setZona('');
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap size={16} className="text-amber-400" />
        <h2 className="text-sm font-bold text-slate-100">Viaje rápido</h2>
      </div>

      {/* Origen: chips de plataforma */}
      <div className="grid grid-cols-4 gap-2">
        {ORIGENES.map(o => (
          <button
            key={o.id}
            onClick={() => setOrigen(o.id)}
            className={`rounded-xl border px-1 py-2 text-xs font-semibold transition-all ${
              origen === o.id
                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                : 'border-slate-600 bg-slate-900/50 text-slate-400 hover:border-slate-500'
            }`}
          >
            <span className="mr-1">{o.emoji}</span>
            {o.nombre}
          </button>
        ))}
      </div>

      {/* Tarifa + comisión */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="mb-1 block text-[11px] font-medium text-slate-400">Tarifa del viaje (S/)</label>
          <input
            type="number"
            inputMode="decimal"
            value={tarifa}
            onChange={e => setTarifa(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 text-xl font-bold text-emerald-300 placeholder-slate-600 outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-400">% comisión</label>
          <input
            type="number"
            inputMode="decimal"
            value={comisionPct}
            onChange={e => setComisionPct(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 text-xl font-bold text-amber-300 outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Cliente + zona */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          value={cliente}
          onChange={e => setCliente(e.target.value)}
          placeholder="Cliente (opcional)"
          className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-400"
        />
        <input
          value={zona}
          onChange={e => setZona(e.target.value)}
          placeholder="Zona (opcional)"
          className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-400"
        />
      </div>

      {/* Cálculo en vivo */}
      {puedeEnviar && (
        <div className="anim-pop mt-3 rounded-xl bg-slate-900/80 p-3 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>La plataforma se queda ({comisionPct || 0}%)</span>
            <span className="text-red-400">−{fmtSoles(comision)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-700/60 pt-1.5 text-base font-bold">
            <span className="text-slate-200">TE QUEDA NETO</span>
            <span className="text-emerald-400">{fmtSoles(neto)}</span>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <button
        onClick={enviar}
        disabled={!puedeEnviar}
        className={`mt-3 w-full rounded-xl py-3 text-sm font-bold transition-all ${
          puedeEnviar
            ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-[0.98]'
            : 'bg-slate-700 text-slate-500'
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <Plus size={16} /> Agregar viaje
        </span>
      </button>
    </div>
  );
}
