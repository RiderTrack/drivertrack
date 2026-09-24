// ═══════════════════════════════════════════════════════════
// 🏍️ DriverTrack — Tipos centrales (F-ID1 + F-ID2)
// ═══════════════════════════════════════════════════════════

export type OrigenViaje = 'indrive' | 'rappi' | 'pedidosya' | 'directo';

export interface Viaje {
  id: string;
  fecha: string;       // YYYY-MM-DD (hora local Lima)
  hora: string;        // HH:MM
  origen: OrigenViaje;
  cliente: string;
  zona: string;
  direccion: string;   // F-ID2.5: dirección de ENTREGA propia (antes vivía perdida en notas)
  celular: string;     // F-ID2.5: WhatsApp del cliente → botón de cobro
  tarifa: number;      // lo que cobra la app / el cliente
  comisionPct: number; // % que se queda la plataforma
  comision: number;    // monto de la comisión
  neto: number;        // tarifa - comisión
  notas: string;
}

export interface Billetera {
  numero: string;
  titular: string;
  qrBase64: string;    // imagen del QR comprimida (JPEG base64)
}

export interface ConfigDT {
  metaDiaria: number;                       // S/ objetivo del día
  comisiones: Record<OrigenViaje, number>;  // % default por origen
  yape: Billetera;
  plin: Billetera;
  geminiKey: string;                        // F-ID2: key de AI Studio para el escáner (vive solo en el teléfono)
  claudeKey: string;                        // F-ID2.5: token de Anthropic — el escáner lo usa de RESPALDO si Gemini falla
}

export interface ResumenDia {
  n: number;
  bruto: number;
  comision: number;
  neto: number;
  porOrigen: Record<OrigenViaje, { n: number; neto: number }>;
}

export const ORIGENES: { id: OrigenViaje; nombre: string; emoji: string }[] = [
  { id: 'indrive', nombre: 'inDrive', emoji: '🟢' },
  { id: 'rappi', nombre: 'Rappi', emoji: '🟠' },
  { id: 'pedidosya', nombre: 'PedidosYa', emoji: '🔴' },
  { id: 'directo', nombre: 'Directo', emoji: '🔵' },
];

export function nombreOrigen(o: OrigenViaje): string {
  return ORIGENES.find(x => x.id === o)?.nombre ?? o;
}
