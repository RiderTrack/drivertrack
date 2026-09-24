// ═══════════════════════════════════════════════════════════
// ⚙️ DriverTrack — Ajustes: meta, comisiones, Yape/Plin,
// key del escáner Gemini (F-ID2) y backup
// ═══════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import { Bot, Check, Database, ExternalLink, Loader2, Trash2, Upload, X } from 'lucide-react';
import { Billetera, ConfigDT, ORIGENES } from '../types';
import { CONFIG_DEFECTO, guardarConfig } from '../storage';
import { comprimirImagen, descargarArchivo } from '../utils';
import { probarKeyIA } from '../services/escanerIA';

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
  const [geminiKey, setGeminiKey] = useState(config.geminiKey);
  const [claudeKey, setClaudeKey] = useState(config.claudeKey); // F-ID2.5: token de respaldo
  const [probando, setProbando] = useState(false);
  const [prueba, setPrueba] = useState<{ ok: boolean; mensaje: string } | null>(null);
  const inputBackup = useRef<HTMLInputElement>(null);

  // Arma el ConfigDT completo a partir de los estados locales
  function armarConfig(): ConfigDT {
    return {
      metaDiaria: parseFloat(meta) || 0,
      comisiones: {
        indrive: parseFloat(String(comisiones.indrive)) || 0,
        rappi: parseFloat(String(comisiones.rappi)) || 0,
        pedidosya: parseFloat(String(comisiones.pedidosya)) || 0,
        directo: parseFloat(String(comisiones.directo)) || 0,
      },
      yape,
      plin,
      geminiKey: geminiKey.trim(),
      claudeKey: claudeKey.trim(),
    };
  }

  // F-ID2.3: TODO se autoguarda al tocarlo (meta, % con decimales,
  // Yape/Plin, key). Antes los ajustes vivían en memoria hasta apretar
  // "Guardar ajustes" (al fondo de todo) → al cambiar de pestaña se
  // perdían (el bug del 10.89 → volvía a 10). Mismo fix que la key
  // en F-ID2.2, ahora para toda la pantalla.
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    const c = armarConfig();
    guardarConfig(c);
    onGuardar(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, comisiones, yape, plin, geminiKey, claudeKey]);

  async function probarKey() {
    setProbando(true);
    setPrueba(null);
    const r = await probarKeyIA(geminiKey, claudeKey);
    setPrueba(r.ok ? { ok: true, mensaje: `${r.mensaje} · quedó guardada ✅` } : r);
    setProbando(false);
  }

  async function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const texto = await file.text();
    onImportarBackup(texto);
    // F-ID2.3: re-sincroniza los campos con lo importado (un backup viejo
    // puede no tener algún campo → se completa con los defaults)
    try {
      const data = JSON.parse(texto) as { config?: Partial<ConfigDT> };
      if (data.config) {
        setMeta(String(data.config.metaDiaria ?? CONFIG_DEFECTO.metaDiaria));
        setComisiones({ ...CONFIG_DEFECTO.comisiones, ...data.config.comisiones });
        setYape({ ...CONFIG_DEFECTO.yape, ...data.config.yape });
        setPlin({ ...CONFIG_DEFECTO.plin, ...data.config.plin });
        setGeminiKey(data.config.geminiKey ?? '');
        setClaudeKey(data.config.claudeKey ?? '');
      }
    } catch {
      /* App ya muestra el toast de archivo inválido */
    }
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
          step="0.01"
          value={meta}
          onChange={e => setMeta(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-lg font-black text-amber-300 outline-none focus:border-amber-400"
          data-testid="input-meta"
        />
      </section>

      {/* Escáner IA (F-ID2 → F-ID2.5) */}
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
          <Bot size={14} /> Escáner de pedidos (IA)
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Tomale una foto o subí una captura del pedido y la IA llena el viaje sola: cliente, zona, tarifa, dirección y
          celular. Podés configurar <span className="font-bold text-emerald-400">Gemini</span> (gratis) y{' '}
          <span className="font-bold text-sky-400">Claude</span> — si Gemini falla (ej: sin créditos),{' '}
          <span className="font-bold">Claude lo rescata solo</span>.
        </p>

        <div className="mt-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400/80">🟢 Key de Gemini (gratis)</p>
          <input
            type="password"
            value={geminiKey}
            onChange={e => {
              setGeminiKey(e.target.value);
              setPrueba(null);
              // el autoguardado lo hace el useEffect de arriba
            }}
            placeholder="AIza… o AQ.…"
            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 font-mono text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-400"
            data-testid="input-gemini-key"
          />
        </div>

        <div className="mt-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-sky-400/80">
            🔵 Token de Claude (respaldo automático — opcional)
          </p>
          <input
            type="password"
            value={claudeKey}
            onChange={e => {
              setClaudeKey(e.target.value);
              setPrueba(null);
            }}
            placeholder="sk-ant-… (console.anthropic.com)"
            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 font-mono text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-400"
            data-testid="input-claude-key"
          />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={probarKey}
            disabled={probando}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-300 disabled:opacity-60"
            data-testid="boton-probar-key"
          >
            {probando ? <Loader2 size={14} className="animate-spin" /> : null}
            {probando ? 'Probando…' : 'Probar keys'}
          </button>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 py-2.5 text-xs font-bold text-slate-200"
          >
            <ExternalLink size={14} /> Crear key gratis
          </a>
        </div>

        {prueba && (
          <p
            className={`mt-2 rounded-lg px-3 py-2 text-xs font-semibold ${
              prueba.ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/10 text-red-400'
            }`}
            data-testid="resultado-probar"
          >
            {prueba.ok ? '✅ ' : '❌ '}
            {prueba.mensaje}
          </p>
        )}

        <div className="mt-2 space-y-1 rounded-lg bg-slate-900/60 p-2.5 text-[10px] leading-relaxed text-slate-500">
          <p>
            <span className="font-bold text-emerald-400">🟢 GEMINI (gratis, recomendada):</span> 1) Tocá “Crear key gratis” (
            <span className="font-mono">aistudio.google.com/apikey</span>) · 2) sesión Google → “Crear clave de API” · 3)
            copiala y pegala arriba. ¿Te dio una key que empieza con <span className="font-mono">AQ.</span>? Es el formato
            NUEVO de Google — también vale ✅
          </p>
          <p>
            <span className="font-bold text-sky-400">🔵 CLAUDE (respaldo):</span> tu token{' '}
            <span className="font-mono">sk-ant-…</span> de console.anthropic.com (el mismo de rudy-bot). Si Gemini se
            queda sin créditos, el escáner sigue andando con Claude sin que hagas nada.
          </p>
          <p>
            🔒 Las keys se guardan SOLAS al pegarlas y viven SOLO en tu teléfono. Probá con “Probar keys” y escaneá con 📷 o 🖼️ en Viajes.
          </p>
        </div>
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
                step="0.01"
                value={comisiones[o.id]}
                onChange={e => setComisiones({ ...comisiones, [o.id]: e.target.value })}
                className="w-20 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-right text-sm font-bold text-amber-300 outline-none focus:border-amber-400"
                data-testid={`input-comision-${o.id}`}
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

      {/* Todo se guarda solo (F-ID2.3) */}
      <p
        className="flex items-center justify-center gap-1.5 pb-1 text-center text-[11px] font-semibold text-emerald-400"
        data-testid="nota-autoguardado"
      >
        <Check size={12} /> Todo se guarda solo — cambiá lo que quieras y salí tranquilo
      </p>

      <p className="pb-2 text-center text-[10px] text-slate-500">
        DriverTrack v0.2.5 (F-ID2.5) — Trackverse · Lima, PE
      </p>
    </div>
  );
}
