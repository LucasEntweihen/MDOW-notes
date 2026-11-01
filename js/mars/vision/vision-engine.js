/**
 * MARS Vision - MARSVision Engine
 * Coordinates visual capture, pre-processing, segmentation, classification and region analysis
 */
window.MARS = window.MARS || {};
window.MARS.Vision = window.MARS.Vision || {};

class MARSVisionEngine {
    constructor() {
        this.classifier = new window.MARS.Vision.HybridClassifier();
        this.initialized = false;
    }

    init() {
        if (!this.initialized) {
            this.classifier.buildTemplates();
            this.initialized = true;
        }
        return this;
    }

    /**
     * Process raw strokes into classified clusters with bounding boxes and hypotheses
     */
    processStrokes(strokes, context = {}) {
        this.init();

        if (!strokes || strokes.length === 0) {
            return {
                clusters: [],
                region: { type: window.MARS.Core.Types.RegionType.EQUATION, confidence: 1.0 },
                averageConfidence: 0
            };
        }

        // 1. Topological Segmentation
        const clusters = window.MARS.Vision.TopologicalSegmenter.segment(strokes);
        if (clusters.length === 0) {
            return {
                clusters: [],
                region: { type: window.MARS.Core.Types.RegionType.EQUATION, confidence: 1.0 },
                averageConfidence: 0
            };
        }

        const heights = clusters.map(c => c.bbox.height).sort((a, b) => a - b);
        const medianHeight = heights[Math.floor(heights.length / 2)] || 55;

        // 2. Multi-Hypothesis Classification per cluster
        const classifiedClusters = [];
        let totalConf = 0;

        for (let idx = 0; idx < clusters.length; idx++) {
            const cluster = clusters[idx];
            const prevRec = idx > 0 ? classifiedClusters[idx - 1].recognized : null;
            const afterDigit = prevRec && prevRec.category === 'digit';

            const recognized = this.classifier.classify(cluster, medianHeight, { afterDigit, ...context });
            totalConf += recognized.confidence;

            classifiedClusters.push({
                ...cluster,
                index: idx + 1,
                recognized
            });
        }

        const avgConfidence = totalConf / Math.max(1, classifiedClusters.length);

        // 3. Region detection
        const region = window.MARS.Vision.RegionDetector.detectRegion(classifiedClusters, strokes);

        return {
            clusters: classifiedClusters,
            region,
            averageConfidence: avgConfidence
        };
    }
}

window.MARS.Vision.MARSVisionEngine = MARSVisionEngine;
window.MARS.Vision.instance = new MARSVisionEngine();
