// ═══════════════════════════════════════════════════════════
// ⚙️ DriverTrack — Ajustes: meta, comisiones, Yape/Plin, backup
// ═══════════════════════════════════════════════════════════
import { useRef, useState } from 'react';
import { Database, Save, Trash2, Upload, X } from 'lucide-react';
import { Billetera, ConfigDT, ORIGENES } from '../types';
import { guardarConfig } from '../storage';
import { comprimirImagen, descargarArchivo } from '../utils';

interface Props {
  config: ConfigDT;
  onGuardar: (c: ConfigDT) => void;
  onExportarBackup: () => void;
  onImportarBackup: (json: string) => void;
  onBorrarTodo: () => void;
  onToast: (msg: string) => void;
}

function PanelBilletera({
  titulo,
  emoji,
  billetera,
  onChange,
}: {
  titulo: string;
  emoji: string;
  billetera: Billetera;
  onChange: (b: Billetera) => void;
}) {
  const inputQR = useRef<HTMLInputElement>(null);

  async function subirQR(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await comprimirImagen(file);
      onChange({ ...billetera, qrBase64: b64 });
    } catch {
      /* imagen inválida: se ignora */
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-3">
      <p className="text-xs font-bold text-slate-300">
        {emoji} {titulo}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          value={billetera.numero}
          onChange={e => onChange({ ...billetera, numero: e.target.value })}
          placeholder="Número (ej. 987 654 321)"
          className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-400"
        />
        <input
          value={billetera.titular}
          onChange={e => onChange({ ...billetera, titular: e.target.value })}
          placeholder="Titular (tu nombre)"
          className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-400"
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input ref={inputQR} type="file" accept="image/*" onChange={subirQR} className="hidden" />
        <button
          onClick={() => inputQR.current?.click()}
          className="flex-1 rounded-xl bg-slate-700 py-2 text-xs font-bold text-slate-200"
        >
          📸 {billetera.qrBase64 ? 'Cambiar QR' : 'Subir QR (foto de tu app)'}
        </button>
        {billetera.qrBase64 && (
          <>
            <img
              src={billetera.qrBase64}
              alt={`QR ${titulo}`}
              className="h-10 w-10 rounded-lg border border-slate-600 object-cover"
            />
            <button
              onClick={() => onChange({ ...billetera, qrBase64: '' })}
              className="rounded-lg p-2 text-slate-500 hover:text-red-400"
              aria-label="Quitar QR"
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AjustesView({ config, onGuardar, onExportarBackup, onImportarBackup, onBorrarTodo, onToast }: Props) {
  const [borrarConfirm, setBorrarConfirm] = useState(false);
  const [meta, setMeta] = useState(String(config.metaDiaria));
  const [comisiones, setComisiones] = useState({ ...config.comisiones });
  const [yape, setYape] = useState({ ...config.yape });
  const [plin, setPlin] = useState({ ...config.plin });
  const inputBackup = useRef<HTMLInputElement>(null);

  function guardar() {
    const c: ConfigDT = {
      metaDiaria: parseFloat(meta) || 0,
      comisiones: {
        indrive: parseFloat(String(comisiones.indrive)) || 0,
        rappi: parseFloat(String(comisiones.rappi)) || 0,
        pedidosya: parseFloat(String(comisiones.pedidosya)) || 0,
        directo: parseFloat(String(comisiones.directo)) || 0,
      },
      yape,
      plin,
    };
    guardarConfig(c);
    onGuardar(c);
    onToast('Ajustes guardados ✅');
  }

  async function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const texto = await file.text();
    onImportarBackup(texto);
  }

  return (
    <div className="space-y-4">
      {/* Meta diaria */}
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
        <p className="text-xs font-bold text-amber-300">🎯 Meta del día (S/ netos)</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Cuando el neto del día llegue a este monto, la app celebra y te manda a casa 🏍️🏠
        </p>
        <input
          type="number"
          inputMode="decimal"
          value={meta}
          onChange={e => setMeta(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-lg font-black text-amber-300 outline-none focus:border-amber-400"
        />
      </section>

      {/* Comisiones por plataforma */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
        <p className="text-xs font-bold text-slate-300">✂️ Comisión default por plataforma (%)</p>
        <p className="mt-1 text-[11px] text-slate-400">Se precarga al elegir el origen — podés cambiarla en cada viaje.</p>
        <div className="mt-2 space-y-2">
          {ORIGENES.map(o => (
            <div key={o.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-300">
                {o.emoji} {o.nombre}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={comisiones[o.id]}
                onChange={e => setComisiones({ ...comisiones, [o.id]: e.target.value })}
                className="w-20 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-right text-sm font-bold text-amber-300 outline-none focus:border-amber-400"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Billeteras */}
      <PanelBilletera titulo="Yape" emoji="💜" billetera={yape} onChange={setYape} />
      <PanelBilletera titulo="Plin" emoji="🔷" billetera={plin} onChange={setPlin} />

      {/* Backup */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
        <p className="text-xs font-bold text-slate-300">🗄️ Respaldo de datos</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Tus viajes viven en este teléfono. Exportá un backup cada tanto y guardalo en Drive.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={onExportarBackup}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-500/15 py-2.5 text-xs font-bold text-sky-300"
          >
            <Database size={14} /> Exportar
          </button>
          <input ref={inputBackup} type="file" accept=".json,application/json" onChange={importar} className="hidden" />
          <button
            onClick={() => inputBackup.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 py-2.5 text-xs font-bold text-slate-200"
          >
            <Upload size={14} /> Importar
          </button>
        </div>
      </section>

      {/* Zona peligrosa */}
      <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
        <p className="text-xs font-bold text-red-400">⚠️ Zona peligrosa</p>
        {borrarConfirm ? (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                onBorrarTodo();
                setBorrarConfirm(false);
              }}
              className="flex-1 rounded-xl bg-red-500/20 py-2.5 text-xs font-bold text-red-400"
            >
              SÍ, BORRAR TODO
            </button>
            <button
              onClick={() => setBorrarConfirm(false)}
              className="flex-1 rounded-xl bg-slate-700 py-2.5 text-xs font-bold text-slate-300"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setBorrarConfirm(true)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 py-2.5 text-xs font-bold text-red-400"
          >
            <Trash2 size={14} /> Borrar todos los viajes
          </button>
        )}
      </section>

      {/* Guardar */}
      <button
        onClick={guardar}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-black text-slate-950 active:scale-[0.98]"
      >
        <Save size={16} /> Guardar ajustes
      </button>

      <p className="pb-2 text-center text-[10px] text-slate-500">
        DriverTrack v0.1.0 (F-ID1) — Trackverse · Lima, PE
      </p>
    </div>
  );
}
