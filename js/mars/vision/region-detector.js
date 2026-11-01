/**
 * MARS Vision - Region Detector
 * Segregates canvas visual elements into Equations, Statistical Tables, Charts or Text
 */
window.MARS = window.MARS || {};
window.MARS.Vision = window.MARS.Vision || {};

class RegionDetector {
    /**
     * Analyze classified clusters and spatial stroke layout to identify region type
     */
    static detectRegion(clusters, allStrokes = []) {
        if (!clusters || clusters.length === 0) {
            return {
                type: window.MARS.Core.Types.RegionType.EQUATION,
                confidence: 1.0,
                clusters: []
            };
        }

        // Check if there are horizontal and vertical grid dividers (suggesting a table)
        const straightLines = allStrokes.filter(st => {
            const b = st.bbox;
            const aspect = b.width / Math.max(1, b.height);
            return (aspect > 3.5 || aspect < 0.28) && (b.width > 70 || b.height > 70);
        });

        // Group clusters by vertical lines (Y centers)
        const yCenters = clusters.map(c => c.bbox.minY + c.bbox.height / 2);
        const ySorted = [...yCenters].sort((a, b) => a - b);
        let rowCount = 1;
        let lastY = ySorted[0];
        for (let i = 1; i < ySorted.length; i++) {
            if (ySorted[i] - lastY > 24) {
                rowCount++;
                lastY = ySorted[i];
            }
        }

        // Check for Statistical Frequency Table: Multiple rows with numbers and table dividers
        if (rowCount >= 3 && straightLines.length >= 1) {
            return {
                type: window.MARS.Core.Types.RegionType.STATS_TABLE,
                confidence: 0.88,
                rowCount,
                clusters
            };
        }

        // Check for Statistical Chart: Presence of perpendicular axes and scatter points / bars
        const hasPerpendicularAxes = straightLines.length >= 2;
        if (hasPerpendicularAxes && clusters.length > 5) {
            return {
                type: window.MARS.Core.Types.RegionType.CHART,
                confidence: 0.82,
                clusters
            };
        }

        // Default to Mathematical Expression / Equation
        return {
            type: window.MARS.Core.Types.RegionType.EQUATION,
            confidence: 0.95,
            clusters
        };
    }
}

window.MARS.Vision.RegionDetector = RegionDetector;
