// High-Precision Gesture Recognition & Stroke Evaluator
// Features: 64-point Equidistant Resampling, Bounding Box Normalization,
// Directional Vector Similarity, and Segment Error Heatmap Classification.

export interface Point {
  x: number;
  y: number;
}

export interface HeatmapSegment {
  p1: Point;
  p2: Point;
  error: number; // Euclidean distance to nearest reference
  color: string; // Green, Orange, or Red
  directionScore: number; // Cosine similarity [-1, 1]
}

export interface EvaluationResult {
  score: number; // Final score 0-100
  accuracy: number; // Distance accuracy percentage
  directionSimilarity: number; // Direction accuracy percentage 0-100
  dAvg: number; // Average Euclidean deviation in pixels
  heatmap: HeatmapSegment[];
  isPassed: boolean; // score >= 75
}

/**
 * Compute Euclidean distance between two 2D points.
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute total length of a polyline.
 */
export function pathLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distance(points[i - 1], points[i]);
  }
  return len;
}

/**
 * Resample polyline into N equidistant points using arc-length parameterization.
 * Standard $1 Recognizer algorithm adapted for multi-point strokes.
 */
export function resample(points: Point[], n: number = 64): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(n).fill({ ...points[0] });

  const totalLen = pathLength(points);
  if (totalLen === 0) return Array(n).fill({ ...points[0] });

  const interval = totalLen / (n - 1);
  let accumulatedDist = 0;
  const resampled: Point[] = [{ ...points[0] }];
  const pts = [...points];

  for (let i = 1; i < pts.length; i++) {
    const pPrev = pts[i - 1];
    const pCurr = pts[i];
    const segDist = distance(pPrev, pCurr);

    if (accumulatedDist + segDist >= interval) {
      const ratio = (interval - accumulatedDist) / segDist;
      const newPt: Point = {
        x: pPrev.x + ratio * (pCurr.x - pPrev.x),
        y: pPrev.y + ratio * (pCurr.y - pPrev.y),
      };
      resampled.push(newPt);
      // Insert new point and restart from it
      pts.splice(i, 0, newPt);
      accumulatedDist = 0;
      if (resampled.length === n) break;
    } else {
      accumulatedDist += segDist;
    }
  }

  // Ensure exactly n points
  while (resampled.length < n) {
    resampled.push({ ...pts[pts.length - 1] });
  }

  return resampled;
}

/**
 * Normalize points into a standard bounding box (e.g. 100x100),
 * preserving aspect ratio.
 */
export function normalizeBoundingBox(points: Point[], targetSize: number = 100): Point[] {
  if (points.length === 0) return [];

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const scale = targetSize / Math.max(width, height);

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return points.map((p) => ({
    x: (p.x - cx) * scale + targetSize / 2,
    y: (p.y - cy) * scale + targetSize / 2,
  }));
}

/**
 * Compute unit tangent vectors along consecutive points.
 */
function computeTangents(points: Point[]): Point[] {
  const tangents: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 0.0001) {
      tangents.push({ x: dx / mag, y: dy / mag });
    } else {
      tangents.push({ x: 1, y: 0 });
    }
  }
  return tangents;
}

/**
 * High-precision stroke evaluation with 64-pt resampling, bounding box normalization,
 * directional vector similarity, and segment error heatmap categorization.
 */
export function evaluateUserStrokes(
  strokes: Point[][],
  referencePoints: Point[],
  canvasWidth: number = 360,
  canvasHeight: number = 360
): EvaluationResult {
  const flatUserPoints = strokes.flat();
  if (flatUserPoints.length < 10 || referencePoints.length === 0) {
    return {
      score: 0,
      accuracy: 0,
      directionSimilarity: 0,
      dAvg: 999,
      heatmap: [],
      isPassed: false,
    };
  }

  // 1. Resample full concatenated user stroke to 64 points
  const resampledUser = resample(flatUserPoints, 64);
  const resampledRef = resample(referencePoints, 64);

  // 2. Normalize both sets of points into a 100x100 canonical space
  const normUser = normalizeBoundingBox(resampledUser, 100);
  const normRef = normalizeBoundingBox(resampledRef, 100);

  // 3. Directional tangent vectors
  const userTangents = computeTangents(normUser);
  const refTangents = computeTangents(normRef);

  let totalDirectionSim = 0;
  for (let i = 0; i < userTangents.length; i++) {
    const u = userTangents[i];
    const r = refTangents[i] || { x: 1, y: 0 };
    // Cosine similarity in [-1, 1] -> map to [0, 1]
    const dot = u.x * r.x + u.y * r.y;
    totalDirectionSim += Math.max(0, dot);
  }
  const directionAccuracy = Math.round(
    (totalDirectionSim / Math.max(1, userTangents.length)) * 100
  );

  // 4. Calculate Euclidean deviation in original canvas space for Heatmap
  const heatmap: HeatmapSegment[] = [];
  let totalDev = 0;

  for (let s = 0; s < strokes.length; s++) {
    const stroke = strokes[s];
    for (let i = 0; i < stroke.length - 1; i++) {
      const p1 = stroke[i];
      const p2 = stroke[i + 1];

      // Find minimum distance of midpoint to reference
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      let minDist = Infinity;
      for (let j = 0; j < referencePoints.length; j++) {
        const d = distance({ x: midX, y: midY }, referencePoints[j]);
        if (d < minDist) minDist = d;
      }

      totalDev += minDist;

      // Color mapping: Green (< 18px), Orange (< 35px), Red (>= 35px)
      let color = '#10B981'; // Green: precision match
      if (minDist >= 35) {
        color = '#EF4444'; // Red: high deviation
      } else if (minDist >= 18) {
        color = '#F59E0B'; // Orange: moderate deviation
      }

      heatmap.push({
        p1,
        p2,
        error: minDist,
        color,
        directionScore: 1,
      });
    }
  }

  const N = Math.max(1, heatmap.length);
  const dAvg = totalDev / N;

  // 5. Canonical bounding-box Euclidean distance
  let normTotalDev = 0;
  for (let i = 0; i < normUser.length; i++) {
    let minD = Infinity;
    for (let j = 0; j < normRef.length; j++) {
      const d = distance(normUser[i], normRef[j]);
      if (d < minD) minD = d;
    }
    normTotalDev += minD;
  }
  const normAvgDist = normTotalDev / normUser.length;

  // Composite Score formula:
  // Shape distance accuracy: max(0, 100 - normAvgDist * 2.2)
  // Weighted: 75% Shape Euclidean distance + 25% Directional Vector similarity
  const shapeScore = Math.max(0, Math.min(100, Math.round(100 - normAvgDist * 2.2)));
  const finalScore = Math.max(
    0,
    Math.min(100, Math.round(shapeScore * 0.75 + directionAccuracy * 0.25))
  );

  return {
    score: finalScore,
    accuracy: shapeScore,
    directionSimilarity: directionAccuracy,
    dAvg: Math.round(dAvg * 10) / 10,
    heatmap,
    isPassed: finalScore >= 75,
  };
}
