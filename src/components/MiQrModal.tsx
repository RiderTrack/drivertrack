// ═══════════════════════════════════════════════════════════
// 📱 DriverTrack — Mi QR para los clientes (F-ID3.3)
// Cuando el cliente te pide el número, en vez de dictarlo le
// mostrás esta pantalla: tu QR GRANDE con tu nombre arriba.
//
// Dos modos de QR (toggle):
//   • 💬 WhatsApp — al escanearlo le abre TU chat directo
//   • 👤 Contacto — vCard que te guarda con nombre y número
//
// Se genera LOCAL en el teléfono (librería qrcode, sin internet)
// y tus datos se guardan UNA vez en config (como tu Yape).
// Patrón visual de "Mi QR" de RiderTrack v2.
// ═══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Loader2, Pencil, Share2, UserRound, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { ConfigDT } from '../types';
import { normalizarCelular } from '../utils';

interface Props {
  config: ConfigDT;
  onGuardar: (nombre: string, celular: string) => void;
  onCerrar: () => void;
  onToast?: (msg: string) => void;
}

type ModoQR = 'whatsapp' | 'contacto';

/** El contenido del QR según el modo */
export function contenidoQR(modo: ModoQR, nombre: string, celular: string): string {
  const num = normalizarCelular(celular);
  if (modo === 'contacto') {
    // vCard: al escanearlo el teléfono ofrece GUARDARTE con
    // nombre y número ("…con el nombre y todo" 📇)
    const nom = nombre.trim() || 'Conductor';
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${nom}`,
      `N:${nom};;;;`,
      `TEL;TYPE=CELL:+${num}`,
      'END:VCARD',
    ].join('\r\n');
  }
  return `https://wa.me/${num}`; // escanea → tu chat directo
}

export default function MiQrModal({ config, onGuardar, onCerrar, onToast }: Props) {
  const guardado = config.miCelular.trim().length > 0;
  const [editando, setEditando] = useState(!guardado);
  const [nombre, setNombre] = useState(config.miNombre);
  const [celular, setCelular] = useState(config.miCelular);
  const [modo, setModo] = useState<ModoQR>('whatsapp');
  const [qrUrl, setQrUrl] = useState('');
  const [generando, setGenerando] = useState(true);
  const [compartiendo, setCompartiendo] = useState(false);

  const nombreFinal = config.miNombre.trim() || 'Tu nombre';
  const numFinal = normalizarCelular(config.miCelular);
  const celBonito = config.miCelular.trim() || '—';

  // Regenerar el QR cuando cambian el modo o tus datos
  useEffect(() => {
    if (editando || !guardado) return; // no hay nada que mostrar aún
    let vivo = true;
    setGenerando(true);
    QRCode.toDataURL(contenidoQR(modo, config.miNombre, config.miCelular), {
      width: 560,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then(url => {
        if (vivo) {
          setQrUrl(url);
          setGenerando(false);
        }
      })
      .catch(() => {
        if (vivo) setGenerando(false);
      });
    return () => {
      vivo = false;
    };
  }, [modo, config.miNombre, config.miCelular, editando, guardado]);

  function guardar() {
    const cel = celular.trim();
    if (cel.replace(/\D/g, '').length < 8) {
      onToast?.('Escribí tu celular completo (9 dígitos en Perú) 📱');
      return;
    }
    onGuardar(nombre.trim(), cel);
    setEditando(false);
  }

  async function compartir() {
    const link = `https://wa.me/${numFinal}`;
    const texto = `Hola! Soy ${nombreFinal} 🛵 — escribime por WhatsApp: ${link}`;
    setCompartiendo(true);
    try {
      // 1) APK (Capacitor): hoja de compartir NATIVA de Android
      if (Capacitor.isNativePlatform()) {
        const { Share } = await import('@capacitor/share');
        await Share.share({ title: 'Mi WhatsApp', text: texto, dialogTitle: 'Compartir mi contacto' });
        return;
      }
      // 2) Web: compartir nativo del navegador
      if (navigator.share) {
        await navigator.share({ text: texto });
        return;
      }
      throw new Error('sin share');
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? '');
      const cancelado = /cancel|abort/i.test(msg) || (e as { name?: string })?.name === 'AbortError';
      if (cancelado) return;
      // 3) Último recurso: copiar el link al portapapeles
      try {
        await navigator.clipboard.writeText(link);
        onToast?.('📋 Link copiado — pegalo donde quieras');
      } catch {
        onToast?.(`Tu WhatsApp: ${config.miCelular.trim()}`);
      }
    } finally {
      setCompartiendo(false);
    }
  }

  const celDigitos = celular.replace(/\D/g, '').length;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center"
      onClick={onCerrar}
      data-testid="mi-qr-modal"
    >
      <div
        className="anim-pop flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
          <p className="text-sm font-black text-slate-100">
            {editando ? '📱 Tus datos para el QR' : '📱 Mi QR'}
          </p>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            aria-label="Cerrar"
            data-testid="qr-cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* ══ Setup / edición de datos ══ */}
        {editando ? (
          <div className="space-y-3 p-4">
            <p className="text-[11px] leading-relaxed text-slate-400">
              Se guardan <b className="text-slate-200">una sola vez</b> (como tu Yape 💜) y arman tu QR con tu
              nombre — le mostrás la pantalla al cliente y te escanea.
            </p>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre (ej: Rudy)"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-400"
              data-testid="qr-input-nombre"
            />
            <input
              value={celular}
              onChange={e => setCelular(e.target.value)}
              inputMode="tel"
              placeholder="📱 Tu celular / WhatsApp (ej: 987 654 321)"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-400"
              data-testid="qr-input-celular"
            />
            <div className="flex gap-2">
              {guardado && (
                <button
                  onClick={() => setEditando(false)}
                  className="flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-xs font-bold text-slate-300 transition-all active:scale-[0.98]"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={guardar}
                disabled={celDigitos < 8}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-black text-slate-950 transition-all active:scale-[0.98] disabled:opacity-40"
                data-testid="qr-setup-guardar"
              >
                <Check size={14} /> Guardar mi QR
              </button>
            </div>
          </div>
        ) : (
          /* ══ La tarjeta QR ══ */
          <div className="flex-1 overflow-y-auto p-4">
            {/* Nombre + número */}
            <div className="text-center">
              <p className="text-lg font-black leading-tight text-slate-50" data-testid="qr-nombre">
                {nombreFinal}
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-emerald-400" data-testid="qr-celular">
                {celBonito}
              </p>
            </div>

            {/* El QR — tarjeta BLANCA (los QR se leen mejor así) */}
            <div className="mx-auto mt-3 flex w-fit items-center justify-center rounded-2xl bg-white p-3 shadow-lg">
              {generando ? (
                <div className="flex h-[224px] w-[224px] items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-slate-400" />
                </div>
              ) : (
                <img
                  src={qrUrl}
                  alt={`QR de WhatsApp de ${nombreFinal}`}
                  className="h-[224px] w-[224px]"
                  data-testid="qr-imagen"
                />
              )}
            </div>

            {/* Modo del QR */}
            <div
              className="mx-auto mt-3 grid w-fit grid-cols-2 gap-1 rounded-xl border border-slate-700 bg-slate-950 p-1"
              role="tablist"
            >
              <button
                onClick={() => setModo('whatsapp')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  modo === 'whatsapp' ? 'bg-[#25D366] text-slate-950' : 'text-slate-400'
                }`}
                data-testid="qr-modo-whatsapp"
              >
                💬 WhatsApp
              </button>
              <button
                onClick={() => setModo('contacto')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  modo === 'contacto' ? 'bg-sky-500 text-slate-950' : 'text-slate-400'
                }`}
                data-testid="qr-modo-contacto"
              >
                👤 Contacto
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] leading-snug text-slate-500">
              {modo === 'whatsapp'
                ? 'Al escanearlo le abre TU chat de WhatsApp directo 📲'
                : 'Al escanearlo te guarda con tu nombre y número en sus contactos 📇'}
            </p>

            {/* Acciones */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={compartir}
                disabled={compartiendo}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/15 px-3 py-2.5 text-xs font-bold text-[#25D366] transition-all active:scale-[0.98] disabled:opacity-50"
                data-testid="boton-qr-compartir"
              >
                {compartiendo ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                Compartir
              </button>
              <button
                onClick={() => {
                  setNombre(config.miNombre);
                  setCelular(config.miCelular);
                  setEditando(true);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-xs font-bold text-slate-300 transition-all active:scale-[0.98]"
                data-testid="boton-qr-editar"
              >
                <Pencil size={14} /> Editar
              </button>
            </div>

            <p className="mt-3 text-center text-[10px] leading-snug text-slate-500">
              Mostrale esta pantalla al cliente 📱 — te escanea y ya te tiene
              guardado <UserRound size={10} className="inline text-slate-600" />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
