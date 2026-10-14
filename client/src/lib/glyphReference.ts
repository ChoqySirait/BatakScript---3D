import { Point } from './strokeEvaluator';

// Cache for extracted reference points
const referenceCache = new Map<string, Point[]>();

/**
 * Extracts canonical raster reference points for a Batak glyph.
 */
export function extractGlyphReferencePoints(
  glyph: string,
  size: number = 360
): Point[] {
  if (typeof document === 'undefined') return [];
  if (referenceCache.has(glyph)) {
    return referenceCache.get(glyph)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  ctx.clearRect(0, 0, size, size);
  ctx.font = 'bold 220px "Noto Sans Batak", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(glyph, size / 2, size / 2 + 10);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  const points: Point[] = [];
  const step = 4;

  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const alpha = data[(y * size + x) * 4 + 3];
      if (alpha > 120) {
        points.push({ x, y });
      }
    }
  }

  // Fallback if font isn't loaded yet
  if (points.length < 15) {
    for (let i = 0; i < 48; i++) {
      points.push({
        x: 60 + i * 5,
        y: 180 + Math.sin(i * 0.18) * 35,
      });
    }
  }

  referenceCache.set(glyph, points);
  return points;
}

