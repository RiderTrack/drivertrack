// ═══════════════════════════════════════════════════════════
// ➕ DriverTrack — Formulario de viaje rápido (F-ID1 + F-ID2)
// F-ID1: tarifa + % comisión → cálculo EN VIVO del neto.
// F-ID2: 📷 escanear la dirección con una foto → Gemini llena
//        el formulario solo (cliente, zona, tarifa, dirección).
// ═══════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, Loader2, Plus, X, Zap } from 'lucide-react';
import { ConfigDT, OrigenViaje, ORIGENES, Viaje } from '../types';
import { fechaHoy, horaAhora } from '../storage';
import { fmtSoles, vibrar } from '../utils';
import { escanearDireccion } from '../services/geminiOcr';

interface Props {
  config: ConfigDT;
  onAgregar: (v: Viaje) => void;
  onNecesitaKey: () => void; // F-ID2: te manda a Ajustes si no hay key Gemini
}

export default function ViajeForm({ config, onAgregar, onNecesitaKey }: Props) {
  const [origen, setOrigen] = useState<OrigenViaje>('indrive');
  const [tarifa, setTarifa] = useState('');
  const [comisionPct, setComisionPct] = useState<string>(String(config.comisiones.indrive));
  const [cliente, setCliente] = useState('');
  const [zona, setZona] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');

  // ── F-ID2: estado del escáner ──
  const [escaneando, setEscaneando] = useState(false);
  const [fotoB64, setFotoB64] = useState('');       // preview (NO se guarda en el viaje)
  const [fotoGrande, setFotoGrande] = useState(false);
  const [scanOk, setScanOk] = useState(false);
  const [scanError, setScanError] = useState('');
  const inputFoto = useRef<HTMLInputElement>(null);

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

  function limpiarEscaneo() {
    setFotoB64('');
    setFotoGrande(false);
    setScanOk(false);
    setScanError('');
    if (inputFoto.current) inputFoto.current.value = '';
  }

  function abrirEscanner() {
    if (escaneando) return;
    if (!config.geminiKey.trim()) {
      onNecesitaKey();
      return;
    }
    setScanError('');
    setScanOk(false);
    inputFoto.current?.click();
  }

  async function alElegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-elegir la misma foto
    if (!file) return;

    setEscaneando(true);
    setScanError('');
    setScanOk(false);
    try {
      const { comprimirImagenParaOCR } = await import('../utils');
      const b64 = await comprimirImagenParaOCR(file);
      setFotoB64(b64);
      const datos = await escanearDireccion(b64, config.geminiKey);

      // Auto-llenado: solo sobreescribe lo que la foto realmente trajo
      if (datos.cliente) setCliente(datos.cliente);
      if (datos.zona) setZona(datos.zona);
      if (datos.tarifa !== null) setTarifa(String(datos.tarifa));

      const trozos: string[] = [];
      if (datos.direccion) trozos.push(datos.direccion);
      if (datos.referencia) trozos.push(`Ref: ${datos.referencia}`);
      if (datos.telefono) trozos.push(`📞 ${datos.telefono}`);
      if (trozos.length > 0) setNotas(trozos.join('\n'));

      setScanOk(true);
      vibrar(80);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Algo falló escaneando — probá de nuevo');
      // La foto queda de guía para escribir a mano
    } finally {
      setEscaneando(false);
    }
  }

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
      notas: notas.trim(),
    });
    setTarifa('');
    setCliente('');
    setZona('');
    setNotas('');
    limpiarEscaneo();
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap size={16} className="text-amber-400" />
        <h2 className="text-sm font-bold text-slate-100">Viaje rápido</h2>
      </div>

      {/* ── F-ID2: escáner de dirección (estilo Circuit) ── */}
      <div className="mb-3 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-3">
        <input
          ref={inputFoto}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={alElegirFoto}
          className="hidden"
          data-testid="input-escanear"
        />
        <button
          onClick={abrirEscanner}
          disabled={escaneando}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all active:scale-[0.98] ${
            escaneando
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
          }`}
          data-testid="boton-escanear"
        >
          {escaneando ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Leyendo la dirección…
            </>
          ) : (
            <>
              <Camera size={18} /> Escanear dirección
            </>
          )}
        </button>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">
          Foto de la dirección (captura, chat o nota) → la IA llena el viaje
        </p>

        {/* Foto de guía + resultado */}
        {fotoB64 && (
          <div className="mt-2 flex items-start gap-2">
            <button
              onClick={() => setFotoGrande(g => !g)}
              className={`relative shrink-0 overflow-hidden rounded-lg border border-slate-600 ${fotoGrande ? 'w-full' : 'w-16'}`}
              aria-label="Ver foto"
            >
              <img
                src={fotoB64}
                alt="Foto del pedido"
                className={fotoGrande ? 'w-full object-contain' : 'h-16 w-16 object-cover'}
              />
            </button>
            {!fotoGrande && (
              <button
                onClick={limpiarEscaneo}
                className="rounded-lg p-1.5 text-slate-500 hover:text-red-400"
                aria-label="Quitar foto"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
        {scanOk && (
          <div
            className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300"
            data-testid="scan-ok"
          >
            <Check size={14} /> ¡Listo! Revisá los datos antes de guardar
          </div>
        )}
        {scanError && (
          <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400" data-testid="scan-error">
            {scanError}
          </p>
        )}
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

      {/* Notas / dirección (se llena solo con el escaneo) */}
      <textarea
        value={notas}
        onChange={e => setNotas(e.target.value)}
        rows={2}
        placeholder="Dirección / referencia (se llena con el escaneo)"
        className="mt-2 w-full resize-none rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-400"
      />

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
