/**
 * MARS Vision - Topological Segmenter
 * Graph-based clustering of handwritten strokes into glyph units
 */
window.MARS = window.MARS || {};
window.MARS.Vision = window.MARS.Vision || {};

class TopologicalSegmenter {
    static segmentsIntersectOrClose(p1, p2, p3, p4, threshold = 10) {
        const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
        if (ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)) {
            return true;
        }
        const distSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        return Math.min(
            distSq(p1, p3), distSq(p1, p4),
            distSq(p2, p3), distSq(p2, p4)
        ) <= threshold * threshold;
    }

    static strokesPhysicallyTouch(stA, stB, threshold = 12) {
        const ptsA = stA.points;
        const ptsB = stB.points;
        const stepA = Math.max(1, Math.floor(ptsA.length / 18));
        const stepB = Math.max(1, Math.floor(ptsB.length / 18));

        for (let i = 0; i < ptsA.length - 1; i += stepA) {
            const a1 = ptsA[i], a2 = ptsA[Math.min(ptsA.length - 1, i + stepA)];
            for (let j = 0; j < ptsB.length - 1; j += stepB) {
                const b1 = ptsB[j], b2 = ptsB[Math.min(ptsB.length - 1, j + stepB)];
                if (TopologicalSegmenter.segmentsIntersectOrClose(a1, a2, b1, b2, threshold)) {
                    return true;
                }
            }
        }
        return false;
    }

    static mergeBBox(A, B) {
        const minX = Math.min(A.minX, B.minX);
        const minY = Math.min(A.minY, B.minY);
        const maxX = Math.max(A.maxX, B.maxX);
        const maxY = Math.max(A.maxY, B.maxY);
        return {
            minX, minY, maxX, maxY,
            width: Math.max(1, maxX - minX),
            height: Math.max(1, maxY - minY)
        };
    }

    /**
     * Segment a collection of strokes into spatial glyph clusters
     */
    static segment(strokes) {
        if (!strokes || strokes.length === 0) return [];

        const clusters = strokes.map(s => ({
            strokes: [s],
            bbox: { ...s.bbox }
        }));

        let merged = true;
        while (merged) {
            merged = false;
            for (let i = 0; i < clusters.length; i++) {
                for (let j = i + 1; j < clusters.length; j++) {
                    const cA = clusters[i];
                    const cB = clusters[j];
                    const A = cA.bbox;
                    const B = cB.bbox;

                    const overlapX = Math.min(A.maxX, B.maxX) - Math.max(A.minX, B.minX);
                    const overlapY = Math.min(A.maxY, B.maxY) - Math.max(A.minY, B.minY);
                    const minW = Math.min(A.width, B.width);
                    const maxW = Math.max(A.width, B.width);
                    const minH = Math.min(A.height, B.height);

                    // 1. Physical touch or intersection (+, x, *, 4, 5, 7, t, f)
                    let touches = false;
                    if (overlapX > -16 && overlapY > -16) {
                        for (const sa of cA.strokes) {
                            for (const sb of cB.strokes) {
                                if (TopologicalSegmenter.strokesPhysicallyTouch(sa, sb, 13)) {
                                    touches = true;
                                    break;
                                }
                            }
                            if (touches) break;
                        }
                    }

                    // 2. Parallel vertical stacks (sinal '=', '±', 'π', hat of '5' or 'T')
                    const xOverlapRatio = overlapX / Math.max(1, minW);
                    const verticalGap = Math.max(A.minY, B.minY) - Math.min(A.maxY, B.maxY);
                    const isStackedSymbol = xOverlapRatio > 0.48 && verticalGap < Math.max(38, maxW * 0.85);

                    // 3. Strong bounding box containment
                    const isContained = overlapX >= minW * 0.65 && overlapY >= minH * 0.65;

                    if (touches || isStackedSymbol || isContained) {
                        cA.strokes.push(...cB.strokes);
                        cA.bbox = TopologicalSegmenter.mergeBBox(A, B);
                        clusters.splice(j, 1);
                        merged = true;
                        break;
                    }
                }
                if (merged) break;
            }
        }

        // Sort left-to-right (and top-to-bottom for ties)
        return clusters.sort((a, b) => {
            const dx = a.bbox.minX - b.bbox.minX;
            if (Math.abs(dx) > 12) return dx;
            return a.bbox.minY - b.bbox.minY;
        });
    }
}

window.MARS.Vision.TopologicalSegmenter = TopologicalSegmenter;
