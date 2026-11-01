/**
 * MARS Vision - Feature Extractor
 * Multi-scale structural, topological and directional characterization
 */
window.MARS = window.MARS || {};
window.MARS.Vision = window.MARS.Vision || {};

const GRID_N = window.MARS_CONFIG?.GRID_N || 16;

class FeatureExtractor {
    /**
     * Intersections between stroke segments
     */
    static countCrossings(normStrokes) {
        let crossings = 0;
        const ccw = (A, B, C) => (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
        const intersect = (p1, p2, p3, p4) => ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);

        for (let s1 = 0; s1 < normStrokes.length; s1++) {
            const pts1 = normStrokes[s1];
            for (let s2 = s1 + 1; s2 < normStrokes.length; s2++) {
                const pts2 = normStrokes[s2];
                let pairCrossed = false;
                for (let i = 0; i < pts1.length - 1 && !pairCrossed; i++) {
                    for (let j = 0; j < pts2.length - 1; j++) {
                        if (intersect(pts1[i], pts1[i + 1], pts2[j], pts2[j + 1])) {
                            crossings++;
                            pairCrossed = true;
                            break;
                        }
                    }
                }
            }

            for (let i = 0; i < pts1.length - 2; i++) {
                for (let j = i + 4; j < pts1.length - 1; j++) {
                    if (intersect(pts1[i], pts1[i + 1], pts1[j], pts1[j + 1])) {
                        crossings++;
                        break;
                    }
                }
            }
        }
        return crossings;
    }

    /**
     * Euler topology via 4-connected flood-fill: closed loops (0, 6, 8, 9, 4, a, b, e) and Y centroid
     */
    static analyzeTopologyHoles(grid16) {
        const W = 20, H = 20;
        const occupied = new Uint8Array(W * H);

        for (let y = 0; y < GRID_N; y++) {
            for (let x = 0; x < GRID_N; x++) {
                if (grid16[y * GRID_N + x] > 0) {
                    const gx = x + 2;
                    const gy = y + 2;
                    occupied[gy * W + gx] = 1;
                }
            }
        }

        const closed = occupied.slice();
        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                if (!occupied[y * W + x]) {
                    const n = occupied[(y - 1) * W + x] + occupied[(y + 1) * W + x] +
                              occupied[y * W + (x - 1)] + occupied[y * W + (x + 1)];
                    if (n >= 3) closed[y * W + x] = 1;
                }
            }
        }

        const visited = new Uint8Array(W * H);
        const queue = [0];
        visited[0] = 1;

        while (queue.length > 0) {
            const idx = queue.pop();
            const cx = idx % W;
            const cy = Math.floor(idx / W);

            const neighbors = [
                [cx - 1, cy], [cx + 1, cy],
                [cx, cy - 1], [cx, cy + 1]
            ];

            for (let k = 0; k < 4; k++) {
                const nx = neighbors[k][0], ny = neighbors[k][1];
                if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                    const nIdx = ny * W + nx;
                    if (!visited[nIdx] && !closed[nIdx]) {
                        visited[nIdx] = 1;
                        queue.push(nIdx);
                    }
                }
            }
        }

        let holeCount = 0;
        let sumHoleY = 0;
        let totalHolePixels = 0;

        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                const idx = y * W + x;
                if (!visited[idx] && !closed[idx]) {
                    const hQueue = [idx];
                    visited[idx] = 1;
                    let compPixels = 0;
                    let compSumY = 0;

                    while (hQueue.length > 0) {
                        const hIdx = hQueue.pop();
                        const hx = hIdx % W;
                        const hy = Math.floor(hIdx / W);
                        compPixels++;
                        compSumY += hy;

                        const hNeighs = [
                            [hx - 1, hy], [hx + 1, hy],
                            [hx, hy - 1], [hx, hy + 1]
                        ];
                        for (let k = 0; k < 4; k++) {
                            const nhx = hNeighs[k][0], nhy = hNeighs[k][1];
                            if (nhx >= 0 && nhx < W && nhy >= 0 && nhy < H) {
                                const nhIdx = nhy * W + nhx;
                                if (!visited[nhIdx] && !closed[nhIdx]) {
                                    visited[nhIdx] = 1;
                                    hQueue.push(nhIdx);
                                }
                            }
                        }
                    }

                    if (compPixels >= 2) {
                        holeCount++;
                        sumHoleY += compSumY;
                        totalHolePixels += compPixels;
                    }
                }
            }
        }

        const avgHoleY = totalHolePixels > 0 ? (sumHoleY / totalHolePixels - 2) / GRID_N : 0.5;
        return { holeCount, avgHoleY };
    }

    /**
     * Hu geometric scale and rotation moments
     */
    static computeHuMoments(grid16) {
        let m00 = 0, m10 = 0, m01 = 0;
        for (let y = 0; y < GRID_N; y++) {
            for (let x = 0; x < GRID_N; x++) {
                const val = grid16[y * GRID_N + x];
                if (val > 0) {
                    m00 += val;
                    m10 += x * val;
                    m01 += y * val;
                }
            }
        }
        if (m00 === 0) return [0, 0, 0, 0];

        const cx = m10 / m00;
        const cy = m01 / m00;

        let mu20 = 0, mu02 = 0, mu11 = 0;
        for (let y = 0; y < GRID_N; y++) {
            for (let x = 0; x < GRID_N; x++) {
                const val = grid16[y * GRID_N + x];
                if (val > 0) {
                    const dx = x - cx;
                    const dy = y - cy;
                    mu20 += dx * dx * val;
                    mu02 += dy * dy * val;
                    mu11 += dx * dy * val;
                }
            }
        }

        const eta20 = mu20 / (m00 ** 2);
        const eta02 = mu02 / (m00 ** 2);
        const eta11 = mu11 / (m00 ** 2);

        const hu1 = eta20 + eta02;
        const hu2 = ((eta20 - eta02) ** 2) + 4 * (eta11 ** 2);
        return [hu1, hu2];
    }

    /**
     * Complete multi-feature extraction from normalized stroke collection
     */
    static extract(normStrokes, rawAspect = 0.75) {
        const grid = new Float32Array(GRID_N * GRID_N);
        const hog = new Float32Array(8);
        const chainCode = new Float32Array(8);
        const zoning = new Float32Array(9);

        let totalAbsAngle = 0;
        let signedAngle = 0;
        let sharpCorners = 0;

        normStrokes.forEach(pts => {
            for (let i = 0; i < pts.length; i++) {
                const gx = Math.min(GRID_N - 1, Math.max(0, Math.floor(pts[i][0] * (GRID_N - 0.001))));
                const gy = Math.min(GRID_N - 1, Math.max(0, Math.floor(pts[i][1] * (GRID_N - 0.001))));
                grid[gy * GRID_N + gx] = 1.0;

                const zx = Math.min(2, Math.max(0, Math.floor(pts[i][0] * 3)));
                const zy = Math.min(2, Math.max(0, Math.floor(pts[i][1] * 3)));
                zoning[zy * 3 + zx] += 1;

                if (i > 0) {
                    const dx = pts[i][0] - pts[i - 1][0];
                    const dy = pts[i][1] - pts[i - 1][1];
                    const mag = Math.hypot(dx, dy);
                    if (mag > 1e-5) {
                        let angle = Math.atan2(dy, dx);
                        if (angle < 0) angle += Math.PI * 2;
                        const bin = Math.min(7, Math.max(0, Math.floor((angle / (Math.PI * 2)) * 8)));
                        hog[bin] += mag;
                        chainCode[bin] += 1;
                    }
                }

                if (i > 0 && i < pts.length - 1) {
                    const v1x = pts[i][0] - pts[i - 1][0];
                    const v1y = pts[i][1] - pts[i - 1][1];
                    const v2x = pts[i + 1][0] - pts[i][0];
                    const v2y = pts[i + 1][1] - pts[i][1];
                    const cross = v1x * v2y - v1y * v2x;
                    const dot = v1x * v2x + v1y * v2y;
                    const dTh = Math.atan2(cross, dot);
                    totalAbsAngle += Math.abs(dTh);
                    signedAngle += dTh;
                    if (Math.abs(dTh) > 1.25) sharpCorners++;
                }
            }
        });

        // Normalize distributions
        let hogSum = 0, chainSum = 0, zoneSum = 0;
        for (let k = 0; k < 8; k++) { hogSum += hog[k]; chainSum += chainCode[k]; }
        for (let z = 0; z < 9; z++) zoneSum += zoning[z];
        if (hogSum > 0) for (let k = 0; k < 8; k++) hog[k] /= hogSum;
        if (chainSum > 0) for (let k = 0; k < 8; k++) chainCode[k] /= chainSum;
        if (zoneSum > 0) for (let z = 0; z < 9; z++) zoning[z] /= zoneSum;

        // Two-pass Chamfer distance transform
        const distField = new Float32Array(GRID_N * GRID_N);
        distField.fill(99);
        for (let i = 0; i < GRID_N * GRID_N; i++) {
            if (grid[i] > 0) distField[i] = 0;
        }

        for (let y = 0; y < GRID_N; y++) {
            for (let x = 0; x < GRID_N; x++) {
                const idx = y * GRID_N + x;
                if (x > 0) distField[idx] = Math.min(distField[idx], distField[idx - 1] + 1);
                if (y > 0) distField[idx] = Math.min(distField[idx], distField[(y - 1) * GRID_N + x] + 1);
                if (x > 0 && y > 0) distField[idx] = Math.min(distField[idx], distField[(y - 1) * GRID_N + (x - 1)] + 1.414);
                if (x < GRID_N - 1 && y > 0) distField[idx] = Math.min(distField[idx], distField[(y - 1) * GRID_N + (x + 1)] + 1.414);
            }
        }
        for (let y = GRID_N - 1; y >= 0; y--) {
            for (let x = GRID_N - 1; x >= 0; x--) {
                const idx = y * GRID_N + x;
                if (x < GRID_N - 1) distField[idx] = Math.min(distField[idx], distField[idx + 1] + 1);
                if (y < GRID_N - 1) distField[idx] = Math.min(distField[idx], distField[(y + 1) * GRID_N + x] + 1);
                if (x < GRID_N - 1 && y < GRID_N - 1) distField[idx] = Math.min(distField[idx], distField[(y + 1) * GRID_N + (x + 1)] + 1.414);
                if (x > 0 && y < GRID_N - 1) distField[idx] = Math.min(distField[idx], distField[(y + 1) * GRID_N + (x - 1)] + 1.414);
            }
        }

        const topology = FeatureExtractor.analyzeTopologyHoles(grid);
        const crossings = FeatureExtractor.countCrossings(normStrokes);
        const huMoments = FeatureExtractor.computeHuMoments(grid);

        const firstStroke = normStrokes[0] || [[0, 0]];
        const lastStroke = normStrokes[normStrokes.length - 1] || [[0, 0]];
        const startPt = firstStroke[0];
        const endPt = lastStroke[lastStroke.length - 1];
        const startEndDist = Math.hypot(endPt[0] - startPt[0], endPt[1] - startPt[1]);

        const flatPts = [];
        normStrokes.forEach(s => s.forEach(p => flatPts.push(p)));
        const dtwSeq = window.MARS.Vision.StrokePreprocessor.resampleByArcLength(flatPts, 16);

        return {
            grid,
            distField,
            hog,
            chainCode,
            zoning,
            huMoments,
            dtwSeq,
            strokeCount: normStrokes.length,
            aspect: rawAspect,
            curvature: totalAbsAngle,
            signedCurvature: signedAngle,
            sharpCorners,
            holeCount: topology.holeCount,
            avgHoleY: topology.avgHoleY,
            crossings,
            startPt,
            endPt,
            startEndDist
        };
    }
}

window.MARS.Vision.FeatureExtractor = FeatureExtractor;
