// ═══════════════════════════════════════════════════════════
// 📋 DriverTrack — Lista de viajes del día (F-ID2.5 → F-ID2.8)
// Muestra la dirección de entrega propia y, si hay celular,
// el botón 💬 para mandar el mensaje de cobro por WhatsApp.
// F-ID2.6: también el 💜 yape del pedido (quién pagó).
// F-ID2.8: el botón 💬 manda EXACTAMENTE el mismo mensaje del
// botón Cobrar de arriba (misma función compartida: saludo +
// monto + entrega + TU Yape + gracias) — antes mandaba una
// copia vieja sin el bloque de pago.
// ═══════════════════════════════════════════════════════════
import { useState } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { ConfigDT, nombreOrigen, Viaje } from '../types';
import { armarMensajeCobro, fmtSoles, linkWhatsApp, normalizarCelular } from '../utils';

interface Props {
  viajes: Viaje[]; // solo los del día mostrado
  onEliminar: (id: string) => void;
  titulo: string;
  config: ConfigDT; // F-ID2.8: tu Yape/Plin guardados van en el mensaje
}

export default function ViajeList({ viajes, onEliminar, titulo, config }: Props) {
  const [confirmarId, setConfirmarId] = useState<string | null>(null);

  if (viajes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 p-6 text-center">
        <p className="text-sm text-slate-400">Todavía no hay viajes {titulo.toLowerCase()}</p>
        <p className="mt-1 text-xs text-slate-500">Agregá el primero con el formulario de arriba 👆</p>
      </div>
    );
  }

  const ordenados = [...viajes].sort((a, b) => (a.hora < b.hora ? 1 : -1));

  return (
    <div className="space-y-2">
      {ordenados.map(v => (
        <div
          key={v.id}
          className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 p-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                {v.hora}
              </span>
              <span className="text-xs font-semibold text-emerald-300">{nombreOrigen(v.origen)}</span>
              {(v.cliente || v.zona) && (
                <span className="truncate text-xs text-slate-400">
                  {v.cliente}
                  {v.cliente && v.zona ? ' · ' : ''}
                  {v.zona}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xs text-slate-500 line-through">{fmtSoles(v.tarifa)}</span>
              <span className="text-sm font-bold text-emerald-400">{fmtSoles(v.neto)}</span>
              <span className="text-[10px] text-red-400/80">
                −{fmtSoles(v.comision)} ({v.comisionPct}%)
              </span>
            </div>
            {v.direccion && (
              <p className="mt-1 truncate text-[10px] leading-snug text-slate-400" title={v.direccion}>
                📍 {v.direccion}
              </p>
            )}
            {(v.yapeNombre || v.yapeNumero) && (
              <p
                className="mt-1 truncate text-[10px] leading-snug text-purple-300/80"
                title={`Yape del pedido: ${v.yapeNombre} ${v.yapeNumero}`.trim()}
                data-testid="yape-viaje"
              >
                💜 {v.yapeNombre} {v.yapeNumero}
              </p>
            )}
            {v.notas && (
              <p className="mt-1 truncate text-[10px] leading-snug text-slate-500" title={v.notas}>
                📝 {v.notas.split('\n')[0]}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {v.celular.trim() && (
              <button
                onClick={() =>
                  window.open(
                    linkWhatsApp(
                      normalizarCelular(v.celular),
                      // F-ID2.8: MISMA función compartida que el botón
                      // Cobrar de arriba — mensaje completo por bloques
                      armarMensajeCobro(
                        { cliente: v.cliente, monto: v.tarifa, direccion: v.direccion },
                        config,
                      ),
                    ),
                    '_blank',
                  )
                }
                className="rounded-lg bg-[#25D366]/15 p-2 text-[#25D366] transition-colors hover:bg-[#25D366]/25"
                aria-label="Mandar mensaje de cobro por WhatsApp"
                data-testid="boton-whatsapp-lista"
              >
                <MessageCircle size={16} />
              </button>
            )}
            {confirmarId === v.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    onEliminar(v.id);
                    setConfirmarId(null);
                  }}
                  className="rounded-lg bg-red-500/20 px-2 py-1.5 text-[11px] font-bold text-red-400"
                >
                  Borrar
                </button>
                <button
                  onClick={() => setConfirmarId(null)}
                  className="rounded-lg bg-slate-700 px-2 py-1.5 text-[11px] font-bold text-slate-300"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmarId(v.id)}
                className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                aria-label="Eliminar viaje"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
