// ═══════════════════════════════════════════════════════════
// 🏍️ DriverTrack — Tipos centrales (F-ID1 + F-ID2 + F-ID3)
// ═══════════════════════════════════════════════════════════

export type OrigenViaje = 'indrive' | 'rappi' | 'pedidosya' | 'directo';

// F-ID3: un punto del recorrido GPS grabado durante un viaje
export interface PuntoRuta {
  lat: number;  // redondeado a 5 decimales (~1 m)
  lng: number;
  t: number;    // epoch en SEGUNDOS (cuándo pasó por acá)
}

export interface Viaje {
  id: string;
  fecha: string;       // YYYY-MM-DD (hora local Lima)
  hora: string;        // HH:MM
  origen: OrigenViaje;
  cliente: string;
  zona: string;
  direccion: string;   // F-ID2.5: dirección de ENTREGA propia (antes vivía perdida en notas)
  celular: string;     // F-ID2.5: WhatsApp del cliente → botón de cobro
  yapeNombre: string;  // F-ID2.6: nombre de la cuenta yape del pedido (ej: "Mk" en "Mk yape 980811297")
  yapeNumero: string;  // F-ID2.6: número yape/plin del pedido — para saber QUIÉN pagó
  kmGPS: number;       // F-ID3: km REALES grabados con GPS mientras manejabas (0 = sin grabar)
  duracionSeg: number; // F-ID3: cuánto duró el trayecto grabado (segundos de movimiento)
  ruta?: PuntoRuta[];  // F-ID3: el trazado para el mapa (se guarda comprimido, máx ~1500 puntos)
  coordenadas?: { lat: number; lng: number }; // F-ID3.2: dónde es la ENTREGA (pin en el mapa, se pone a mano o por GPS)
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
  miNombre: string;                         // F-ID3.3: TU nombre — sale grande en tu QR para los clientes
  miCelular: string;                        // F-ID3.3: TU WhatsApp — el QR lo abre directo (una vez, como tu Yape)
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
