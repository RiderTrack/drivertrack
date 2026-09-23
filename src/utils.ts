// ═══════════════════════════════════════════════════════════
// 🛠️ DriverTrack — Utilidades (formato, vibración, imagen, compartir)
// ═══════════════════════════════════════════════════════════

export function fmtSoles(n: number): string {
  return 'S/ ' + n.toFixed(2);
}

// Vibración: Haptics nativo (APK) con fallback a navigator.vibrate (web)
export async function vibrar(ms = 400): Promise<void> {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Heavy });
    return;
  } catch {
    /* sin Capacitor: fallback web */
  }
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      (navigator as Navigator & { vibrate: (p: number | number[]) => boolean }).vibrate(ms);
    }
  } catch {
    /* nada */
  }
}

// Comprime una imagen a JPEG base64 (mismo approach de RiderTrack YapeQRView):
// máx 800px de lado, calidad 0.8 — liviana para localStorage
export function comprimirImagen(file: File): Promise<string> {
  return comprimirImagenConLimite(file, 800, 0.8);
}

// F-ID2: para el ESCANEO OCR usamos más resolución — el texto de una
// dirección (a veces a mano, a veces chiquito en una captura) necesita
// píxeles para que Gemini lo lea bien. 1400px / calidad 0.85 ≈ 300-500 KB.
export function comprimirImagenParaOCR(file: File): Promise<string> {
  return comprimirImagenConLimite(file, 1400, 0.85);
}

function comprimirImagenConLimite(file: File, MAX: number, calidad: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagen inválida'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas no disponible'));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Compartir texto: share nativo si existe, si no copia al portapapeles
export async function compartirTexto(titulo: string, texto: string): Promise<'share' | 'clipboard' | 'none'> {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: titulo, text: texto });
      return 'share';
    }
  } catch {
    /* el usuario canceló */
  }
  try {
    await navigator.clipboard.writeText(texto);
    return 'clipboard';
  } catch {
    return 'none';
  }
}

export function linkWhatsApp(numero: string, texto: string): string {
  const limpio = numero.replace(/[^0-9]/g, '');
  return `https://wa.me/${limpio}?text=${encodeURIComponent(texto)}`;
}

export function descargarArchivo(nombre: string, contenido: string, tipo = 'application/json'): void {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
