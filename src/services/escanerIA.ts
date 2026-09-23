// ═══════════════════════════════════════════════════════════
// 📷 DriverTrack — Escáner de dirección con IA (F-ID2 + F-ID2.1)
// Foto del pedido → la IA lee cliente, dirección, zona,
// referencia, teléfono y tarifa → el formulario se llena solo.
//
// F-ID2.1 — DOS proveedores, se detectan solos por la key:
//   · Gemini → "AIza…" (clásica) o "AQ.…" (formato NUEVO que
//     entrega AI Studio hoy) — gratis en aistudio.google.com
//   · Claude → "sk-ant-…" (Anthropic, de pago) — la misma API
//     que usa rudy-bot
//
// OJO modelos (set 2026): Google retiró gemini-2.0-flash y
// gemini-2.5-flash para cuentas nuevas → usamos la generación
// 3.x con cadena de respaldo. Auth por header x-goog-api-key
// (funciona con AMBOS formatos de key).
// La key vive SOLO en el teléfono (localStorage). Local-first.
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
  | 'formato-key'
  | 'key-invalida'
  | 'api-bloqueada'
  | 'region'
  | 'quota'
  | 'red'
  | 'sin-datos'
  | 'desconocido';

export function mensajeErrorOcr(c: CodigoErrorOcr): string {
  switch (c) {
    case 'sin-key':
      return 'Configurá tu key de IA en Ajustes (Gemini gratis, 1 minuto)';
    case 'formato-key':
      return 'Eso no parece una key — Gemini empieza con "AIza" o "AQ." · Claude con "sk-ant-"';
    case 'key-invalida':
      return 'La key no es válida — copiala de nuevo desde AI Studio o Anthropic';
    case 'api-bloqueada':
      return 'Esa key no tiene la IA habilitada. Para Gemini, creala directo en aistudio.google.com/apikey';
    case 'region':
      return 'Gemini no está disponible desde tu región o red actual — probá con otra conexión o usá una key de Claude';
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

export type ProveedorIA = 'gemini' | 'claude';

/** Detecta el proveedor por el prefijo de la key. Null = no parece una key. */
export function detectarProveedor(apiKey: string): ProveedorIA | null {
  const k = apiKey.trim();
  if (k.startsWith('AIza') || k.startsWith('AQ.')) return 'gemini';
  if (k.startsWith('sk-ant-')) return 'claude';
  return null;
}

const MODELOS_GEMINI = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash'];
const MODELOS_CLAUDE = ['claude-haiku-4-5-20251001', 'claude-3-5-haiku-20241022'];
const URL_GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models';
const URL_CLAUDE = 'https://api.anthropic.com/v1/messages';
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

// Claude no tiene responseSchema: se le exige el JSON por el prompt
const PROMPT_CLAUDE_EXTRA = `

IMPORTANTE: Respondé ÚNICAMENTE con el objeto JSON, sin markdown, sin \`\`\` y sin explicaciones.`;

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

/** "data:image/jpeg;base64,XXXX" → "XXXX" (las APIs quieren el base64 pelado). */
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
  // F-ID2.2: los modelos 3.x devuelven sus "pensamientos" como parts
  // marcadas thought:true — hay que saber ignorarlas
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  error?: { code?: number; message?: string };
}

interface RespuestaClaude {
  content?: { type?: string; text?: string }[];
  error?: { message?: string };
}

async function fetchConTimeout(url: string, headers: Record<string, string>, body: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Llama a Gemini probando la cadena de modelos. Auth por HEADER (validado con keys AQ. y AIza). */
async function llamarGemini(apiKey: string, body: Record<string, unknown>): Promise<{ texto: string; modelo: string }> {
  let ultimoError: ErrorOcr = new ErrorOcr('desconocido');

  for (const modelo of MODELOS_GEMINI) {
    try {
      const res = await fetchConTimeout(
        `${URL_GEMINI}/${modelo}:generateContent`,
        { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body,
      );
      const data = (await res.json().catch(() => ({}))) as RespuestaGemini;

      if (res.status === 200) {
        // F-ID2.2: se filtran los "pensamientos" (thought:true) de los
        // modelos 3.x — antes se pegaban junto a la respuesta y rompían el JSON
        const texto =
          data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text ?? '').join('') ?? '';
        if (!texto) throw new ErrorOcr('sin-datos');
        return { texto, modelo };
      }

      const msg = (data.error?.message ?? '').toLowerCase();

      // Región/red bloqueada para Gemini (no depende del modelo → no seguir probando)
      if (res.status === 400 && msg.includes('location is not supported')) throw new ErrorOcr('region');

      // Modelo retirado o inexistente en esta cuenta → probar el siguiente de la cadena
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
      ultimoError = new ErrorOcr('red'); // abort / red caída / DNS
    }
  }
  throw ultimoError;
}

/** Llama a Claude (Anthropic Messages API) — la misma que usa rudy-bot. */
async function llamarClaude(apiKey: string, body: Record<string, unknown>): Promise<{ texto: string; modelo: string }> {
  let ultimoError: ErrorOcr = new ErrorOcr('desconocido');

  for (const modelo of MODELOS_CLAUDE) {
    try {
      const res = await fetchConTimeout(
        URL_CLAUDE,
        {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          // Permite llamar a Anthropic directo desde la app (sin servidor propio)
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        { ...body, model: modelo },
      );
      const data = (await res.json().catch(() => ({}))) as RespuestaClaude;

      if (res.status === 200) {
        const texto = (data.content ?? [])
          .filter(b => b.type === 'text')
          .map(b => b.text ?? '')
          .join('');
        if (!texto) throw new ErrorOcr('sin-datos');
        return { texto, modelo };
      }

      const msg = (data.error?.message ?? '').toLowerCase();

      // Modelo no disponible en esta cuenta → probar el siguiente
      if (res.status === 404 || (res.status === 400 && msg.includes('model'))) {
        ultimoError = new ErrorOcr('desconocido');
        continue;
      }
      if (res.status === 401) throw new ErrorOcr('key-invalida');
      if (res.status === 429) throw new ErrorOcr('quota');
      if (res.status === 403) throw new ErrorOcr('api-bloqueada');
      throw new ErrorOcr('desconocido');
    } catch (e) {
      if (e instanceof ErrorOcr) throw e;
      ultimoError = new ErrorOcr('red');
    }
  }
  throw ultimoError;
}

interface PeticionIA {
  prompt: string;
  imagenB64?: string; // si viene → es un escaneo con foto
}

interface ResultadoIA {
  texto: string;
  modelo: string;
  proveedor: ProveedorIA;
}

/** Enruta a Gemini o Claude según el prefijo de la key. */
async function llamarIA(apiKey: string, p: PeticionIA): Promise<ResultadoIA> {
  const proveedor = detectarProveedor(apiKey);
  if (!proveedor) throw new ErrorOcr('formato-key');

  if (proveedor === 'gemini') {
    const parts: unknown[] = [{ text: p.prompt }];
    if (p.imagenB64) {
      parts.push({ inline_data: { mime_type: 'image/jpeg', data: base64Limpio(p.imagenB64) } });
    }
    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0,
        ...(p.imagenB64
          ? { responseMimeType: 'application/json', responseSchema: SCHEMA }
          : {}), // ping SIN maxOutputTokens: los modelos 3.x "piensan" y un
        // tope chico se lo gastan pensando → respuesta vacía (bug F-ID2.2)
      },
    };
    const r = await llamarGemini(apiKey, body);
    return { ...r, proveedor };
  }

  // Claude
  const content: unknown[] = [{ type: 'text', text: p.prompt + PROMPT_CLAUDE_EXTRA }];
  if (p.imagenB64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: base64Limpio(p.imagenB64) },
    });
  }
  const body = {
    max_tokens: p.imagenB64 ? 1024 : 16,
    temperature: 0,
    messages: [{ role: 'user', content }],
  };
  const r = await llamarClaude(apiKey, body);
  return { ...r, proveedor };
}

/** Extrae el JSON de la respuesta (por si viene envuelto en texto/markdown). */
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
 * Funciona con key de Gemini (AIza… o AQ.…) o de Claude (sk-ant-…).
 */
export async function escanearDireccion(fotoBase64: string, apiKey: string): Promise<DatosEscaneados> {
  const key = apiKey.trim();
  if (!key) throw new ErrorOcr('sin-key');
  if (!detectarProveedor(key)) throw new ErrorOcr('formato-key');

  const { texto } = await llamarIA(key, { prompt: PROMPT, imagenB64: fotoBase64 });

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
 * Botón "Probar key" de Ajustes: mini llamada real → dice si funciona,
 * qué proveedor detectó y con qué modelo respondió. Auto-diagnóstico.
 */
export async function probarKeyIA(apiKey: string): Promise<{ ok: boolean; mensaje: string }> {
  const key = apiKey.trim();
  if (!key) return { ok: false, mensaje: 'Pegá la key primero' };
  const proveedor = detectarProveedor(key);
  if (!proveedor) return { ok: false, mensaje: mensajeErrorOcr('formato-key') };
  const nombre = proveedor === 'gemini' ? 'Gemini' : 'Claude';

  try {
    const { modelo } = await llamarIA(key, { prompt: 'Responde solo: ok' });
    return { ok: true, mensaje: `Key ${nombre} funcionando ✅ (${modelo})` };
  } catch (e) {
    const codigo: CodigoErrorOcr = e instanceof ErrorOcr ? e.codigo : 'desconocido';
    if (codigo === 'quota') {
      return { ok: true, mensaje: 'La key SÍ funciona (ahora está en su límite de momento, en un rato escanea normal)' };
    }
    // F-ID2.2: la API respondió 200 pero el modelo contestó vacío →
    // la key ANDA. Antes esto se reportaba como "no pude leer nada en
    // la foto" y confundía (el ping no tiene ninguna foto)
    if (codigo === 'sin-datos') {
      return { ok: true, mensaje: `Key ${nombre} funcionando ✅ (el modelo respondió a medias, pero la key está OK — escaneá nomás)` };
    }
    return { ok: false, mensaje: mensajeErrorOcr(codigo) };
  }
}
