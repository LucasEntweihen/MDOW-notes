/**
 * MARS Statistics - Frequency Table Parser & Analyzer
 * Handles grouped data, class intervals, absolute and cumulative frequencies
 */
window.MARS = window.MARS || {};
window.MARS.Statistics = window.MARS.Statistics || {};

class FrequencyTableAnalyzer {
    /**
     * Build frequency table from continuous data using Sturges rule k = 1 + 3.322 * log10(n)
     */
    static buildFromRawData(values, customK = null) {
        if (!values || values.length === 0) return null;
        const valid = values.filter(v => typeof v === 'number' && isFinite(v));
        const n = valid.length;
        if (n === 0) return null;

        const min = Math.min(...valid);
        const max = Math.max(...valid);
        const range = max - min;

        const k = customK || Math.max(4, Math.round(1 + 3.322 * Math.log10(n)));
        const classWidth = range > 0 ? (range / k) * 1.02 : 1;

        const classes = [];
        for (let i = 0; i < k; i++) {
            const lower = min + i * classWidth;
            const upper = lower + classWidth;
            classes.push({
                index: i + 1,
                label: `[${lower.toFixed(2)}, ${upper.toFixed(2)})`,
                lower,
                upper,
                midpoint: (lower + upper) / 2,
                fi: 0,
                fr: 0,
                Fi: 0,
                Fr: 0
            });
        }

        valid.forEach(v => {
            let placed = false;
            for (let i = 0; i < k; i++) {
                if (v >= classes[i].lower && (v < classes[i].upper || (i === k - 1 && v <= classes[i].upper))) {
                    classes[i].fi++;
                    placed = true;
                    break;
                }
            }
            if (!placed) classes[k - 1].fi++;
        });

        let cumFi = 0;
        let sumMidFi = 0;
        classes.forEach(c => {
            c.fr = c.fi / n;
            cumFi += c.fi;
            c.Fi = cumFi;
            c.Fr = cumFi / n;
            sumMidFi += c.midpoint * c.fi;
        });

        const groupedMean = sumMidFi / n;

        return {
            n,
            k,
            classWidth,
            classes,
            groupedMean
        };
    }

    /**
     * Analyze pre-formed tabular data (e.g. from user input or recognition)
     */
    static analyzeGivenClasses(rows) {
        // rows: array of { label, midpoint, fi }
        if (!rows || rows.length === 0) return null;
        const n = rows.reduce((acc, r) => acc + (r.fi || 0), 0);
        if (n === 0) return null;

        let cumFi = 0;
        let sumMidFi = 0;
        const processed = rows.map((r, idx) => {
            const fi = r.fi || 0;
            const fr = fi / n;
            cumFi += fi;
            const mid = typeof r.midpoint === 'number' ? r.midpoint : idx + 1;
            sumMidFi += mid * fi;
            return {
                index: idx + 1,
                label: r.label || `Classe ${idx + 1}`,
                midpoint: mid,
                fi,
                fr,
                Fi: cumFi,
                Fr: cumFi / n
            };
        });

        const groupedMean = sumMidFi / n;

        return {
            n,
            classes: processed,
            groupedMean
        };
    }
}

window.MARS.Statistics.FrequencyTableAnalyzer = FrequencyTableAnalyzer;
