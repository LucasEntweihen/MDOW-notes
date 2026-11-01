/**
 * MARS Vision - Stroke Preprocessor
 * Smoothing, Arc-Length Resampling and RDP Simplification
 */
window.MARS = window.MARS || {};
window.MARS.Vision = window.MARS.Vision || {};

class StrokePreprocessor {
    /**
     * Savitzky-Golay weighted 5-point moving average to eliminate hand tremor
     */
    static smoothPoints(pts) {
        if (!pts || pts.length < 3) return pts ? pts.slice() : [];
        const out = [pts[0]];
        for (let i = 1; i < pts.length - 1; i++) {
            const prev = pts[Math.max(0, i - 1)];
            const curr = pts[i];
            const next = pts[Math.min(pts.length - 1, i + 1)];
            out.push({
                x: prev.x * 0.25 + curr.x * 0.5 + next.x * 0.25,
                y: prev.y * 0.25 + curr.y * 0.5 + next.y * 0.25
            });
        }
        out.push(pts[pts.length - 1]);
        return out;
    }

    /**
     * Ramer-Douglas-Peucker (RDP) polygonal stroke simplification
     */
    static simplifyRDP(pts, epsilon = 0.025) {
        if (!pts || pts.length <= 2) return pts ? pts.slice() : [];
        let dmax = 0;
        let index = 0;
        const start = pts[0];
        const end = pts[pts.length - 1];
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const mag = Math.hypot(dx, dy);

        for (let i = 1; i < pts.length - 1; i++) {
            let d = 0;
            if (mag < 1e-6) {
                d = Math.hypot(pts[i][0] - start[0], pts[i][1] - start[1]);
            } else {
                d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + end[0] * start[1] - end[1] * start[0]) / mag;
            }
            if (d > dmax) {
                index = i;
                dmax = d;
            }
        }

        if (dmax > epsilon) {
            const rec1 = StrokePreprocessor.simplifyRDP(pts.slice(0, index + 1), epsilon);
            const rec2 = StrokePreprocessor.simplifyRDP(pts.slice(index), epsilon);
            return rec1.slice(0, rec1.length - 1).concat(rec2);
        } else {
            return [start, end];
        }
    }

    /**
     * Arc-Length Equidistant Resampling (exactly N equidistant 2D points)
     */
    static resampleByArcLength(normPts, n = 32) {
        if (!normPts || normPts.length === 0) return [];
        if (normPts.length === 1) {
            return Array.from({ length: n }, () => [normPts[0][0], normPts[0][1]]);
        }

        let totalLen = 0;
        for (let i = 1; i < normPts.length; i++) {
            totalLen += Math.hypot(normPts[i][0] - normPts[i - 1][0], normPts[i][1] - normPts[i - 1][1]);
        }
        if (totalLen < 1e-5) {
            return Array.from({ length: n }, () => [normPts[0][0], normPts[0][1]]);
        }

        const step = totalLen / (n - 1);
        const resampled = [[normPts[0][0], normPts[0][1]]];
        let D = 0;
        const work = normPts.map(p => [p[0], p[1]]);

        for (let i = 1; i < work.length; i++) {
            const p1 = work[i - 1];
            const p2 = work[i];
            const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
            if (D + d >= step && d > 1e-6) {
                const qx = p1[0] + ((step - D) / d) * (p2[0] - p1[0]);
                const qy = p1[1] + ((step - D) / d) * (p2[1] - p1[1]);
                const q = [qx, qy];
                resampled.push(q);
                work.splice(i, 0, q);
                D = 0;
                if (resampled.length === n) break;
            } else {
                D += d;
            }
        }

        while (resampled.length < n) {
            const last = normPts[normPts.length - 1];
            resampled.push([last[0], last[1]]);
        }
        return resampled;
    }

    /**
     * Normalize stroke points to [0,1]x[0,1] while preserving subtle aspects
     */
    static normalizeClusterStrokes(cluster, targetPoints = 28) {
        const b = cluster.bbox;
        const w = Math.max(1, b.width);
        const h = Math.max(1, b.height);
        return cluster.strokes.map(st => {
            const smoothed = StrokePreprocessor.smoothPoints(st.points);
            const norm = smoothed.map(p => [
                w < 8 ? 0.5 : Math.min(1, Math.max(0, (p.x - b.minX) / w)),
                h < 8 ? 0.5 : Math.min(1, Math.max(0, (p.y - b.minY) / h))
            ]);
            return StrokePreprocessor.resampleByArcLength(norm, targetPoints);
        });
    }
}

window.MARS.Vision.StrokePreprocessor = StrokePreprocessor;
