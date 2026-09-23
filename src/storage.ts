// ═══════════════════════════════════════════════════════════
// 💾 DriverTrack — Persistencia local (localStorage) + helpers
// Local-first: los datos viven en el teléfono. Backup JSON en Ajustes.
// ═══════════════════════════════════════════════════════════

import { ConfigDT, ResumenDia, Viaje } from './types';

const K_VIAJES = 'dt_viajes_v1';
const K_CONFIG = 'dt_config_v1';
const K_META_FECHA = 'dt_meta_celebrada_fecha';

export const CONFIG_DEFECTO: ConfigDT = {
  metaDiaria: 100,
  comisiones: { indrive: 10, rappi: 25, pedidosya: 25, directo: 0 },
  yape: { numero: '', titular: '', qrBase64: '' },
  plin: { numero: '', titular: '', qrBase64: '' },
};

export function fechaHoy(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

export function horaAhora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function fechaBonita(f: string): string {
  const [y, m, d] = f.split('-').map(Number);
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
  const dt = new Date(y, m - 1, d);
  return `${dias[dt.getDay()]} ${d} ${meses[m - 1]}`;
}

export function cargarViajes(): Viaje[] {
  try {
    const raw = localStorage.getItem(K_VIAJES);
    return raw ? (JSON.parse(raw) as Viaje[]) : [];
  } catch {
    return [];
  }
}

export function guardarViajes(v: Viaje[]): void {
  localStorage.setItem(K_VIAJES, JSON.stringify(v));
}

export function cargarConfig(): ConfigDT {
  try {
    const raw = localStorage.getItem(K_CONFIG);
    if (!raw) return { ...CONFIG_DEFECTO };
    const c = JSON.parse(raw) as Partial<ConfigDT>;
    return {
      ...CONFIG_DEFECTO,
      ...c,
      comisiones: { ...CONFIG_DEFECTO.comisiones, ...(c.comisiones ?? {}) },
      yape: { ...CONFIG_DEFECTO.yape, ...(c.yape ?? {}) },
      plin: { ...CONFIG_DEFECTO.plin, ...(c.plin ?? {}) },
    };
  } catch {
    return { ...CONFIG_DEFECTO };
  }
}

export function guardarConfig(c: ConfigDT): void {
  localStorage.setItem(K_CONFIG, JSON.stringify(c));
}

// ── Meta del día: se celebra 1 vez por día (no cada vez que abre la app) ──
export function metaYaCelebrada(): boolean {
  return localStorage.getItem(K_META_FECHA) === fechaHoy();
}
export function marcarMetaCelebrada(): void {
  localStorage.setItem(K_META_FECHA, fechaHoy());
}

// ── Resumen de un día ──
export function resumenDia(viajes: Viaje[], fecha: string): ResumenDia {
  const delDia = viajes.filter(v => v.fecha === fecha);
  const porOrigen = {} as ResumenDia['porOrigen'];
  for (const v of delDia) {
    if (!porOrigen[v.origen]) porOrigen[v.origen] = { n: 0, neto: 0 };
    porOrigen[v.origen].n += 1;
    porOrigen[v.origen].neto += v.neto;
  }
  return {
    n: delDia.length,
    bruto: delDia.reduce((s, v) => s + v.tarifa, 0),
    comision: delDia.reduce((s, v) => s + v.comision, 0),
    neto: delDia.reduce((s, v) => s + v.neto, 0),
    porOrigen,
  };
}

export function fechasConViajes(viajes: Viaje[]): string[] {
  return [...new Set(viajes.map(v => v.fecha))].sort().reverse();
}
