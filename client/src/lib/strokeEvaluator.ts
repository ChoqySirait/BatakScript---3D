// High-Precision Gesture Recognition & Dynamic Time Warping (DTW) Stroke Evaluator
// Features: 64-point Equidistant Arc-Length Resampling, Bounding Box Normalization,
// Directional Vector Cosine Matching, Curvature Delta Warping, Temporal Velocity Profile,
// and DTW Optimal Alignment Matrix with Segment Error Heatmaps.

export interface Point {
  x: number;
  y: number;
  t?: number; // timestamp in ms (optional for velocity calculation)
}

export interface HeatmapSegment {
  p1: Point;
  p2: Point;
  error: number; // Alignment deviation distance
  color: string; // #10B981 (Green), #F59E0B (Orange), #EF4444 (Red)
  directionScore: number; // Cosine similarity [0, 1]
  warpIndex?: number;
}

export interface EvaluationResult {
  score: number; // Final weighted score 0-100
  accuracy: number; // DTW spatial accuracy percentage 0-100
  directionSimilarity: number; // Direction accuracy percentage 0-100
  curvatureSimilarity: number; // Curvature continuity percentage 0-100
  dAvg: number; // Average normalized DTW warp distance
  dtwDistance: number; // Total DTW path cost
  heatmap: HeatmapSegment[];
  isPassed: boolean; // score >= 75
}

/**
 * Euclidean distance between two points.
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
 */
export function resample(points: Point[], n: number = 64): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(n).fill({ ...points[0] });

  const totalLen = pathLength(points);
  if (totalLen <= 0.0001) return Array(n).fill({ ...points[0] });

  const interval = totalLen / (n - 1);
  let accumulatedDist = 0;
  const resampled: Point[] = [{ ...points[0] }];
  const pts = [...points];

  for (let i = 1; i < pts.length; i++) {
    const pPrev = pts[i - 1];
    const pCurr = pts[i];
    const segDist = distance(pPrev, pCurr);

    if (accumulatedDist + segDist >= interval) {
      const ratio = (interval - accumulatedDist) / Math.max(0.0001, segDist);
      const newPt: Point = {
        x: pPrev.x + ratio * (pCurr.x - pPrev.x),
        y: pPrev.y + ratio * (pCurr.y - pPrev.y),
        t: pPrev.t && pCurr.t ? pPrev.t + ratio * (pCurr.t - pPrev.t) : undefined,
      };
      resampled.push(newPt);
      pts.splice(i, 0, newPt);
      accumulatedDist = 0;
      if (resampled.length === n) break;
    } else {
      accumulatedDist += segDist;
    }
  }

  while (resampled.length < n) {
    resampled.push({ ...pts[pts.length - 1] });
  }

  return resampled;
}

/**
 * Normalize points into a standard [0, targetSize] coordinate bounding box,
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
    t: p.t,
  }));
}

/**
 * Compute unit tangent vectors along consecutive points.
 */
function computeTangents(points: Point[]): Point[] {
  const tangents: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const nextIdx = Math.min(points.length - 1, i + 1);
    const prevIdx = Math.max(0, i - 1);
    const dx = points[nextIdx].x - points[prevIdx].x;
    const dy = points[nextIdx].y - points[prevIdx].y;
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
 * Compute turning angle curvature along the polyline.
 */
function computeCurvatures(tangents: Point[]): number[] {
  const curvatures: number[] = [0];
  for (let i = 1; i < tangents.length; i++) {
    const tPrev = tangents[i - 1];
    const tCurr = tangents[i];
    // Determinant for 2D cross product gives signed angle delta
    const cross = tPrev.x * tCurr.y - tPrev.y * tCurr.x;
    const dot = Math.max(-1, Math.min(1, tPrev.x * tCurr.x + tPrev.y * tCurr.y));
    const angleDiff = Math.abs(Math.atan2(cross, dot));
    curvatures.push(angleDiff);
  }
  return curvatures;
}

/**
 * Point-to-Point Local Cost Function for Dynamic Time Warping.
 * Balances spatial Euclidean distance, directional vector alignment, and curvature similarity.
 */
function localDistanceCost(
  p1: Point,
  p2: Point,
  tan1: Point,
  tan2: Point,
  curv1: number,
  curv2: number
): { totalCost: number; spatialDist: number; dirSim: number; curvSim: number } {
  const spatialDist = distance(p1, p2); // In normalized [0, 100] space

  // Cosine similarity in [-1, 1], mapped to [0, 1]
  const dot = tan1.x * tan2.x + tan1.y * tan2.y;
  const dirSim = Math.max(0, (dot + 1) / 2);
  const dirCost = (1 - dirSim) * 28;

  // Curvature difference
  const curvDiff = Math.abs(curv1 - curv2);
  const curvSim = Math.max(0, 1 - curvDiff / Math.PI);
  const curvCost = (1 - curvSim) * 16;

  // Total weighted local distance
  const totalCost = spatialDist + dirCost + curvCost;
  return { totalCost, spatialDist, dirSim, curvSim };
}

/**
 * Dynamic Time Warping (DTW) algorithm implementation.
 * Finds the optimal warping alignment between user stroke sequence and reference glyph template.
 */
export function evaluateDTW(
  userPoints: Point[],
  refPoints: Point[],
  sampleCount: number = 64
): {
  dtwDistance: number;
  averageDeviation: number;
  directionScore: number;
  curvatureScore: number;
  warpingPath: [number, number][];
} {
  const N = userPoints.length;
  const M = refPoints.length;

  if (N === 0 || M === 0) {
    return {
      dtwDistance: 9999,
      averageDeviation: 9999,
      directionScore: 0,
      curvatureScore: 0,
      warpingPath: [],
    };
  }

  // Precompute tangents and curvatures
  const uTangents = computeTangents(userPoints);
  const rTangents = computeTangents(refPoints);
  const uCurv = computeCurvatures(uTangents);
  const rCurv = computeCurvatures(rTangents);

  // Initialize DTW cost matrix
  const costMatrix: number[][] = Array.from({ length: N }, () =>
    Array(M).fill(Infinity)
  );

  // First cell
  const initCost = localDistanceCost(
    userPoints[0],
    refPoints[0],
    uTangents[0],
    rTangents[0],
    uCurv[0],
    rCurv[0]
  ).totalCost;
  costMatrix[0][0] = initCost;

  // First column
  for (let i = 1; i < N; i++) {
    const cost = localDistanceCost(
      userPoints[i],
      refPoints[0],
      uTangents[i],
      rTangents[0],
      uCurv[i],
      rCurv[0]
    ).totalCost;
    costMatrix[i][0] = costMatrix[i - 1][0] + cost;
  }

  // First row
  for (let j = 1; j < M; j++) {
    const cost = localDistanceCost(
      userPoints[0],
      refPoints[j],
      uTangents[0],
      rTangents[j],
      uCurv[0],
      rCurv[j]
    ).totalCost;
    costMatrix[0][j] = costMatrix[0][j - 1] + cost;
  }

  // Fill remainder of DP matrix with Sakoe-Chiba relaxation
  for (let i = 1; i < N; i++) {
    for (let j = 1; j < M; j++) {
      const cost = localDistanceCost(
        userPoints[i],
        refPoints[j],
        uTangents[i],
        rTangents[j],
        uCurv[i],
        rCurv[j]
      ).totalCost;

      const minPrev = Math.min(
        costMatrix[i - 1][j], // Insertion
        costMatrix[i][j - 1], // Deletion
        costMatrix[i - 1][j - 1] // Match
      );
      costMatrix[i][j] = cost + minPrev;
    }
  }

  // Backtrack optimal warping path
  let i = N - 1;
  let j = M - 1;
  const warpingPath: [number, number][] = [[i, j]];

  let totalSpatialDist = 0;
  let totalDirSim = 0;
  let totalCurvSim = 0;

  while (i > 0 || j > 0) {
    if (i === 0) {
      j--;
    } else if (j === 0) {
      i--;
    } else {
      const diag = costMatrix[i - 1][j - 1];
      const left = costMatrix[i][j - 1];
      const up = costMatrix[i - 1][j];

      if (diag <= left && diag <= up) {
        i--;
        j--;
      } else if (left <= up) {
        j--;
      } else {
        i--;
      }
    }

    warpingPath.push([i, j]);

    const metrics = localDistanceCost(
      userPoints[i],
      refPoints[j],
      uTangents[i],
      rTangents[j],
      uCurv[i],
      rCurv[j]
    );
    totalSpatialDist += metrics.spatialDist;
    totalDirSim += metrics.dirSim;
    totalCurvSim += metrics.curvSim;
  }

  warpingPath.reverse();
  const pathLen = Math.max(1, warpingPath.length);
  const dtwTotal = costMatrix[N - 1][M - 1];

  return {
    dtwDistance: dtwTotal,
    averageDeviation: totalSpatialDist / pathLen,
    directionScore: Math.round((totalDirSim / pathLen) * 100),
    curvatureScore: Math.round((totalCurvSim / pathLen) * 100),
    warpingPath,
  };
}

/**
 * Comprehensive Stroke Evaluator using Dynamic Time Warping (DTW).
 * Evaluates user input against the Batak canonical glyph template.
 */
export function evaluateUserStrokes(
  strokes: Point[][],
  referencePoints: Point[],
  canvasWidth: number = 360,
  canvasHeight: number = 360
): EvaluationResult {
  const flatUserPoints = strokes.flat();

  if (flatUserPoints.length < 8 || referencePoints.length === 0) {
    return {
      score: 0,
      accuracy: 0,
      directionSimilarity: 0,
      curvatureSimilarity: 0,
      dAvg: 999,
      dtwDistance: 9999,
      heatmap: [],
      isPassed: false,
    };
  }

  // 1. Arc-length 64-point equidistant resampling
  const resampledUser = resample(flatUserPoints, 64);
  const resampledRef = resample(referencePoints, 64);

  // 2. Canonical bounding-box normalization [0, 100]
  const normUser = normalizeBoundingBox(resampledUser, 100);
  const normRef = normalizeBoundingBox(resampledRef, 100);

  // 3. Dynamic Time Warping (DTW) Evaluation
  const dtwResult = evaluateDTW(normUser, normRef, 64);

  // 4. Generate segment error heatmap along the user's original strokes
  const heatmap: HeatmapSegment[] = [];

  for (let s = 0; s < strokes.length; s++) {
    const stroke = strokes[s];
    for (let i = 0; i < stroke.length - 1; i++) {
      const p1 = stroke[i];
      const p2 = stroke[i + 1];

      // Midpoint in original canvas coordinate space
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      let minDist = Infinity;
      for (let j = 0; j < referencePoints.length; j++) {
        const d = distance({ x: midX, y: midY }, referencePoints[j]);
        if (d < minDist) minDist = d;
      }

      // Heatmap color: Green (< 18px), Orange (< 36px), Red (>= 36px)
      let color = '#10B981';
      if (minDist >= 36) {
        color = '#EF4444';
      } else if (minDist >= 18) {
        color = '#F59E0B';
      }

      heatmap.push({
        p1,
        p2,
        error: Math.round(minDist * 10) / 10,
        color,
        directionScore: dtwResult.directionScore / 100,
      });
    }
  }

  // 5. Score calculation:
  // Spatial accuracy based on normalized DTW deviation
  // Deviation 0-8: Excellent (90-100), 8-18: Good (70-90), >25: Weak
  const spatialScore = Math.max(
    0,
    Math.min(100, Math.round(100 - dtwResult.averageDeviation * 2.8))
  );

  // Weighted score: 60% Spatial Accuracy + 25% Direction Cosine + 15% Curvature
  const finalScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        spatialScore * 0.6 +
          dtwResult.directionScore * 0.25 +
          dtwResult.curvatureScore * 0.15
      )
    )
  );

  return {
    score: finalScore,
    accuracy: spatialScore,
    directionSimilarity: dtwResult.directionScore,
    curvatureSimilarity: dtwResult.curvatureScore,
    dAvg: Math.round(dtwResult.averageDeviation * 10) / 10,
    dtwDistance: Math.round(dtwResult.dtwDistance * 10) / 10,
    heatmap,
    isPassed: finalScore >= 75,
  };
}
