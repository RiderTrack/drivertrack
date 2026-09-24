// ═══════════════════════════════════════════════════════════
// ➕ DriverTrack — Formulario de viaje rápido (F-ID1 → F-ID2.6)
// F-ID1: tarifa + % comisión → cálculo EN VIVO del neto.
// F-ID2: 📷 escanear la dirección con una foto → la IA llena
//        el formulario solo (cliente, zona, tarifa, dirección).
// F-ID2.4: 🖼️ botón GALERÍA — subir una captura de pantalla se
//        lee mucho mejor que fotografiar la pantalla con la cámara.
// F-ID2.5: escáner v2 — DIRECCIÓN y CELULAR con campos propios
//        (antes quedaban perdidos dentro de Notas) + botón 💬
//        WhatsApp que abre el chat del cliente con el mensaje de
//        cobro listo (estilo QR de RiderTrack v2).
// F-ID2.6: escáner v3 — el NOMBRE REAL del cliente (la IA ya no
//        confunde "C.1" — la calle — con la persona) + campos
//        💜 Yape del pedido (nombre y número: "Mk yape 980811297")
//        + si la foto no trae teléfono, el celular se llena con el
//        número del yape (en Perú el yape ES el celular del cliente).
// ═══════════════════════════════════════════════════════════
// F-ID2.7: 💜 TU Yape se guarda UNA vez (tarjeta en esta misma
//        pantalla) y sale solo en TODOS los mensajes de cobro — antes
//        el número propio se terminaba escribiendo a mano por cada
//        cliente y al apretar "Agregar viaje" desaparecía. Además:
//        📋 vista previa del mensaje SIEMPRE visible (en vivo, nunca
//        desaparece) y mensaje reorganizado en bloques.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, ImageUp, Loader2, MessageCircle, Plus, X, Zap } from 'lucide-react';
import { ConfigDT, OrigenViaje, ORIGENES, Viaje } from '../types';
import { fechaHoy, horaAhora } from '../storage';
import { fmtSoles, linkWhatsApp, normalizarCelular, vibrar } from '../utils';
import { escanearDireccion } from '../services/escanerIA';

interface Props {
  config: ConfigDT;
  onAgregar: (v: Viaje) => void;
  onGuardarMiYape: (numero: string, titular: string) => void; // F-ID2.7: tu Yape queda guardado 1 sola vez
  onNecesitaKey: () => void; // F-ID2: te manda a Ajustes si no hay key Gemini
}

export default function ViajeForm({ config, onAgregar, onGuardarMiYape, onNecesitaKey }: Props) {
  const [origen, setOrigen] = useState<OrigenViaje>('indrive');
  const [tarifa, setTarifa] = useState('');
  const [comisionPct, setComisionPct] = useState<string>(String(config.comisiones.indrive));
  const [cliente, setCliente] = useState('');
  const [zona, setZona] = useState('');
  const [direccion, setDireccion] = useState(''); // F-ID2.5: campo propio (antes vivía en notas)
  const [celular, setCelular] = useState('');   // F-ID2.5: WhatsApp del cliente
  const [yapeNombre, setYapeNombre] = useState(''); // F-ID2.6: "Mk" en "Mk yape 980811297"
  const [yapeNumero, setYapeNumero] = useState(''); // F-ID2.6: 980811297 — para saber quién pagó
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');

  // ── F-ID2.7: TU Yape para cobrar (se guarda 1 vez, vive en config) ──
  const [miYapeNum, setMiYapeNum] = useState('');
  const [miYapeTitular, setMiYapeTitular] = useState('');
  const [editarMiYape, setEditarMiYape] = useState(false);

  // ── F-ID2: estado del escáner ──
  const [escaneando, setEscaneando] = useState(false);
  const [fotoB64, setFotoB64] = useState('');       // preview (NO se guarda en el viaje)
  const [fotoGrande, setFotoGrande] = useState(false);
  const [scanOk, setScanOk] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanDetalle, setScanDetalle] = useState('');   // F-ID2.4: pista técnica del error
  const [fuenteScan, setFuenteScan] = useState<'camara' | 'galeria' | null>(null);
  const inputFoto = useRef<HTMLInputElement>(null);
  const inputGaleria = useRef<HTMLInputElement>(null);

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
    setScanDetalle('');
    if (inputFoto.current) inputFoto.current.value = '';
    if (inputGaleria.current) inputGaleria.current.value = '';
  }

  function abrirEscanner() {
    if (escaneando) return;
    if (!config.geminiKey.trim() && !config.claudeKey.trim()) {
      onNecesitaKey();
      return;
    }
    setScanError('');
    setScanDetalle('');
    setScanOk(false);
    setFuenteScan('camara');
    inputFoto.current?.click();
  }

  // F-ID2.4: subir una captura desde la galería — la IA las lee mucho
  // mejor que una foto a la pantalla (nítidas, sin reflejos ni moiré)
  function abrirGaleria() {
    if (escaneando) return;
    if (!config.geminiKey.trim() && !config.claudeKey.trim()) {
      onNecesitaKey();
      return;
    }
    setScanError('');
    setScanDetalle('');
    setScanOk(false);
    setFuenteScan('galeria');
    inputGaleria.current?.click();
  }

  async function alElegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-elegir la misma foto
    if (!file) return;

    setEscaneando(true);
    setScanError('');
    setScanDetalle('');
    setScanOk(false);
    try {
      const { comprimirImagenParaOCR } = await import('../utils');
      const b64 = await comprimirImagenParaOCR(file);
      setFotoB64(b64);
      // F-ID2.5: se pasan LAS DOS keys — si Gemini revienta con error
      // de cuenta (ej: sin créditos), Claude lo rescata solo
      const datos = await escanearDireccion(b64, config.geminiKey, config.claudeKey);

      // Auto-llenado: solo sobreescribe lo que la foto realmente trajo
      if (datos.cliente) setCliente(datos.cliente);
      if (datos.zona) setZona(datos.zona);
      if (datos.tarifa !== null) setTarifa(String(datos.tarifa));
      // F-ID2.5: dirección y celular a sus PROPIOS campos (antes
      // terminaban aplastados dentro de notas)
      if (datos.direccion) setDireccion(datos.direccion);
      // F-ID2.6: si la foto no trae teléfono pero sí yape, el celular
      // se llena con el número del yape — en Perú el yape ES el
      // celular del cliente (editable como todo el formulario)
      if (datos.telefono) setCelular(datos.telefono);
      else if (datos.yapeNumero) setCelular(datos.yapeNumero);
      // F-ID2.6: el yape del pedido con sus DOS campos
      if (datos.yapeNombre) setYapeNombre(datos.yapeNombre);
      if (datos.yapeNumero) setYapeNumero(datos.yapeNumero);

      // La referencia y lo suelto sigue en notas (más corto ahora)
      const trozos: string[] = [];
      if (datos.referencia) trozos.push(`Ref: ${datos.referencia}`);
      if (trozos.length > 0) setNotas(trozos.join('\n'));

      setScanOk(true);
      vibrar(80);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Algo falló escaneando — probá de nuevo');
      setScanDetalle((err as Error & { detalle?: string }).detalle ?? '');
      // La foto queda de guía para escribir a mano
    } finally {
      setEscaneando(false);
    }
  }

  // F-ID2.5 → F-ID2.7: 💬 mensaje de cobro por WhatsApp — el mismo
  // estilo del QR de RiderTrack v2, ahora ORDENADO en bloques:
  // saludo → pedido (monto + entrega) → cómo pagar (TU Yape) → gracias
  function armarMensajeCobro(): string {
    const nombre = cliente.trim() || 'estimado cliente';
    const monto = parseFloat(tarifa) || 0;
    const yape = config.yape.numero.trim();
    const plin = config.plin.numero.trim();
    const titularYape = config.yape.titular.trim();
    const titularPlin = config.plin.titular.trim();

    const lineas: string[] = [`Hola ${nombre}! 👋`, ''];

    // Bloque 1 — el pedido
    if (monto > 0) {
      lineas.push(`🛵 Monto a pagar por tu pedido: *S/ ${monto.toFixed(2)}*`);
    } else {
      lineas.push('🛵 Te escribo por la entrega de tu pedido');
    }
    if (direccion.trim()) lineas.push(`📍 Entrega en: ${direccion.trim()}`);
    lineas.push('');

    // Bloque 2 — cómo pagar (TU Yape guardado, no el del pedido)
    if (yape && plin) {
      lineas.push('💜 Puedes pagarme por Yape:');
      lineas.push(`📱 *${yape}*${titularYape ? ` (${titularYape})` : ''}`);
      lineas.push(`🔷 O por Plin: *${plin}*${titularPlin ? ` (${titularPlin})` : ''}`);
      lineas.push('💵 O en efectivo al recibir');
    } else if (yape) {
      lineas.push('💜 Puedes pagarme por Yape:');
      lineas.push(`📱 *${yape}*${titularYape ? ` (${titularYape})` : ''}`);
      lineas.push('💵 O en efectivo al recibir');
    } else if (plin) {
      lineas.push('🔷 Puedes pagarme por Plin:');
      lineas.push(`📱 *${plin}*${titularPlin ? ` (${titularPlin})` : ''}`);
      lineas.push('💵 O en efectivo al recibir');
    } else {
      lineas.push('💸 Pago en efectivo al recibir');
    }

    lineas.push('', '¡Gracias! 💚');
    return lineas.join('\n');
  }

  // F-ID2.7: guarda TU Yape en el config — queda para todos los
  // clientes, ya no se escribe por pedido (y no se borra al agregar viaje)
  function guardarMiYape() {
    const digitos = miYapeNum.replace(/\D/g, '');
    if (digitos.length < 6) {
      setError('Poné tu número de Yape (9 dígitos)');
      return;
    }
    setError('');
    onGuardarMiYape(miYapeNum, miYapeTitular);
    setEditarMiYape(false);
    vibrar(60);
  }

  function abrirEditorMiYape() {
    setMiYapeNum(config.yape.numero);
    setMiYapeTitular(config.yape.titular);
    setEditarMiYape(true);
  }

  // Abre WhatsApp con el mensaje listo — no envía solo: el driver
  // lo revisa y apreta enviar (así como el QR de RiderTrack v2)
  function mandarWhatsApp() {
    const cel = normalizarCelular(celular);
    if (!cel) {
      setError('Poné el celular del cliente para mandarle el WhatsApp');
      return;
    }
    setError('');
    window.open(linkWhatsApp(cel, armarMensajeCobro()), '_blank');
    vibrar(60);
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
      direccion: direccion.trim(),
      celular: celular.trim(),
      yapeNombre: yapeNombre.trim(),
      yapeNumero: yapeNumero.trim(),
      tarifa: t,
      comisionPct: p,
      comision: c,
      neto: +(t - c).toFixed(2),
      notas: notas.trim(),
    });
    setTarifa('');
    setCliente('');
    setZona('');
    setDireccion('');
    setCelular('');
    setYapeNombre('');
    setYapeNumero('');
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
        {/* F-ID2.4: input SIN capture → abre la galería / archivos */}
        <input
          ref={inputGaleria}
          type="file"
          accept="image/*"
          onChange={alElegirFoto}
          className="hidden"
          data-testid="input-galeria"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={abrirEscanner}
            disabled={escaneando}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-black transition-all active:scale-[0.98] ${
              escaneando && fuenteScan === 'camara'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
            data-testid="boton-escanear"
          >
            {escaneando && fuenteScan === 'camara' ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Leyendo…
              </>
            ) : (
              <>
                <Camera size={18} /> Cámara
              </>
            )}
          </button>
          <button
            onClick={abrirGaleria}
            disabled={escaneando}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-black transition-all active:scale-[0.98] ${
              escaneando && fuenteScan === 'galeria'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
            }`}
            data-testid="boton-galeria"
          >
            {escaneando && fuenteScan === 'galeria' ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Leyendo…
              </>
            ) : (
              <>
                <ImageUp size={18} /> Galería
              </>
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">
          La IA llena el viaje sola — con una 🖼️ captura de pantalla funciona mejor que con foto a la pantalla
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
          <div className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400" data-testid="scan-error">
            {scanError}
            {scanDetalle && (
              <span
                className="mt-1 block break-words font-mono text-[10px] text-red-400/60"
                data-testid="scan-detalle"
              >
                [{scanDetalle}]
              </span>
            )}
            <span className="mt-1.5 block text-[11px] text-slate-400">
              💡 Tip: una captura de pantalla nítida (Galería) se lee mucho mejor que una foto a la pantalla
            </span>
          </div>
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

      {/* F-ID2.5: dirección de entrega (campo propio, se llena con el escaneo) */}
      <input
        value={direccion}
        onChange={e => setDireccion(e.target.value)}
        placeholder="📍 Dirección de entrega (se llena con el escaneo)"
        className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-400"
        data-testid="input-direccion"
      />

      {/* F-ID2.5: celular + botón WhatsApp lado a lado */}
      <div className="mt-2 flex gap-2">
        <input
          value={celular}
          onChange={e => setCelular(e.target.value)}
          inputMode="tel"
          placeholder="📱 Celular del cliente"
          className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-400"
          data-testid="input-celular"
        />
        <button
          onClick={mandarWhatsApp}
          disabled={escaneando}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2.5 text-xs font-black text-slate-950 transition-all active:scale-[0.98] disabled:opacity-50"
          data-testid="boton-whatsapp"
        >
          <MessageCircle size={16} /> Cobrar
        </button>
      </div>
      {celular.trim() && (
        <p className="mt-1 text-[10px] text-slate-500">
          💬 El botón Cobrar abre el WhatsApp del cliente con el mensaje de pago listo (mismo estilo del QR de RiderTrack)
        </p>
      )}

      {/* ── F-ID2.7: TU Yape para cobrar — se guarda 1 vez, sale en TODOS los mensajes ── */}
      {!config.yape.numero.trim() || editarMiYape ? (
        <div className="mt-2 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3" data-testid="tarjeta-mi-yape">
          <p className="text-xs font-bold text-violet-300">💜 Tu Yape para cobrar</p>
          <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
            Guardalo <b className="text-violet-200">una sola vez</b> y sale solo en el mensaje de cobro de{' '}
            <b className="text-violet-200">todos</b> tus clientes — no lo volvés a escribir.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              value={miYapeNum}
              onChange={e => setMiYapeNum(e.target.value)}
              inputMode="tel"
              placeholder="Tu número (ej. 987 654 321)"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-400"
              data-testid="input-mi-yape-num"
            />
            <input
              value={miYapeTitular}
              onChange={e => setMiYapeTitular(e.target.value)}
              placeholder="Tu nombre (opcional)"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-400"
              data-testid="input-mi-yape-titular"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={guardarMiYape}
              className="flex-1 rounded-xl bg-violet-500 py-2.5 text-xs font-black text-white transition-all active:scale-[0.98]"
              data-testid="boton-guardar-mi-yape"
            >
              Guardar mi Yape 💜
            </button>
            {editarMiYape && (
              <button
                onClick={() => setEditarMiYape(false)}
                className="rounded-xl bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300"
                data-testid="boton-cancelar-mi-yape"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2"
          data-testid="mi-yape-guardado"
        >
          <p className="min-w-0 text-[11px] leading-snug text-violet-200">
            💜 Tu Yape: <b className="text-violet-100">{config.yape.numero}</b>
            {config.yape.titular.trim() && <> ({config.yape.titular.trim()})</>} — va en <b>todos</b> los cobros
          </p>
          <button
            onClick={abrirEditorMiYape}
            className="shrink-0 text-[10px] font-bold text-violet-300 underline decoration-dotted"
            data-testid="boton-cambiar-mi-yape"
          >
            cambiar
          </button>
        </div>
      )}

      {/* ── F-ID2.7: vista previa del mensaje — SIEMPRE visible, en vivo ── */}
      <div className="mt-2 rounded-xl border border-[#25D366]/25 bg-[#25D366]/5 p-3" data-testid="preview-mensaje">
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-400/80">
          💬 Así le va a llegar a tu cliente
        </p>
        <div className="mt-1.5 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl rounded-tl-sm bg-[#005C4B] px-3 py-2 text-[12px] leading-relaxed text-white">
          <TextoWhatsApp texto={armarMensajeCobro()} />
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          Se arma solo con los datos del viaje — el botón Cobrar lo manda tal cual al WhatsApp del cliente
        </p>
      </div>

      {/* F-ID2.6: yape del PEDIDO — con el que pagó el CLIENTE (distinto del tuyo) */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          value={yapeNombre}
          onChange={e => setYapeNombre(e.target.value)}
          placeholder="💜 Yape del pedido: nombre"
          className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-400"
          data-testid="input-yape-nombre"
        />
        <input
          value={yapeNumero}
          onChange={e => setYapeNumero(e.target.value)}
          inputMode="numeric"
          placeholder="💜 Yape del pedido: número"
          className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-400"
          data-testid="input-yape-numero"
        />
      </div>
      {(yapeNombre.trim() || yapeNumero.trim()) && (
        <p className="mt-1 text-[10px] text-slate-500">
          💜 Con este yape PAGÓ tu cliente (se guarda con el viaje) — tu Yape para cobrar va más arriba, guardado
        </p>
      )}

      {/* Notas / referencia (se llena solo con el escaneo) */}
      <textarea
        value={notas}
        onChange={e => setNotas(e.target.value)}
        rows={2}
        placeholder="Referencia / notas (se llena con el escaneo)"
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

// F-ID2.7: pinta el mensaje tal como lo muestra WhatsApp dentro del
// chat — *texto* se ve en negrita (la vista previa manda los asteriscos
// tal cual y WhatsApp los convierte en negrita del otro lado)
function TextoWhatsApp({ texto }: { texto: string }) {
  const partes = texto.split(/(\*[^*\n]+\*)/g);
  return (
    <>
      {partes.map((p, i) =>
        p.length > 2 && p.startsWith('*') && p.endsWith('*') ? (
          <b key={i}>{p.slice(1, -1)}</b>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
