// ═══════════════════════════════════════════════════════════
// 📷 DriverTrack — Escáner de dirección con IA (F-ID2)
// Foto del pedido (captura / chat / nota a mano) → Gemini lee
// cliente, dirección, zona, referencia, teléfono y tarifa →
// el formulario del viaje se llena solo. Estilo Circuit.
//
// La key es del usuario (aistudio.google.com/apikey, gratis) y
// vive SOLO en su teléfono (localStorage). Local-first.
// ═══════════════════════════════════════════════════════════

export interface DatosEscaneados {
  cliente: string;
  direccion: string;
  zona: string;
  referencia: string;
  telefono: string;
  tarifa: number | null; // null si la foto no muestra precio
}

export type CodigoErrorOcr =
  | 'sin-key'
  | 'key-invalida'
  | 'api-bloqueada'
  | 'quota'
  | 'red'
  | 'sin-datos'
  | 'desconocido';

export function mensajeErrorOcr(c: CodigoErrorOcr): string {
  switch (c) {
    case 'sin-key':
      return 'Configurá tu key Gemini en Ajustes (gratis, 1 minuto)';
    case 'key-invalida':
      return 'La key no es válida — copiala de nuevo desde AI Studio';
    case 'api-bloqueada':
      return 'Esa key no tiene Gemini habilitado. Creá la key directo en aistudio.google.com/apikey';
    case 'quota':
      return 'La key llegó a su límite del momento — reintentá en un rato';
    case 'red':
      return 'Sin internet o conexión lenta — revisá tu señal';
    case 'sin-datos':
      return 'No pude leer nada en la foto 🤔 — escribí a mano con la foto de guía';
    default:
      return 'Algo falló escaneando — probá de nuevo o escribí a mano';
  }
}

/** Cadena de modelos: si el primero no existe en la cuenta del usuario, cae al siguiente. */
const MODELOS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 25000;

const PROMPT = `Eres el escáner de pedidos de DriverTrack, una app de delivery motorizado en Lima, Perú.

Te mando la FOTO de un pedido. Puede ser: una captura de pantalla de inDrive, Rappi o PedidosYa; un chat de WhatsApp; una nota o sticker escrito a mano; o el sticker del paquete.

Extrae los datos del ENVÍO con estas reglas:
- cliente: nombre del cliente si aparece (quién recibe o pide). Si no aparece, "".
- direccion: la dirección de ENTREGA tal cual está escrita (avenida/calle/jirón, número, interior, departamento, manzana, lote). Si hay varias direcciones, la de entrega final.
- zona: el distrito o zona (ej: San Miguel, La Perla, Cercado, SMP). Solo el nombre, sin "Distrito de".
- referencia: el punto de referencia si aparece (ej: "frente a la bodega", "portón azul").
- telefono: el celular del cliente si aparece (dígitos y espacios).
- tarifa: el precio/tarifa del viaje SÍ Y SOLO SÍ aparece escrito explícitamente (ej: "S/ 8.50", "8 soles"). Solo el número ("8.50"). Si no aparece, "".

REGLAS DE ORO:
- Copia el texto EXACTO de la foto. No corrijas ortografía. NO INVENTES NADA.
- Si un dato no aparece en la foto, devuelve "" (cadena vacía).
- Responde SOLO el JSON.`;

const SCHEMA = {
  type: 'object',
  properties: {
    cliente: { type: 'string' },
    direccion: { type: 'string' },
    zona: { type: 'string' },
    referencia: { type: 'string' },
    telefono: { type: 'string' },
    tarifa: { type: 'string' },
  },
  propertyOrdering: ['cliente', 'direccion', 'zona', 'referencia', 'telefono', 'tarifa'],
};

/** "data:image/jpeg;base64,XXXX" → "XXXX" (Gemini quiere el base64 pelado). */
function base64Limpio(b64: string): string {
  const i = b64.indexOf(',');
  return i >= 0 && b64.startsWith('data:') ? b64.slice(i + 1) : b64;
}

class ErrorOcr extends Error {
  codigo: CodigoErrorOcr;
  constructor(codigo: CodigoErrorOcr) {
    super(mensajeErrorOcr(codigo));
    this.codigo = codigo;
  }
}

interface RespuestaGemini {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  error?: { code?: number; message?: string; status?: string };
}

/** Una llamada al endpoint de Gemini. Lanza ErrorOcr con código amigable. */
async function llamarGemini(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<{ texto: string; modelo: string }> {
  let ultimoError: ErrorOcr = new ErrorOcr('desconocido');

  for (const modelo of MODELOS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${URL_BASE}/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = (await res.json().catch(() => ({}))) as RespuestaGemini;

      if (res.status === 200) {
        const texto = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
        if (!texto) throw new ErrorOcr('sin-datos');
        return { texto, modelo };
      }

      const msg = (data.error?.message ?? '').toLowerCase();

      // Modelo no disponible en esta cuenta → probar el siguiente de la cadena
      if (res.status === 404 || (res.status === 400 && (msg.includes('not found') || msg.includes('not supported')))) {
        ultimoError = new ErrorOcr('desconocido');
        continue;
      }
      if (res.status === 400 && (msg.includes('api key') || msg.includes('api_key'))) throw new ErrorOcr('key-invalida');
      if (res.status === 403) throw new ErrorOcr('api-bloqueada');
      if (res.status === 429) throw new ErrorOcr('quota');
      throw new ErrorOcr('desconocido');
    } catch (e) {
      if (e instanceof ErrorOcr) throw e;
      // abort / red caída / DNS
      ultimoError = new ErrorOcr('red');
    } finally {
      clearTimeout(timer);
    }
  }
  throw ultimoError;
}

/** Extrae el JSON de la respuesta (por si viene envuelto en texto). */
function parsearJsonTexto(texto: string): Record<string, string> {
  try {
    return JSON.parse(texto) as Record<string, string>;
  } catch {
    const m = texto.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as Record<string, string>;
    throw new ErrorOcr('sin-datos');
  }
}

function parsearTarifa(crudo: string | undefined): number | null {
  if (!crudo) return null;
  const n = parseFloat(crudo.replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * 📷 El corazón de F-ID2: foto base64 (JPEG dataURL) → datos del viaje.
 */
export async function escanearDireccion(fotoBase64: string, apiKey: string): Promise<DatosEscaneados> {
  const key = apiKey.trim();
  if (!key) throw new ErrorOcr('sin-key');

  const { texto } = await llamarGemini(key, {
    contents: [
      {
        role: 'user',
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: 'image/jpeg', data: base64Limpio(fotoBase64) } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
    },
  });

  const d = parsearJsonTexto(texto);
  const datos: DatosEscaneados = {
    cliente: (d.cliente ?? '').trim(),
    direccion: (d.direccion ?? '').trim(),
    zona: (d.zona ?? '').trim(),
    referencia: (d.referencia ?? '').trim(),
    telefono: (d.telefono ?? '').trim(),
    tarifa: parsearTarifa(d.tarifa),
  };

  if (!datos.cliente && !datos.direccion && !datos.zona && !datos.referencia && !datos.telefono && datos.tarifa === null) {
    throw new ErrorOcr('sin-datos');
  }
  return datos;
}

/**
 * Botón "Probar key" de Ajustes: mini llamada real → dice si la key
 * funciona y con qué modelo. Auto-diagnóstico, sin adivinar.
 */
export async function probarKeyGemini(apiKey: string): Promise<{ ok: boolean; mensaje: string }> {
  const key = apiKey.trim();
  if (!key) return { ok: false, mensaje: 'Pegá la key primero (empieza con "AIza")' };
  if (!key.startsWith('AIza')) return { ok: false, mensaje: 'Las keys de Gemini empiezan con "AIza" — revisá que copiaste completa' };

  try {
    const { modelo } = await llamarGemini(key, {
      contents: [{ role: 'user', parts: [{ text: 'Responde solo: ok' }] }],
      generationConfig: { maxOutputTokens: 10 },
    });
    return { ok: true, mensaje: `Key funcionando ✅ (${modelo})` };
  } catch (e) {
    const codigo: CodigoErrorOcr = e instanceof ErrorOcr ? e.codigo : 'desconocido';
    if (codigo === 'quota') return { ok: true, mensaje: 'La key SÍ funciona (ahora está en su límite de momento, en un rato escanea normal)' };
    return { ok: false, mensaje: mensajeErrorOcr(codigo) };
  }
}
