/**
 * MARS Vision - Hybrid Deterministic Classifier
 * DTW + Bidirectional Chamfer + Directional HOG + Topological Decision Gating
 */
window.MARS = window.MARS || {};
window.MARS.Vision = window.MARS.Vision || {};

class HybridClassifier {
    constructor() {
        this.templates = [];
    }

    buildTemplates() {
        this.templates.length = 0;
        const prototypes = window.MARS.Vision.getMARSSymbolPrototypes();
        prototypes.forEach(def => {
            const resampledStrokes = def.strokes.map(s => window.MARS.Vision.StrokePreprocessor.resampleByArcLength(s, 28));
            const feat = window.MARS.Vision.FeatureExtractor.extract(resampledStrokes, def.aspect);
            this.templates.push({
                symbol: def.symbol,
                category: def.category,
                ...feat
            });
        });
    }

    /**
     * Fast Dynamic Time Warping (DTW) on 2D 16-point trajectories
     */
    static computeDTW(seqA, seqB) {
        const N = seqA.length;
        const M = seqB.length;
        const dp = new Float32Array((N + 1) * (M + 1));
        dp.fill(1e9);
        dp[0] = 0;

        for (let i = 1; i <= N; i++) {
            const ax = seqA[i - 1][0], ay = seqA[i - 1][1];
            for (let j = 1; j <= M; j++) {
                const bx = seqB[j - 1][0], by = seqB[j - 1][1];
                const cost = Math.hypot(ax - bx, ay - by);
                const prev = Math.min(
                    dp[(i - 1) * (M + 1) + j],
                    dp[i * (M + 1) + (j - 1)],
                    dp[(i - 1) * (M + 1) + (j - 1)]
                );
                dp[i * (M + 1) + j] = cost + prev;
            }
        }
        return dp[N * (M + 1) + M] / N;
    }

    classify(cluster, medianHeight = 60, contextInfo = {}) {
        if (this.templates.length === 0) this.buildTemplates();

        const b = cluster.bbox;
        const rawAspect = b.width / Math.max(1, b.height);
        const normStrokes = window.MARS.Vision.StrokePreprocessor.normalizeClusterStrokes(cluster);
        const sample = window.MARS.Vision.FeatureExtractor.extract(normStrokes, rawAspect);

        const horizEnergy = sample.hog[0] + sample.hog[7];
        const vertEnergy = sample.hog[3] + sample.hog[4];
        const diagEnergy = sample.hog[1] + sample.hog[2] + sample.hog[5] + sample.hog[6];

        // 1. High-confidence deterministic rules for obvious geometric structures
        if (sample.strokeCount === 1 && rawAspect > 2.15 && horizEnergy > 0.68 && sample.curvature < 1.1) {
            return {
                symbol: '-',
                category: 'operator',
                confidence: 0.99,
                features: sample,
                topCandidates: [{ symbol: '-', score: 0.99 }, { symbol: '=', score: 0.32 }],
                uncertain: false
            };
        }

        if (sample.strokeCount === 2 && sample.crossings === 0 && horizEnergy > 0.68 && rawAspect > 0.85) {
            return {
                symbol: '=',
                category: 'operator',
                confidence: 0.98,
                features: sample,
                topCandidates: [{ symbol: '=', score: 0.98 }, { symbol: '-', score: 0.38 }],
                uncertain: false
            };
        }

        if (sample.strokeCount === 1 && rawAspect < 0.36 && sample.curvature < 1.25 && vertEnergy > 0.62) {
            return {
                symbol: '1',
                category: 'digit',
                confidence: 0.98,
                features: sample,
                topCandidates: [{ symbol: '1', score: 0.98 }, { symbol: '/', score: 0.35 }],
                uncertain: false
            };
        }

        // 2. Multi-Metric Evaluation against all Prototypes
        const scoresBySymbol = {};
        const GRID_N = window.MARS_CONFIG?.GRID_N || 16;

        this.templates.forEach(tpl => {
            // A. Bidirectional Chamfer Distance on 16x16 grid
            let sumU = 0, cntU = 0, sumT = 0, cntT = 0;
            for (let i = 0; i < GRID_N * GRID_N; i++) {
                if (sample.grid[i] > 0) { sumU += tpl.distField[i]; cntU++; }
                if (tpl.grid[i] > 0) { sumT += sample.distField[i]; cntT++; }
            }
            const avgChamfer = ((sumU / Math.max(1, cntU)) + (sumT / Math.max(1, cntT))) * 0.5;
            const chamferSim = Math.exp(-avgChamfer * 0.52);

            // B. Dynamic Time Warping (DTW)
            const dtwDist = HybridClassifier.computeDTW(sample.dtwSeq, tpl.dtwSeq);
            const dtwSim = Math.exp(-dtwDist * 2.6);

            // C. Directional Similarity (HOG + Freeman Chain Code)
            let hogSim = 0, chainSim = 0;
            for (let k = 0; k < 8; k++) {
                hogSim += sample.hog[k] * tpl.hog[k];
                chainSim += sample.chainCode[k] * tpl.chainCode[k];
            }
            const dirSim = hogSim * 0.55 + chainSim * 0.45;

            // D. 3x3 Zonal Density
            let zoneDiff = 0;
            for (let z = 0; z < 9; z++) zoneDiff += Math.abs(sample.zoning[z] - tpl.zoning[z]);
            const zoneSim = Math.max(0, 1 - zoneDiff * 0.65);

            // E. Curvature and Endpoints
            const curvSim = Math.exp(-Math.abs(sample.curvature - tpl.curvature) * 0.16);
            const endDist = Math.hypot(sample.startPt[0] - tpl.startPt[0], sample.startPt[1] - tpl.startPt[1]) +
                            Math.hypot(sample.endPt[0] - tpl.endPt[0], sample.endPt[1] - tpl.endPt[1]);
            const endSim = Math.exp(-endDist * 0.42);

            let score = (chamferSim * 0.36) +
                        (dtwSim * 0.24) +
                        (dirSim * 0.16) +
                        (zoneSim * 0.10) +
                        (curvSim * 0.07) +
                        (endSim * 0.07);

            // Stroke count penalty
            score -= Math.abs(sample.strokeCount - tpl.strokeCount) * 0.075;

            // F. Topological Decision Gating
            if (sample.holeCount >= 2) {
                if (tpl.symbol === '8') score += 0.26;
                else score -= 0.15;
            } else if (sample.holeCount === 1) {
                if (['0', '6', '9', '4', 'a', 'b', '8', 'e'].includes(tpl.symbol)) {
                    score += 0.12;
                    if (sample.avgHoleY < 0.43 && tpl.symbol === '9') score += 0.16;
                    if (sample.avgHoleY > 0.56 && (tpl.symbol === '6' || tpl.symbol === 'b')) score += 0.16;
                    if (sample.avgHoleY >= 0.40 && sample.avgHoleY <= 0.60 && (tpl.symbol === '0' || tpl.symbol === 'a' || tpl.symbol === 'e')) score += 0.14;
                } else if (['1', '2', '3', '5', '7', '+', '-', '/', '=', 'x', 'c', 'n'].includes(tpl.symbol)) {
                    score -= 0.18;
                }
            } else {
                if (sample.startEndDist < 0.24 && sample.curvature > 4.2 && tpl.symbol === '0') {
                    score += 0.15;
                }
            }

            // Distinguishing '+' vs 'x' vs '*'
            if (sample.strokeCount === 2 && sample.crossings >= 1) {
                if (tpl.symbol === '+') {
                    if (horizEnergy > 0.26 && vertEnergy > 0.26 && diagEnergy < 0.46) score += 0.25;
                    else score -= 0.16;
                }
                if (tpl.symbol === 'x') {
                    if (diagEnergy > 0.46) score += 0.25;
                    else score -= 0.16;
                }
                if (tpl.symbol === '4') {
                    const bottomLeft = sample.zoning[6];
                    if (horizEnergy > 0.20 && vertEnergy > 0.25 && bottomLeft < 0.08) score += 0.18;
                }
            }

            if (sample.strokeCount === 3 && sample.crossings >= 2 && tpl.symbol === '*') {
                score += 0.28;
            }
            if (sample.strokeCount === 3 && horizEnergy > 0.22 && vertEnergy > 0.35 && tpl.symbol === 'pi') {
                score += 0.26;
            }

            // Distinguishing '2', 'z', '3', '5', '7'
            if (tpl.symbol === '2' && sample.strokeCount === 1) {
                if (sample.endPt[0] > 0.62 && sample.endPt[1] > 0.72 && (sample.zoning[6] + sample.zoning[7] + sample.zoning[8]) > 0.32) {
                    score += 0.12;
                }
            }
            if (tpl.symbol === 'z' && sample.strokeCount >= 2 && horizEnergy > 0.32 && diagEnergy > 0.25) {
                score += 0.22;
            }
            if (tpl.symbol === '5') {
                if (sample.startPt[1] < 0.28 && sample.endPt[0] < 0.48 && sample.endPt[1] > 0.65) {
                    score += 0.13;
                }
            }
            if (tpl.symbol === '3' && sample.strokeCount === 1) {
                if (sample.zoning[3] < 0.06 && sample.startPt[0] < 0.45 && sample.endPt[0] < 0.45 && sample.curvature > 4.2) {
                    score += 0.15;
                }
            }
            if (tpl.symbol === '7') {
                if ((sample.zoning[0] + sample.zoning[1] + sample.zoning[2]) > 0.34 && sample.endPt[1] > 0.78 && sample.curvature < 3.4) {
                    score += 0.15;
                }
            }

            // Distinguishing '(', ')', '1', '/' and '^'
            if (sample.strokeCount === 1 && sample.holeCount === 0) {
                if (tpl.symbol === '/' && diagEnergy > 0.62 && sample.curvature < 1.0 && sample.startPt[0] > sample.endPt[0]) {
                    score += 0.20;
                }
                if (tpl.symbol === '(' && rawAspect < 0.62 && sample.signedCurvature < -1.1 && sample.startPt[1] < 0.25 && sample.endPt[1] > 0.75) {
                    score += 0.18;
                }
                if (tpl.symbol === ')' && rawAspect < 0.62 && sample.signedCurvature > 1.1 && sample.startPt[1] < 0.25 && sample.endPt[1] > 0.75) {
                    score += 0.18;
                }
                if (tpl.symbol === '^' && b.height < medianHeight * 0.75 && sample.startPt[1] > 0.55 && sample.endPt[1] > 0.55) {
                    score += 0.22;
                }
            }

            // Contextual cue: after digit, variables (e.g. 2x, 3y) receive a slight boost
            if (contextInfo.afterDigit && tpl.category === 'variable') {
                score += 0.04;
            }

            const clamped = Math.max(0.05, Math.min(0.99, score));
            if (!scoresBySymbol[tpl.symbol] || clamped > scoresBySymbol[tpl.symbol].score) {
                scoresBySymbol[tpl.symbol] = {
                    symbol: tpl.symbol,
                    category: tpl.category,
                    score: clamped
                };
            }
        });

        const ranked = Object.values(scoresBySymbol).sort((a, b) => b.score - a.score);
        const top = ranked[0];
        const second = ranked[1];
        const isUncertain = (top.score < 0.60) || (second && (top.score - second.score < 0.04));

        return {
            symbol: top.symbol,
            category: top.category,
            confidence: top.score,
            features: sample,
            topCandidates: ranked.slice(0, 4),
            uncertain: isUncertain
        };
    }
}

window.MARS.Vision.HybridClassifier = HybridClassifier;
