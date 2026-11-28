export const OWNER_SIGNATURE_SRC =
  '/assets/aistudio/SmartSelect_20261126_210610_Samsung_Notes_d9216fea.jpg';

type SignatureTone = 'light' | 'dark';

const dataUrlCache: Partial<Record<SignatureTone, string>> = {};
const canvasCache: Partial<Record<SignatureTone, HTMLCanvasElement>> = {};

const loadRawSignatureImage = (): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = OWNER_SIGNATURE_SRC;
  });
};

export async function getProcessedSignatureCanvas(
  tone: SignatureTone
): Promise<HTMLCanvasElement | null> {
  if (canvasCache[tone]) {
    return canvasCache[tone]!;
  }

  const img = await loadRawSignatureImage();
  if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
    return null;
  }

  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tCtx = tempCanvas.getContext('2d');
  if (!tCtx) return null;

  tCtx.drawImage(img, 0, 0, w, h);

  let imageData: ImageData;
  try {
    imageData = tCtx.getImageData(0, 0, w, h);
  } catch {
    return null;
  }

  const data = imageData.data;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let hasStroke = false;

  // Target ink RGB: rich royal purple-indigo on light paper, luminous lavender on dark slip
  const inkR = tone === 'dark' ? 216 : 67;
  const inkG = tone === 'dark' ? 180 : 20;
  const inkB = tone === 'dark' ? 254 : 120;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const maxChannel = Math.max(r, g, b);
      // Black background removal threshold with anti-aliased stroke boost
      if (maxChannel <= 16) {
        data[idx + 3] = 0;
      } else {
        const normalized = Math.min(1, (maxChannel - 16) / 82);
        const alpha = Math.min(255, Math.round(Math.pow(normalized, 0.65) * 255));
        data[idx] = inkR;
        data[idx + 1] = inkG;
        data[idx + 2] = inkB;
        data[idx + 3] = alpha;

        if (alpha > 30) {
          hasStroke = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  tCtx.putImageData(imageData, 0, 0);

  if (!hasStroke) {
    canvasCache[tone] = tempCanvas;
    return tempCanvas;
  }

  const pad = 8;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(w - cropX, maxX - minX + pad * 2);
  const cropH = Math.min(h - cropY, maxY - minY + pad * 2);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;
  const cCtx = croppedCanvas.getContext('2d');
  if (!cCtx) return tempCanvas;

  cCtx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  canvasCache[tone] = croppedCanvas;
  return croppedCanvas;
}

export async function getProcessedSignatureDataUrl(
  tone: SignatureTone
): Promise<string | null> {
  if (dataUrlCache[tone]) {
    return dataUrlCache[tone]!;
  }
  const canvas = await getProcessedSignatureCanvas(tone);
  if (!canvas) return null;
  try {
    const url = canvas.toDataURL('image/png');
    dataUrlCache[tone] = url;
    return url;
  } catch {
    return null;
  }
}
